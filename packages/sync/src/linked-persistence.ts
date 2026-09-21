import type { QueryHandle, SyncClient } from './index';
import type { QueryKey } from './key';
import { hashQueryKey } from './key';
import type { MutationHandle, MutationResult } from './mutation';
import type { LocalHydratedQuery, LocalSyncSnapshot } from './local-hydration';
import { parseLocalSnapshot } from './local-hydration';
import { copyJson } from './hydration';
import type { SyncStorage } from './persistence';

type Acceptance = 'none' | 'submitted' | 'refetch';
type JobState =
  | 'queued'
  | 'inFlight'
  | 'unknown'
  | 'rejected'
  | 'success'
  | 'sync-error';

type SelectedChange = Readonly<{
  id: number;
  path: readonly string[];
  after: unknown;
}>;

export type PersistedLinkedMutationJob = Readonly<{
  id: string;
  input: unknown;
  idempotencyKey: string;
  queryKey: QueryKey;
  version: number;
  selected: readonly SelectedChange[];
  accept: Acceptance;
  onReject: 'keep' | 'remove';
  enqueuedAt: number;
  state: JobState;
}>;

export type StageLinkedMutation = Readonly<{
  id: string;
  input: unknown;
  idempotencyKey: string;
  ids?: readonly number[];
  accept?: Acceptance;
  onReject?: 'keep' | 'remove';
}>;

export type PersistedLinkedMutationOptions = Readonly<{
  storage: SyncStorage;
  key: string;
  buster: string;
  /** Queued submissions older than this are held. Defaults to Infinity. */
  maxAge?: number;
  isOnline?: () => boolean;
}>;

export type PersistedLinkedMutation = Readonly<{
  entry: () => PersistedLinkedMutationJob | null;
  snapshot: () => LocalSyncSnapshot | null;
  /** Restore into an empty client before opening query handles. */
  restore: (client: SyncClient) => boolean;
  stage: <T>(
    client: SyncClient,
    query: QueryHandle<T>,
    input: StageLinkedMutation
  ) => Promise<void>;
  /** Returns null while offline or expired; only queued jobs can be sent. */
  send: <I, T>(
    client: SyncClient,
    query: QueryHandle<any>,
    mutation: MutationHandle<I, T>
  ) => Promise<MutationResult<T> | null>;
  discard: () => Promise<void>;
}>;

type StoredRecord = Readonly<{
  schemaVersion: 1;
  buster: string;
  savedAt: number;
  job: PersistedLinkedMutationJob;
  snapshot: LocalSyncSnapshot;
}>;

function nonempty(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || !value)
    throw new TypeError(`${name} must be a nonempty string.`);
}

function timestamp(value: unknown, name: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    throw new TypeError(`${name} must be a finite nonnegative timestamp.`);
}

function integer(value: unknown, name: string, minimum: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum)
    throw new TypeError(`${name} must be an integer at least ${minimum}.`);
  return value as number;
}

function matchingQuery(
  snapshot: LocalSyncSnapshot,
  key: QueryKey
): LocalHydratedQuery {
  const hash = hashQueryKey(key);
  const found = parseLocalSnapshot(snapshot).find(
    item => hashQueryKey(item.queryKey) === hash
  );
  if (!found || !found.local)
    throw new TypeError('Linked submission requires a loaded editable query.');
  return found;
}

function selectedChanges(
  query: LocalHydratedQuery,
  ids: readonly number[]
): readonly SelectedChange[] {
  if (new Set(ids).size !== ids.length)
    throw new TypeError('Repeated selected change ID.');
  return ids.map(id => {
    integer(id, 'selected change ID', 1);
    const edit = query.local!.edits.find(item => item.id === id);
    if (!edit) throw new TypeError('Unknown selected change ID.');
    return {
      id,
      path: edit.path,
      after: edit.after,
    };
  });
}

function parseRecord(raw: string, buster: string): StoredRecord {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object')
    throw new TypeError('Invalid persisted linked mutation.');
  const record = value as Partial<StoredRecord>;
  if (record.schemaVersion !== 1)
    throw new TypeError('Unsupported linked mutation schema version.');
  nonempty(record.buster, 'persisted buster');
  timestamp(record.savedAt, 'persisted savedAt');
  if (record.buster !== buster)
    throw new TypeError('Persisted linked mutation buster differs.');
  const job = record.job as Partial<PersistedLinkedMutationJob> | undefined;
  if (!job || typeof job !== 'object')
    throw new TypeError('Invalid persisted linked mutation job.');
  nonempty(job.id, 'job id');
  nonempty(job.idempotencyKey, 'job idempotencyKey');
  timestamp(job.enqueuedAt, 'job enqueuedAt');
  integer(job.version, 'job version', 0);
  if (
    job.state !== 'queued' &&
    job.state !== 'inFlight' &&
    job.state !== 'unknown' &&
    job.state !== 'rejected' &&
    job.state !== 'success' &&
    job.state !== 'sync-error'
  )
    throw new TypeError('Invalid persisted linked mutation state.');
  if (
    job.accept !== 'none' &&
    job.accept !== 'submitted' &&
    job.accept !== 'refetch'
  )
    throw new TypeError('Invalid persisted acceptance policy.');
  if (job.onReject !== 'keep' && job.onReject !== 'remove')
    throw new TypeError('Invalid persisted rejection policy.');
  const key = JSON.parse(hashQueryKey(job.queryKey as QueryKey)) as QueryKey;
  if (!Array.isArray(job.selected))
    throw new TypeError('Selected changes must be an array.');
  const snapshot = copyJson(record.snapshot) as LocalSyncSnapshot;
  const query = matchingQuery(snapshot, key);
  const selected = copyJson(job.selected) as readonly SelectedChange[];
  const ids = selected.map(item => {
    if (!item || typeof item !== 'object' || !Array.isArray(item.path))
      throw new TypeError('Invalid selected change.');
    integer(item.id, 'selected change ID', 1);
    if (!item.path.every(part => typeof part === 'string'))
      throw new TypeError('Invalid selected change path.');
    return item.id;
  });
  if (new Set(ids).size !== ids.length)
    throw new TypeError('Repeated selected change ID.');
  if (job.state === 'queued') {
    const expected = selectedChanges(query, ids);
    if (job.version !== query.local!.revision)
      throw new TypeError('Queued submission version differs from snapshot.');
    if (
      JSON.stringify(copyJson(selected)) !== JSON.stringify(copyJson(expected))
    )
      throw new TypeError('Queued selected changes differ from snapshot.');
  }
  return {
    schemaVersion: 1,
    buster,
    savedAt: record.savedAt,
    job: {
      id: job.id,
      input: copyJson(job.input),
      idempotencyKey: job.idempotencyKey,
      queryKey: key,
      version: job.version as number,
      selected,
      accept: job.accept,
      onReject: job.onReject,
      enqueuedAt: job.enqueuedAt,
      state: job.state,
    },
    snapshot,
  };
}

/** One explicit linked submission per storage key; no automatic replay. */
export async function openPersistedLinkedMutation(
  options: PersistedLinkedMutationOptions
): Promise<PersistedLinkedMutation> {
  nonempty(options.key, 'key');
  nonempty(options.buster, 'buster');
  if (
    options.maxAge !== undefined &&
    (typeof options.maxAge !== 'number' ||
      Number.isNaN(options.maxAge) ||
      options.maxAge < 0)
  )
    throw new RangeError('maxAge must be nonnegative.');
  const raw = await options.storage.getItem(options.key);
  let record = raw === null ? null : parseRecord(raw, options.buster);
  const persist = async (next: StoredRecord) => {
    await options.storage.setItem(options.key, JSON.stringify(next));
    record = next;
  };
  if (record?.job.state === 'inFlight') {
    await persist({
      ...record,
      savedAt: Date.now(),
      job: { ...record.job, state: 'unknown' },
    });
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
  return Object.freeze({
    entry: () =>
      record ? (copyJson(record.job) as PersistedLinkedMutationJob) : null,
    snapshot: () =>
      record ? (copyJson(record.snapshot) as LocalSyncSnapshot) : null,
    restore: (client: SyncClient) => {
      if (!record) return false;
      client.hydrateLocal(copyJson(record.snapshot) as LocalSyncSnapshot);
      return true;
    },
    stage: <T>(
      client: SyncClient,
      query: QueryHandle<T>,
      input: StageLinkedMutation
    ) =>
      serialize(async () => {
        if (record)
          throw new Error('Discard the existing linked submission first.');
        nonempty(input.id, 'job id');
        nonempty(input.idempotencyKey, 'job idempotencyKey');
        const accept = input.accept ?? 'none';
        if (accept !== 'none' && accept !== 'submitted' && accept !== 'refetch')
          throw new TypeError('Unsupported persisted acceptance policy.');
        const onReject = input.onReject ?? 'keep';
        if (onReject !== 'keep' && onReject !== 'remove')
          throw new TypeError('Invalid persisted rejection policy.');
        if (query.status.unconfirmed.value)
          throw new Error('Reconcile the unconfirmed query before staging.');
        const submission = query.capture(input.ids);
        const snapshot = client.dehydrateLocal();
        const key = JSON.parse(hashQueryKey(query.queryKey)) as QueryKey;
        const matched = matchingQuery(snapshot, key);
        if (
          matched.local!.revision !== submission.version ||
          hashQueryKey([matched.local!.current]) !==
            hashQueryKey([submission.value])
        )
          throw new TypeError('Linked query differs from the client snapshot.');
        const selected = selectedChanges(
          matched,
          submission.changes.map(change => change.id)
        );
        if (
          hashQueryKey([selected]) !==
          hashQueryKey([
            submission.changes.map(change => ({
              id: change.id,
              path: change.path,
              after: change.after.value,
            })),
          ])
        )
          throw new TypeError('Linked edits differ from the client snapshot.');
        await persist({
          schemaVersion: 1,
          buster: options.buster,
          savedAt: Date.now(),
          job: {
            id: input.id,
            input: copyJson(input.input),
            idempotencyKey: input.idempotencyKey,
            queryKey: key,
            version: submission.version,
            selected,
            accept,
            onReject,
            enqueuedAt: Date.now(),
            state: 'queued',
          },
          snapshot,
        });
      }),
    send: <I, T>(
      client: SyncClient,
      query: QueryHandle<any>,
      mutation: MutationHandle<I, T>
    ) =>
      serialize(async (): Promise<MutationResult<T> | null> => {
        if (!record || record.job.state !== 'queued')
          throw new TypeError('No queued linked submission to send.');
        const previous = record;
        const job = previous.job;
        const age = Date.now() - job.enqueuedAt;
        if (age < 0 || age > (options.maxAge ?? Infinity)) return null;
        if (options.isOnline && !options.isOnline()) return null;
        if (hashQueryKey(query.queryKey) !== hashQueryKey(job.queryKey))
          throw new TypeError('Linked query key differs from the submission.');
        const current = client.dehydrateLocal();
        const currentQuery = matchingQuery(current, job.queryKey);
        const stagedQuery = matchingQuery(previous.snapshot, job.queryKey);
        if (
          JSON.stringify(copyJson(currentQuery)) !==
          JSON.stringify(copyJson(stagedQuery))
        )
          throw new Error('Linked query changed; discard and stage again.');
        const submission = query.capture(job.selected.map(item => item.id));
        if (submission.version !== job.version)
          throw new Error('Linked query changed; discard and stage again.');
        const conservative: LocalSyncSnapshot = {
          ...previous.snapshot,
          queries: previous.snapshot.queries.map(item =>
            hashQueryKey(item.queryKey) === hashQueryKey(job.queryKey)
              ? { ...item, invalidated: true, unconfirmed: true }
              : item
          ),
        };
        await persist({
          ...previous,
          savedAt: Date.now(),
          job: { ...job, state: 'inFlight' },
          snapshot: conservative,
        });
        let result: MutationResult<T>;
        try {
          result = await mutation.run(copyJson(job.input) as I, {
            idempotencyKey: job.idempotencyKey,
            links: [
              {
                query,
                submission,
                accept: { kind: job.accept },
                onReject: job.onReject,
              },
            ],
          });
        } catch (error) {
          result = { kind: 'unknown', operationId: -1, error };
        }
        let settledSnapshot = conservative;
        try {
          settledSnapshot = client.dehydrateLocal();
        } catch {
          // Another active READ may prevent a complete local checkpoint.
        }
        await persist({
          ...previous,
          savedAt: Date.now(),
          job: { ...job, state: result.kind },
          snapshot: settledSnapshot,
        });
        return result;
      }),
    discard: () =>
      serialize(async () => {
        if (!record) return;
        if (record.job.state === 'inFlight')
          throw new TypeError('An in-flight submission cannot be discarded.');
        await options.storage.removeItem(options.key);
        record = null;
      }),
  });
}
