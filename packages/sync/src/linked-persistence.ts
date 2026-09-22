import type { QueryHandle, SyncClient } from './index';
import type { QueryKey } from './key';
import { hashQueryKey } from './key';
import type { MutationHandle, MutationResult } from './mutation';
import type { ResourceChange } from './resource';
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

export type PersistedLinkedMutationLink = Readonly<{
  queryKey: QueryKey;
  version: number;
  selected: readonly SelectedChange[];
  accept: Acceptance;
  onReject: 'keep' | 'remove';
}>;

export type PersistedLinkedMutationJob = Readonly<{
  id: string;
  input: unknown;
  idempotencyKey: string;
  /** One entry per linked query; a query key appears at most once. */
  links: readonly PersistedLinkedMutationLink[];
  enqueuedAt: number;
  state: JobState;
}>;

export type StageLinkedMutationLink = Readonly<{
  query: QueryHandle<any>;
  ids?: readonly number[];
  accept?: Acceptance;
  onReject?: 'keep' | 'remove';
}>;

export type StageLinkedMutation = Readonly<{
  id: string;
  input: unknown;
  idempotencyKey: string;
  links: readonly StageLinkedMutationLink[];
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
  stage: (client: SyncClient, input: StageLinkedMutation) => Promise<void>;
  /**
   * Returns null while offline or expired; only queued jobs can be sent. The
   * handles must match the stored link keys exactly, in any order.
   */
  send: <I, T>(
    client: SyncClient,
    queries: readonly QueryHandle<any>[],
    mutation: MutationHandle<I, T>
  ) => Promise<MutationResult<T> | null>;
  discard: () => Promise<void>;
}>;

type StoredRecord = Readonly<{
  schemaVersion: 2;
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

function assertDistinct(keys: readonly QueryKey[]) {
  const hashes = keys.map(key => hashQueryKey(key));
  if (new Set(hashes).size !== hashes.length)
    throw new TypeError('A query may be linked only once per submission.');
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

function parseLink(
  value: unknown,
  snapshot: LocalSyncSnapshot,
  queued: boolean
): PersistedLinkedMutationLink {
  if (!value || typeof value !== 'object')
    throw new TypeError('Invalid persisted linked mutation link.');
  const link = value as Partial<PersistedLinkedMutationLink>;
  integer(link.version, 'link version', 0);
  if (
    link.accept !== 'none' &&
    link.accept !== 'submitted' &&
    link.accept !== 'refetch'
  )
    throw new TypeError('Invalid persisted acceptance policy.');
  if (link.onReject !== 'keep' && link.onReject !== 'remove')
    throw new TypeError('Invalid persisted rejection policy.');
  const key = JSON.parse(hashQueryKey(link.queryKey as QueryKey)) as QueryKey;
  if (!Array.isArray(link.selected))
    throw new TypeError('Selected changes must be an array.');
  const selected = copyJson(link.selected) as readonly SelectedChange[];
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
  const query = matchingQuery(snapshot, key);
  if (queued) {
    // An unsent job must still describe the snapshot it was captured from.
    const expected = selectedChanges(query, ids);
    if (link.version !== query.local!.revision)
      throw new TypeError('Queued submission version differs from snapshot.');
    if (
      JSON.stringify(copyJson(selected)) !== JSON.stringify(copyJson(expected))
    )
      throw new TypeError('Queued selected changes differ from snapshot.');
  }
  return {
    queryKey: key,
    version: link.version as number,
    selected,
    accept: link.accept,
    onReject: link.onReject,
  };
}

function parseRecord(raw: string, buster: string): StoredRecord {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object')
    throw new TypeError('Invalid persisted linked mutation.');
  const record = value as Partial<StoredRecord>;
  if (record.schemaVersion !== 2)
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
  if (
    job.state !== 'queued' &&
    job.state !== 'inFlight' &&
    job.state !== 'unknown' &&
    job.state !== 'rejected' &&
    job.state !== 'success' &&
    job.state !== 'sync-error'
  )
    throw new TypeError('Invalid persisted linked mutation state.');
  if (!Array.isArray(job.links) || !job.links.length)
    throw new TypeError('A linked submission requires at least one link.');
  const snapshot = copyJson(record.snapshot) as LocalSyncSnapshot;
  const links = job.links.map(link =>
    parseLink(link, snapshot, job.state === 'queued')
  );
  assertDistinct(links.map(link => link.queryKey));
  return {
    schemaVersion: 2,
    buster,
    savedAt: record.savedAt,
    job: {
      id: job.id,
      input: copyJson(job.input),
      idempotencyKey: job.idempotencyKey,
      links,
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
    stage: (client: SyncClient, input: StageLinkedMutation) =>
      serialize(async () => {
        if (record)
          throw new Error('Discard the existing linked submission first.');
        nonempty(input.id, 'job id');
        nonempty(input.idempotencyKey, 'job idempotencyKey');
        if (!Array.isArray(input.links) || !input.links.length)
          throw new TypeError(
            'A linked submission requires at least one link.'
          );
        assertDistinct(input.links.map(link => link.query.queryKey));
        for (const link of input.links) {
          if (link.query.status.unconfirmed.value)
            throw new Error('Reconcile the unconfirmed query before staging.');
        }
        // Capture every link before writing, so one mismatch stores nothing.
        const snapshot = client.dehydrateLocal();
        const links = input.links.map(link => {
          const accept = link.accept ?? 'none';
          if (
            accept !== 'none' &&
            accept !== 'submitted' &&
            accept !== 'refetch'
          )
            throw new TypeError('Unsupported persisted acceptance policy.');
          const onReject = link.onReject ?? 'keep';
          if (onReject !== 'keep' && onReject !== 'remove')
            throw new TypeError('Invalid persisted rejection policy.');
          const submission = link.query.capture(link.ids);
          const key = JSON.parse(hashQueryKey(link.query.queryKey)) as QueryKey;
          const matched = matchingQuery(snapshot, key);
          if (
            matched.local!.revision !== submission.version ||
            hashQueryKey([matched.local!.current]) !==
              hashQueryKey([submission.value])
          )
            throw new TypeError(
              'Linked query differs from the client snapshot.'
            );
          const selected = selectedChanges(
            matched,
            submission.changes.map((change: ResourceChange) => change.id)
          );
          if (
            hashQueryKey([selected]) !==
            hashQueryKey([
              submission.changes.map((change: ResourceChange) => ({
                id: change.id,
                path: change.path,
                after: change.after.value,
              })),
            ])
          )
            throw new TypeError(
              'Linked edits differ from the client snapshot.'
            );
          return {
            queryKey: key,
            version: submission.version,
            selected,
            accept,
            onReject,
          };
        });
        await persist({
          schemaVersion: 2,
          buster: options.buster,
          savedAt: Date.now(),
          job: {
            id: input.id,
            input: copyJson(input.input),
            idempotencyKey: input.idempotencyKey,
            links,
            enqueuedAt: Date.now(),
            state: 'queued',
          },
          snapshot,
        });
      }),
    send: <I, T>(
      client: SyncClient,
      queries: readonly QueryHandle<any>[],
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
        assertDistinct(queries.map(query => query.queryKey));
        const byHash = new Map(
          queries.map(query => [hashQueryKey(query.queryKey), query])
        );
        if (byHash.size !== job.links.length)
          throw new TypeError(
            'Linked query handles differ from the submission.'
          );
        const current = client.dehydrateLocal();
        const links = job.links.map(link => {
          const query = byHash.get(hashQueryKey(link.queryKey));
          if (!query)
            throw new TypeError(
              'Linked query handles differ from the submission.'
            );
          const currentQuery = matchingQuery(current, link.queryKey);
          const stagedQuery = matchingQuery(previous.snapshot, link.queryKey);
          if (
            JSON.stringify(copyJson(currentQuery)) !==
            JSON.stringify(copyJson(stagedQuery))
          )
            throw new Error('Linked query changed; discard and stage again.');
          const submission = query.capture(link.selected.map(item => item.id));
          if (submission.version !== link.version)
            throw new Error('Linked query changed; discard and stage again.');
          return {
            query,
            submission,
            accept: { kind: link.accept },
            onReject: link.onReject,
          };
        });
        const staged = new Set(
          job.links.map(link => hashQueryKey(link.queryKey))
        );
        const conservative: LocalSyncSnapshot = {
          ...previous.snapshot,
          queries: previous.snapshot.queries.map(item =>
            staged.has(hashQueryKey(item.queryKey))
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
            links,
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
