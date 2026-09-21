import type { SyncClient } from './index';
import type { MutationHandle, MutationResult } from './mutation';
import { copyJson } from './hydration';
import type { SyncSnapshot } from './hydration';
import type { LocalSyncSnapshot } from './local-hydration';

/** One owner per key; setItem must atomically replace a complete string. */
export type SyncStorage = Readonly<{
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}>;

export type SyncPersistenceOptions = Readonly<{
  key: string;
  buster: string;
  /** Maximum age in milliseconds. Defaults to Infinity. */
  maxAge?: number;
}>;

type StoredBaseline = Readonly<{
  schemaVersion: 1;
  buster: string;
  savedAt: number;
  snapshot: SyncSnapshot;
}>;

type StoredLocalBaseline = Readonly<{
  schemaVersion: 1;
  buster: string;
  savedAt: number;
  snapshot: LocalSyncSnapshot;
}>;

function nonempty(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0)
    throw new TypeError(`${name} must be a nonempty string.`);
}

function timestamp(value: unknown, name: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    throw new TypeError(`${name} must be a finite nonnegative timestamp.`);
}

function checkOptions(options: SyncPersistenceOptions) {
  nonempty(options.key, 'key');
  nonempty(options.buster, 'buster');
  if (
    options.maxAge !== undefined &&
    (typeof options.maxAge !== 'number' ||
      Number.isNaN(options.maxAge) ||
      options.maxAge < 0)
  )
    throw new RangeError('maxAge must be nonnegative.');
}

/** Save only the clean server baseline accepted by client.dehydrate(). */
export async function saveSyncSnapshot(
  client: SyncClient,
  storage: SyncStorage,
  options: SyncPersistenceOptions
): Promise<void> {
  checkOptions(options);
  const snapshot = client.dehydrate();
  const value: StoredBaseline = {
    schemaVersion: 1,
    buster: options.buster,
    savedAt: Date.now(),
    snapshot,
  };
  await storage.setItem(options.key, JSON.stringify(value));
}

/** Return false for absent, expired, or differently busted data. */
export async function restoreSyncSnapshot(
  client: SyncClient,
  storage: SyncStorage,
  options: SyncPersistenceOptions
): Promise<boolean> {
  checkOptions(options);
  const text = await storage.getItem(options.key);
  if (text === null) return false;
  const stored: unknown = JSON.parse(text);
  if (!stored || typeof stored !== 'object')
    throw new TypeError('Invalid persisted sync snapshot.');
  const envelope = stored as Partial<StoredBaseline>;
  if (envelope.schemaVersion !== 1)
    throw new TypeError('Unsupported persisted sync snapshot schema version.');
  nonempty(envelope.buster, 'persisted buster');
  timestamp(envelope.savedAt, 'persisted savedAt');
  if (envelope.buster !== options.buster) return false;
  const age = Date.now() - envelope.savedAt;
  if (age < 0 || age > (options.maxAge ?? Infinity)) return false;
  client.hydrate(envelope.snapshot as SyncSnapshot);
  return true;
}

/** Preserve dirty resource edits and unconfirmed baselines separately. */
export async function saveLocalSyncSnapshot(
  client: SyncClient,
  storage: SyncStorage,
  options: SyncPersistenceOptions
): Promise<void> {
  checkOptions(options);
  const snapshot = client.dehydrateLocal();
  const value: StoredLocalBaseline = {
    schemaVersion: 1,
    buster: options.buster,
    savedAt: Date.now(),
    snapshot,
  };
  await storage.setItem(options.key, JSON.stringify(value));
}

/** Return false for absent, expired, or differently busted local data. */
export async function restoreLocalSyncSnapshot(
  client: SyncClient,
  storage: SyncStorage,
  options: SyncPersistenceOptions
): Promise<boolean> {
  checkOptions(options);
  const text = await storage.getItem(options.key);
  if (text === null) return false;
  const stored: unknown = JSON.parse(text);
  if (!stored || typeof stored !== 'object')
    throw new TypeError('Invalid persisted local sync snapshot.');
  const envelope = stored as Partial<StoredLocalBaseline>;
  if (envelope.schemaVersion !== 1)
    throw new TypeError('Unsupported persisted local snapshot schema version.');
  nonempty(envelope.buster, 'persisted buster');
  timestamp(envelope.savedAt, 'persisted savedAt');
  if (envelope.buster !== options.buster) return false;
  const age = Date.now() - envelope.savedAt;
  if (age < 0 || age > (options.maxAge ?? Infinity)) return false;
  client.hydrateLocal(envelope.snapshot as LocalSyncSnapshot);
  return true;
}

export type PersistedMutationJob = Readonly<{
  id: string;
  command: string;
  input: unknown;
  idempotencyKey: string;
  enqueuedAt: number;
  state: 'queued' | 'inFlight' | 'unknown' | 'rejected';
}>;

type StoredQueue = Readonly<{
  schemaVersion: 1;
  buster: string;
  savedAt: number;
  jobs: readonly PersistedMutationJob[];
}>;

export type PersistedMutationQueueOptions = Readonly<{
  storage: SyncStorage;
  key: string;
  buster: string;
  /** Hold commands older than this many milliseconds. Defaults to Infinity. */
  maxAge?: number;
  /** Recreate command handles for each new client before opening the queue. */
  commands: Readonly<Record<string, MutationHandle<any, any>>>;
  isOnline?: () => boolean;
}>;

export type PersistedMutationQueue = Readonly<{
  entries: () => readonly PersistedMutationJob[];
  enqueue: (job: {
    id: string;
    command: string;
    input: unknown;
    idempotencyKey: string;
  }) => Promise<void>;
  /** Runs queued commands in order; never runs unknown jobs. */
  resume: () => Promise<
    readonly { id: string; result: MutationResult<unknown> }[]
  >;
  /** Explicitly stage an unknown operation for replay with the same key. */
  retryUnknown: (id: string) => Promise<void>;
  discard: (id: string) => Promise<void>;
}>;

function copyInput(input: unknown): unknown {
  try {
    return copyJson(input);
  } catch {
    throw new TypeError(
      'Command input must be an acyclic JSON-compatible tree.'
    );
  }
}

function parseJob(value: unknown): PersistedMutationJob {
  if (!value || typeof value !== 'object')
    throw new TypeError('Invalid persisted mutation job.');
  const job = value as Partial<PersistedMutationJob>;
  nonempty(job.id, 'job id');
  nonempty(job.command, 'job command');
  nonempty(job.idempotencyKey, 'job idempotencyKey');
  timestamp(job.enqueuedAt, 'job enqueuedAt');
  if (
    job.state !== 'queued' &&
    job.state !== 'inFlight' &&
    job.state !== 'unknown' &&
    job.state !== 'rejected'
  )
    throw new TypeError('Invalid persisted mutation job state.');
  return Object.freeze({
    id: job.id,
    command: job.command,
    input: copyInput(job.input),
    idempotencyKey: job.idempotencyKey,
    enqueuedAt: job.enqueuedAt,
    state: job.state,
  });
}

/** The queue stores standalone DTO commands, never resource submissions. */
export async function openPersistedMutationQueue(
  options: PersistedMutationQueueOptions
): Promise<PersistedMutationQueue> {
  checkOptions(options);
  const raw = await options.storage.getItem(options.key);
  let jobs: readonly PersistedMutationJob[] = [];
  if (raw !== null) {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object')
      throw new TypeError('Invalid persisted mutation queue.');
    const stored = parsed as Partial<StoredQueue>;
    if (stored.schemaVersion !== 1)
      throw new TypeError(
        'Unsupported persisted mutation queue schema version.'
      );
    nonempty(stored.buster, 'persisted buster');
    timestamp(stored.savedAt, 'persisted savedAt');
    if (stored.buster !== options.buster)
      throw new TypeError('Persisted mutation queue buster differs.');
    if (!Array.isArray(stored.jobs))
      throw new TypeError('Persisted mutation jobs must be an array.');
    jobs = stored.jobs.map(parseJob);
    const ids = new Set(jobs.map(job => job.id));
    if (ids.size !== jobs.length)
      throw new TypeError('Repeated persisted mutation job id.');
    const keys = new Set(jobs.map(job => job.idempotencyKey));
    if (keys.size !== jobs.length)
      throw new TypeError('Repeated persisted idempotency key.');
  }
  const persist = async (next: readonly PersistedMutationJob[]) => {
    const record: StoredQueue = {
      schemaVersion: 1,
      buster: options.buster,
      savedAt: Date.now(),
      jobs: next,
    };
    await options.storage.setItem(options.key, JSON.stringify(record));
    jobs = next;
  };
  if (jobs.some(job => job.state === 'inFlight')) {
    await persist(
      jobs.map(job =>
        job.state === 'inFlight'
          ? Object.freeze({ ...job, state: 'unknown' as const })
          : job
      )
    );
  }
  let tail = Promise.resolve();
  const serialize = <T>(task: () => Promise<T>): Promise<T> => {
    const result = tail.then(task);
    tail = result.then(
      () => {},
      () => {}
    );
    return result;
  };
  const replace = (id: string, state: PersistedMutationJob['state']) =>
    persist(
      jobs.map(job => (job.id === id ? Object.freeze({ ...job, state }) : job))
    );
  const get = (id: string) => {
    const job = jobs.find(item => item.id === id);
    if (!job) throw new Error(`No persisted mutation job: ${id}`);
    return job;
  };
  return Object.freeze({
    entries: () =>
      jobs.map(job => Object.freeze({ ...job, input: copyInput(job.input) })),
    enqueue: job =>
      serialize(async () => {
        nonempty(job.id, 'job id');
        nonempty(job.command, 'job command');
        nonempty(job.idempotencyKey, 'job idempotencyKey');
        if (jobs.some(item => item.id === job.id))
          throw new TypeError('Repeated persisted mutation job id.');
        if (jobs.some(item => item.idempotencyKey === job.idempotencyKey))
          throw new TypeError('Repeated persisted idempotency key.');
        if (
          !Object.prototype.hasOwnProperty.call(options.commands, job.command)
        )
          throw new TypeError(`No mutation command registered: ${job.command}`);
        const next: PersistedMutationJob = Object.freeze({
          id: job.id,
          command: job.command,
          input: copyInput(job.input),
          idempotencyKey: job.idempotencyKey,
          enqueuedAt: Date.now(),
          state: 'queued',
        });
        await persist([...jobs, next]);
      }),
    resume: () =>
      serialize(async () => {
        const results: { id: string; result: MutationResult<unknown> }[] = [];
        for (const queued of [...jobs]) {
          if (queued.state === 'unknown' || queued.state === 'inFlight') break;
          if (queued.state === 'rejected') continue;
          const age = Date.now() - queued.enqueuedAt;
          if (age < 0 || age > (options.maxAge ?? Infinity)) break;
          if (options.isOnline && !options.isOnline()) break;
          const command = Object.prototype.hasOwnProperty.call(
            options.commands,
            queued.command
          )
            ? options.commands[queued.command]
            : undefined;
          if (!command)
            throw new TypeError(
              `No mutation command registered: ${queued.command}`
            );
          await replace(queued.id, 'inFlight');
          let result: MutationResult<unknown>;
          try {
            result = await command.run(copyInput(queued.input), {
              idempotencyKey: queued.idempotencyKey,
            });
          } catch (error) {
            result = { kind: 'unknown', operationId: -1, error };
          }
          if (result.kind === 'success') {
            await persist(jobs.filter(job => job.id !== queued.id));
          } else {
            await replace(
              queued.id,
              result.kind === 'rejected' ? 'rejected' : 'unknown'
            );
          }
          results.push({ id: queued.id, result });
          if (result.kind === 'unknown' || result.kind === 'sync-error') break;
        }
        return results;
      }),
    retryUnknown: id =>
      serialize(async () => {
        const job = get(id);
        if (job.state !== 'unknown' && job.state !== 'inFlight')
          throw new TypeError('Only unknown jobs can be staged for retry.');
        await replace(id, 'queued');
      }),
    discard: id =>
      serialize(async () => {
        const job = get(id);
        if (job.state === 'inFlight')
          throw new TypeError('An in-flight job cannot be discarded.');
        await persist(jobs.filter(item => item.id !== id));
      }),
  });
}
