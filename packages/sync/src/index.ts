import { create } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import { guardRef, guardedWatch } from './ref-guard';
import { hashQueryKey } from './key';
import type { QueryKey } from './key';
import { ResourceStore } from './resource';
import type { ResourceChange, ResourceSubmission } from './resource';
import { frozenCopy } from './tree';
import { createMutation } from './mutation';
import type { MutationHandle, MutationLink, MutationOptions } from './mutation';
import { copyJson, parseSnapshot } from './hydration';
import type { HydratedQuery, SyncSnapshot } from './hydration';

export { hashQueryKey } from './key';
export type { QueryKey } from './key';
export { MutationRejectedError } from './mutation';
export type {
  ResourceChange,
  ResourceValue,
  ResourceSubmission,
} from './resource';
export type {
  MutationHandle,
  MutationLink,
  MutationOperation,
  MutationOptions,
  MutationResult,
  MutationRunOptions,
  MutationStatus,
} from './mutation';
export type { HydratedQuery, SyncSnapshot } from './hydration';

export type QueryStatus = Readonly<{
  status: 'pending' | 'success' | 'error';
  fetchStatus: 'idle' | 'fetching';
  loaded: boolean;
  error: unknown | null;
  updatedAt: number | null;
  invalidated: boolean;
  dirty: boolean;
  conflicts: number;
  version: number;
  pending: number;
  /** A linked WRITE may have changed the server without a confirmed baseline. */
  unconfirmed: boolean;
}>;

export type QueryOptions<T> = Readonly<{
  queryKey: QueryKey;
  queryFn: (context: { signal: AbortSignal }) => Promise<T> | T;
  /** Defaults to true. Set false for data outside the editable plain tree. */
  editable?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?: number;
  retryDelay?: (attempt: number) => number;
  /** A known server value used only while the key has no baseline. */
  initialData?: T;
  /** Timestamp of initialData; defaults to the time it is installed. */
  initialUpdatedAt?: number;
}>;

export type QueryHandle<T> = Readonly<{
  ref: StateRefStore<T>;
  watch: Watch<T>;
  status: StateRefStore<QueryStatus>;
  watchStatus: Watch<QueryStatus>;
  load: () => Promise<T>;
  refetch: () => Promise<T>;
  invalidate: () => void;
  isDirty: () => boolean;
  changes: () => readonly ResourceChange[];
  version: () => number;
  capture: (ids?: readonly number[]) => ResourceSubmission<T>;
  /** Accept a known server value without a WRITE. */
  acceptServer: (value: T) => void;
  dispose: () => void;
}>;

export type SyncClient = Readonly<{
  query: <T>(options: QueryOptions<T>) => QueryHandle<T>;
  /** Return a fresh cached baseline or perform a READ. */
  fetch: <T>(options: QueryOptions<T>) => Promise<T>;
  /** Best-effort fetch that caches success and swallows load rejections. */
  prefetch: <T>(options: QueryOptions<T>) => Promise<void>;
  /** Return a confirmed cached baseline even when stale, or perform a READ. */
  ensure: <T>(options: QueryOptions<T>) => Promise<T>;
  mutation: <I, T>(options: MutationOptions<I, T>) => MutationHandle<I, T>;
  invalidate: (key: QueryKey) => void;
  remove: (key: QueryKey) => boolean;
  size: () => number;
  dehydrate: () => SyncSnapshot;
  /** Restore into an empty client before creating query handles. */
  hydrate: (snapshot: SyncSnapshot) => void;
}>;

function checkDuration(value: number, name: string) {
  if (value < 0 || Number.isNaN(value)) {
    throw new RangeError(`${name} must be nonnegative.`);
  }
}

function aborted(signal: AbortSignal) {
  if (!signal.aborted) return;
  throw new DOMException('Query was cancelled.', 'AbortError');
}

function waitRetry(delay: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Query was cancelled.', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      resolve();
    }, delay);
    const cancel = () => {
      clearTimeout(timer);
      reject(new DOMException('Query was cancelled.', 'AbortError'));
    };
    signal.addEventListener('abort', cancel, { once: true });
  });
}

class QueryEntry<T> {
  readonly statusStore = create<QueryStatus>(
    Object.freeze({
      status: 'pending',
      fetchStatus: 'idle',
      loaded: false,
      error: null,
      updatedAt: null,
      invalidated: false,
      dirty: false,
      conflicts: 0,
      version: 0,
      pending: 0,
      unconfirmed: false,
    }),
    { autoSync: false }
  );
  readonly statusAbort = new AbortController();
  readonly rawStatus = this.statusStore.watch(() => this.statusAbort.signal);
  resource: ResourceStore<T> | null = null;
  owners = 0;
  removed = false;
  private epoch = 0;
  private controller: AbortController | null = null;
  private pending: Promise<T> | null = null;
  private gcTimer: ReturnType<typeof setTimeout> | null = null;
  private statusValue: QueryStatus = this.rawStatus.value;
  private staged = false;
  private linked = 0;
  private options: QueryOptions<T>;

  constructor(
    readonly hash: string,
    options: QueryOptions<T>,
    private readonly ssr: boolean,
    private readonly evict: (hash: string, entry: QueryEntry<T>) => void
  ) {
    this.options = options;
  }

  configure(options: QueryOptions<T>) {
    this.assertCompatible(options);
    this.options = options;
    this.cancelGc();
  }

  assertCompatible(options: QueryOptions<T>) {
    if ((options.editable ?? true) !== (this.options.editable ?? true)) {
      throw new TypeError('A query key cannot mix editable and readonly data.');
    }
  }

  private snapshot(patch: Partial<QueryStatus> = {}) {
    this.statusValue = Object.freeze({
      ...this.statusValue,
      ...patch,
      dirty: this.resource?.isDirty() ?? false,
      conflicts: this.resource?.conflicts() ?? 0,
      version: this.resource?.version() ?? 0,
    });
    this.statusStore.updateRef.value = this.statusValue;
    this.staged = true;
  }

  private flush = () => {
    if (!this.staged) return;
    this.staged = false;
    this.statusStore.sync();
  };

  private publish(patch: Partial<QueryStatus> = {}) {
    this.snapshot(patch);
    this.flush();
  }

  attach() {
    if (this.removed) throw new Error('This query entry has expired.');
    this.owners += 1;
    this.cancelGc();
  }

  detach() {
    this.owners -= 1;
    this.scheduleGc();
  }

  private cancelGc() {
    if (this.gcTimer) clearTimeout(this.gcTimer);
    this.gcTimer = null;
  }

  private scheduleGc() {
    if (
      this.owners > 0 ||
      this.pending ||
      this.linked ||
      this.resource?.isDirty() ||
      this.statusValue.unconfirmed
    )
      return;
    const time = this.options.gcTime ?? (this.ssr ? Infinity : 300_000);
    if (!Number.isFinite(time)) return;
    this.cancelGc();
    this.gcTimer = setTimeout(() => this.evict(this.hash, this), time);
  }

  expire() {
    if (this.removed) return;
    this.removed = true;
    this.epoch += 1;
    this.controller?.abort();
    this.cancelGc();
    this.resource?.dispose();
    this.statusAbort.abort();
  }

  isStale(options: QueryOptions<T> = this.options) {
    const staleTime = options.staleTime ?? 0;
    checkDuration(staleTime, 'staleTime');
    return (
      !this.statusValue.loaded ||
      this.statusValue.invalidated ||
      Date.now() >= (this.statusValue.updatedAt ?? 0) + staleTime
    );
  }

  invalidate() {
    if (this.removed) return;
    this.epoch += 1;
    this.controller?.abort();
    this.controller = null;
    this.pending = null;
    this.publish({ invalidated: true, fetchStatus: 'idle' });
  }

  getResource() {
    if (this.removed) throw new Error('This query entry has expired.');
    if (!this.resource)
      throw new Error('Query data is not loaded. Call load() first.');
    return this.resource;
  }

  hasConfirmedBaseline() {
    return (
      this.statusValue.loaded &&
      this.resource !== null &&
      !this.statusValue.unconfirmed &&
      !this.linked
    );
  }

  serverValue(): T {
    const value = this.getResource().serverValue();
    return this.options.editable ?? true ? (frozenCopy(value) as T) : value;
  }

  isDirty() {
    return this.resource?.isDirty() ?? false;
  }

  isUnconfirmed() {
    return this.statusValue.unconfirmed;
  }

  changes() {
    return this.resource?.changes() ?? Object.freeze([]);
  }

  version() {
    return this.resource?.version() ?? 0;
  }

  dehydrate(): HydratedQuery | null {
    if (
      this.pending ||
      this.linked ||
      this.resource?.isDirty() ||
      this.statusValue.unconfirmed
    ) {
      throw new Error(
        `Query ${this.hash} has local or unresolved work; it cannot be dehydrated.`
      );
    }
    if (!this.statusValue.loaded) return null;
    if (
      this.statusValue.status !== 'success' ||
      !this.resource ||
      this.statusValue.updatedAt === null
    ) {
      throw new Error(`Query ${this.hash} has no settled successful baseline.`);
    }
    return Object.freeze({
      queryKey: JSON.parse(this.hash) as QueryKey,
      data: copyJson(this.resource.serverValue()),
      updatedAt: this.statusValue.updatedAt,
      invalidated: this.statusValue.invalidated,
      editable: this.options.editable ?? true,
    });
  }

  private seedBaseline(value: T, updatedAt: number, invalidated: boolean) {
    this.resource = new ResourceStore(
      value,
      this.options.editable ?? true,
      () => this.snapshot(),
      this.flush
    );
    this.publish({
      status: 'success',
      fetchStatus: 'idle',
      loaded: true,
      error: null,
      updatedAt,
      invalidated,
      unconfirmed: false,
    });
    this.scheduleGc();
  }

  seedInitial(value: T, updatedAt: number) {
    if (
      this.resource ||
      this.pending ||
      this.linked ||
      this.statusValue.unconfirmed
    )
      return;
    this.seedBaseline(value, updatedAt, false);
  }

  hydrate(seed: HydratedQuery) {
    if (this.resource || this.statusValue.loaded) {
      throw new Error('Hydration requires an empty query entry.');
    }
    this.seedBaseline(seed.data as T, seed.updatedAt, seed.invalidated);
  }

  markUnconfirmed() {
    this.publish({ unconfirmed: true, invalidated: true });
  }

  canLink() {
    if (this.removed || this.linked) {
      throw new Error('A linked operation is already pending for this query.');
    }
  }

  statusValuePending() {
    return this.linked > 0;
  }

  beginLink() {
    this.linked += 1;
    this.epoch += 1; // Existing READ results cannot enter this baseline.
    this.controller?.abort();
    this.controller = null;
    this.pending = null;
    this.publish({
      invalidated: true,
      fetchStatus: 'idle',
      pending: this.linked,
    });
  }

  endLink() {
    this.linked -= 1;
    this.publish({ pending: this.linked });
    this.scheduleGc();
  }

  acceptServer(value: T, submission?: ResourceSubmission<T>) {
    if (this.resource) this.resource.accept(value, submission);
    else {
      if (submission)
        throw new TypeError('An unloaded query cannot have a submission.');
      this.resource = new ResourceStore(
        value,
        this.options.editable ?? true,
        () => this.snapshot(),
        this.flush
      );
    }
    this.publish({
      status: 'success',
      loaded: true,
      error: null,
      updatedAt: Date.now(),
      invalidated: false,
      unconfirmed: false,
    });
  }

  acceptSubmitted(submission: ResourceSubmission<T>) {
    this.getResource().acceptSubmitted(submission);
    this.publish({
      status: 'success',
      loaded: true,
      error: null,
      updatedAt: Date.now(),
      invalidated: false,
      unconfirmed: false,
    });
  }

  removeSubmission(submission: ResourceSubmission<T>) {
    this.getResource().removeSubmission(submission);
    this.publish();
  }

  load(
    force = false,
    submission?: ResourceSubmission<T>,
    linked = false,
    requestOptions: QueryOptions<T> = this.options
  ): Promise<T> {
    if (this.removed)
      return Promise.reject(new Error('This query entry has expired.'));
    if (this.linked && !linked)
      return Promise.reject(
        new Error('A linked operation is pending for this query.')
      );
    if (this.pending && !force) return this.pending;
    if (!force && !this.isStale(requestOptions))
      return Promise.resolve(this.serverValue());
    if (force && this.pending) this.invalidate();

    const currentEpoch = ++this.epoch;
    const controller = new AbortController();
    this.controller = controller;
    const options = requestOptions;
    const retry = options.retry ?? (this.ssr ? 0 : 3);
    checkDuration(retry, 'retry');
    const delay =
      options.retryDelay ??
      ((attempt: number) => Math.min(1000 * 2 ** attempt, 30_000));
    this.publish({ fetchStatus: 'fetching', error: null });

    const task = (async () => {
      let attempt = 0;
      while (true) {
        let value: T;
        try {
          aborted(controller.signal);
          value = (await options.queryFn({ signal: controller.signal })) as T;
        } catch (error) {
          if (currentEpoch !== this.epoch || this.removed) throw error;
          if (controller.signal.aborted || attempt >= retry) {
            this.publish({ status: 'error', error });
            throw error;
          }
          const ms = delay(attempt++);
          checkDuration(ms, 'retryDelay');
          await waitRetry(ms, controller.signal);
          continue;
        }
        if (currentEpoch === this.epoch && !this.removed) {
          try {
            if (this.resource) this.resource.accept(value, submission);
            else {
              this.resource = new ResourceStore(
                value,
                options.editable ?? true,
                () => this.snapshot(),
                this.flush
              );
            }
          } catch (error) {
            this.publish({ status: 'error', error });
            throw error;
          }
          this.publish({
            status: 'success',
            loaded: true,
            error: null,
            updatedAt: Date.now(),
            invalidated: false,
            unconfirmed: false,
          });
        }
        return options.editable ?? true ? (frozenCopy(value) as T) : value;
      }
    })();
    this.pending = task;
    void task
      .finally(() => {
        if (currentEpoch !== this.epoch) return;
        this.pending = null;
        this.controller = null;
        this.publish({ fetchStatus: 'idle' });
        this.scheduleGc();
      })
      .catch(() => {});
    return task;
  }
}

/** One client owns one cache. Construct a new client for each SSR request. */
export function createSyncClient(options: { ssr?: boolean } = {}): SyncClient {
  const entries = new Map<string, QueryEntry<any>>();
  const handles = new WeakMap<object, QueryEntry<any>>();
  const scopes = new Map<string, Promise<void>>();
  let nextOperationId = 1;
  const schedule = <R>(scope: string, task: () => Promise<R>): Promise<R> => {
    const previous = scopes.get(scope) ?? Promise.resolve();
    const result = previous.then(task);
    const settled = result.then(
      () => {},
      () => {}
    );
    scopes.set(scope, settled);
    void settled.then(() => {
      if (scopes.get(scope) === settled) scopes.delete(scope);
    });
    return result;
  };
  const evict = (hash: string, entry: QueryEntry<any>) => {
    if (
      entries.get(hash) !== entry ||
      entry.owners > 0 ||
      entry.isDirty() ||
      entry.isUnconfirmed() ||
      entry.statusValuePending()
    )
      return;
    entries.delete(hash);
    entry.expire();
  };
  const getOrCreate = <T>(
    queryOptions: QueryOptions<T>,
    configureExisting: boolean
  ): QueryEntry<T> => {
    const hash = hashQueryKey(queryOptions.queryKey);
    checkDuration(queryOptions.staleTime ?? 0, 'staleTime');
    checkDuration(queryOptions.gcTime ?? 0, 'gcTime');
    if (queryOptions.initialUpdatedAt !== undefined) {
      if (
        !Number.isFinite(queryOptions.initialUpdatedAt) ||
        queryOptions.initialUpdatedAt < 0
      ) {
        throw new RangeError('initialUpdatedAt must be a finite timestamp.');
      }
      if (queryOptions.initialData === undefined) {
        throw new TypeError('initialUpdatedAt requires initialData.');
      }
    }
    let entry = entries.get(hash) as QueryEntry<T> | undefined;
    if (entry) {
      entry.assertCompatible(queryOptions);
      if (queryOptions.initialData !== undefined) {
        entry.seedInitial(
          queryOptions.initialData,
          queryOptions.initialUpdatedAt ?? Date.now()
        );
      }
      if (configureExisting) entry.configure(queryOptions);
    } else {
      entry = new QueryEntry(hash, queryOptions, options.ssr ?? false, evict);
      try {
        if (queryOptions.initialData !== undefined) {
          entry.seedInitial(
            queryOptions.initialData,
            queryOptions.initialUpdatedAt ?? Date.now()
          );
        }
      } catch (error) {
        entry.expire();
        throw error;
      }
      entries.set(hash, entry);
    }
    return entry;
  };
  const client: SyncClient = Object.freeze({
    query<T>(queryOptions: QueryOptions<T>): QueryHandle<T> {
      const entry = getOrCreate(queryOptions, true);
      entry.attach();
      let active = true;
      const controllers = new Set<AbortController>();
      const refs = new WeakMap<object, object>();
      const snapshots = new WeakMap<object, object>();
      const assertActive = () => {
        if (!active || entry!.removed)
          throw new Error('This query handle has been disposed.');
      };
      const guard = <V>(ref: StateRefStore<V>): StateRefStore<V> =>
        guardRef(ref, assertActive, refs, snapshots);
      const guardData = <V>(ref: StateRefStore<V>): StateRefStore<V> =>
        guardRef(
          ref,
          assertActive,
          refs,
          snapshots,
          entry!.getResource().editable
        );
      let dataWatch: Watch<T> | null = null;
      const statusWatch = guardedWatch(
        entry.statusStore.watch,
        entry.rawStatus,
        guard,
        assertActive,
        controllers,
        true
      );
      const handle: QueryHandle<T> = {
        get ref() {
          assertActive();
          return guardData(entry!.getResource().ref);
        },
        get watch() {
          assertActive();
          const resource = entry!.getResource();
          if (!dataWatch) {
            dataWatch = guardedWatch(
              resource.watch,
              resource.ref,
              guardData,
              assertActive,
              controllers,
              !resource.editable
            );
          }
          return dataWatch;
        },
        status: guard(entry.rawStatus),
        watchStatus: statusWatch,
        load: () => {
          assertActive();
          return entry!.load();
        },
        refetch: () => {
          assertActive();
          return entry!.load(true);
        },
        invalidate: () => {
          assertActive();
          entry!.invalidate();
        },
        isDirty: () => {
          assertActive();
          return entry!.isDirty();
        },
        changes: () => {
          assertActive();
          return entry!.changes();
        },
        version: () => {
          assertActive();
          return entry!.version();
        },
        capture: ids => {
          assertActive();
          return entry!.getResource().capture(ids);
        },
        acceptServer: value => {
          assertActive();
          if (entry!.statusValuePending())
            throw new Error('A linked operation is pending for this query.');
          entry!.invalidate();
          entry!.acceptServer(value);
        },
        dispose: () => {
          if (!active) return;
          active = false;
          controllers.forEach(controller => controller.abort());
          controllers.clear();
          entry!.detach();
        },
      };
      const frozen = Object.freeze(handle);
      handles.set(frozen, entry);
      return frozen;
    },
    async fetch<T>(queryOptions: QueryOptions<T>): Promise<T> {
      const entry = getOrCreate(queryOptions, false);
      entry.attach();
      try {
        return await entry.load(false, undefined, false, queryOptions);
      } finally {
        entry.detach();
      }
    },
    async prefetch<T>(queryOptions: QueryOptions<T>): Promise<void> {
      const entry = getOrCreate(queryOptions, false);
      entry.attach();
      try {
        await entry.load(false, undefined, false, queryOptions);
      } catch {
        // Prefetch is best-effort; a later fetch still observes the error.
      } finally {
        entry.detach();
      }
    },
    async ensure<T>(queryOptions: QueryOptions<T>): Promise<T> {
      const entry = getOrCreate(queryOptions, false);
      entry.attach();
      try {
        if (entry.hasConfirmedBaseline()) return entry.serverValue();
        return await entry.load(false, undefined, false, queryOptions);
      } finally {
        entry.detach();
      }
    },
    mutation<I, T>(mutationOptions: MutationOptions<I, T>) {
      return createMutation(
        mutationOptions,
        () => nextOperationId++,
        links => {
          const seen = new Set<QueryEntry<any>>();
          const prepared = links.map((link: MutationLink<T>) => {
            const entry = handles.get(link.query);
            if (!entry)
              throw new TypeError('Linked query belongs to another client.');
            link.query.version(); // Disposed handles fail before the WRITE starts.
            entry.canLink();
            if (seen.has(entry))
              throw new TypeError(
                'A query may be linked only once per operation.'
              );
            seen.add(entry);
            const submission = link.submission;
            const onReject = link.onReject;
            const resource = submission ? entry.getResource() : null;
            if (submission) resource!.assertSubmission(submission);
            if (submission && resource!.version() !== submission.version) {
              throw new Error(
                'Submission is stale. Capture the current edits again.'
              );
            }
            const accept = link.accept ?? { kind: 'none' as const };
            if (accept.kind === 'submitted' && !submission) {
              throw new TypeError(
                'Submitted acceptance requires a submission.'
              );
            }
            if (onReject === 'remove' && !submission) {
              throw new TypeError(
                'Removing rejected edits requires a submission.'
              );
            }
            return {
              begin: () => {
                if (submission) resource!.beginSubmission(submission);
                try {
                  entry.beginLink();
                } catch (error) {
                  if (submission) resource!.endSubmission(submission);
                  throw error;
                }
              },
              success: async (data: T) => {
                if (accept.kind === 'submitted')
                  entry.acceptSubmitted(submission!);
                else if (accept.kind === 'response')
                  entry.acceptServer(accept.select(data), submission);
                else if (accept.kind === 'refetch')
                  await entry.load(true, submission, true);
                else entry.markUnconfirmed();
              },
              reject: () => {
                if (onReject === 'remove') entry.removeSubmission(submission!);
              },
              uncertain: () => entry.markUnconfirmed(),
              end: () => {
                if (submission) entry.getResource().endSubmission(submission);
                entry.endLink();
              },
            };
          });
          return prepared;
        },
        schedule
      );
    },
    dehydrate(): SyncSnapshot {
      const queries: HydratedQuery[] = [];
      for (const entry of entries.values()) {
        const seed = entry.dehydrate();
        if (seed) queries.push(seed);
      }
      return Object.freeze({
        schemaVersion: 1 as const,
        capturedAt: Date.now(),
        queries: Object.freeze(queries),
      });
    },
    hydrate(snapshot: SyncSnapshot) {
      if (entries.size) {
        throw new Error(
          'Hydrate an empty client before creating query handles.'
        );
      }
      const seeds = parseSnapshot(snapshot);
      const prepared: Array<[string, QueryEntry<any>]> = [];
      try {
        for (const seed of seeds) {
          const hash = hashQueryKey(seed.queryKey);
          const entry = new QueryEntry(
            hash,
            {
              queryKey: seed.queryKey,
              editable: seed.editable,
              queryFn: () => {
                throw new Error(
                  'Attach a query function before loading hydrated data.'
                );
              },
            },
            options.ssr ?? false,
            evict
          );
          prepared.push([hash, entry]);
          entry.hydrate(seed);
        }
      } catch (error) {
        prepared.forEach(([, entry]) => entry.expire());
        throw error;
      }
      prepared.forEach(([hash, entry]) => entries.set(hash, entry));
    },
    invalidate(key: QueryKey) {
      entries.get(hashQueryKey(key))?.invalidate();
    },
    remove(key: QueryKey) {
      const hash = hashQueryKey(key);
      const entry = entries.get(hash);
      if (
        !entry ||
        entry.owners > 0 ||
        entry.isDirty() ||
        entry.isUnconfirmed() ||
        entry.statusValuePending()
      )
        return false;
      evict(hash, entry);
      return true;
    },
    size: () => entries.size,
  });
  return client;
}
