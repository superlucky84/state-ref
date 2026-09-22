import { create } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import { guardRef, guardedWatch } from './ref-guard';
import { hashQueryKey } from './key';
import type { QueryKey } from './key';
import { ResourceStore } from './resource';
import type { ResourceChange, ResourceSubmission } from './resource';
import { frozenCopy } from './tree';
import { createMutation } from './mutation';
import type {
  MutationHandle,
  MutationLink,
  MutationOptions,
  MutationOperationRecord,
  MutationResult,
} from './mutation';
import { copyJson, parseSnapshot } from './hydration';
import type { HydratedQuery, SyncSnapshot } from './hydration';
import { parseLocalSnapshot } from './local-hydration';
import type { LocalHydratedQuery, LocalSyncSnapshot } from './local-hydration';
import { createQueryView } from './view';
import type { QueryViewHandle, QueryViewOptions } from './view';
import { createLiveQueryView } from './live-view';
import type { LiveQueryOptions, LiveQueryViewHandle } from './live-view';
import {
  checkAutomaticRefetchOptions,
  createAutomaticRefetchManager,
} from './automatic-refetch';
import type {
  AutomaticRefetchOptions,
  SyncEnvironment,
} from './automatic-refetch';
import { checkNetworkMode, createNetworkGate } from './network';
import type { NetworkMode } from './network';
import {
  checkInfiniteData,
  checkInfiniteOptions,
  makeInfiniteData,
  nextPageParam,
  previousPageParam,
  samePageParam,
} from './infinite';
import type {
  InfiniteData,
  InfiniteQueryHandle,
  InfiniteQueryOptions,
  InfiniteQueryViewHandle,
} from './infinite';

export { hashQueryKey } from './key';
export { createBrowserSyncEnvironment } from './browser-environment';
export type { BrowserSyncHost } from './browser-environment';
export type { QueryKey } from './key';
export type { NetworkMode } from './network';
export { MutationRejectedError } from './mutation';
export {
  saveSyncSnapshot,
  restoreSyncSnapshot,
  openPersistedMutationQueue,
  saveLocalSyncSnapshot,
  restoreLocalSyncSnapshot,
} from './persistence';
export { openPersistedLinkedMutation } from './linked-persistence';
export type {
  PersistedLinkedMutation,
  PersistedLinkedMutationJob,
  PersistedLinkedMutationLink,
  PersistedLinkedMutationOptions,
  StageLinkedMutation,
  StageLinkedMutationLink,
} from './linked-persistence';
export type {
  AutoResumeHandlers,
  ResumedMutation,
  SyncStorage,
  SyncPersistenceOptions,
  PersistedMutationJob,
  PersistedMutationQueueOptions,
  PersistedMutationQueue,
} from './persistence';
export type {
  ResourceChange,
  ResourceValue,
  ResourceSubmission,
  ResourceRecoveryEdit,
  ResourceRecoveryState,
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
export type { LocalHydratedQuery, LocalSyncSnapshot } from './local-hydration';
export type {
  QueryViewHandle,
  QueryViewOptions,
  QueryViewRef,
  QueryViewState,
  QueryViewWatch,
} from './view';
export type {
  LiveQueryOptions,
  LiveQueryViewHandle,
  LiveQueryViewState,
} from './live-view';
export type {
  AutomaticRefetchOptions,
  AutomaticRefetchPolicy,
  SyncEnvironment,
  SyncEnvironmentEvent,
} from './automatic-refetch';
export type {
  InfiniteData,
  InfiniteQueryHandle,
  InfiniteQueryOptions,
  InfiniteQueryViewHandle,
} from './infinite';

export type QueryStatus = Readonly<{
  status: 'pending' | 'success' | 'error';
  fetchStatus: 'idle' | 'fetching' | 'paused';
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

/** Read-only cache metadata for tooling; query data and mutation input are omitted. */
export type SyncCacheEntry = Readonly<{
  queryKey: QueryKey;
  kind: 'query' | 'infinite';
  owners: number;
  /** Query status without the caller-owned error object. */
  status: Omit<QueryStatus, 'error'>;
}>;

export type SyncCacheEvent = Readonly<{
  type: 'added' | 'updated' | 'removed';
  entry: SyncCacheEntry;
}>;

/**
 * Read-only WRITE metadata for tooling. The input, the response, and
 * caller-owned error objects are omitted, and observation never implies that
 * the server accepted the operation.
 */
export type SyncMutationEntry = Readonly<{
  operationId: number;
  /** Diagnostic phase; `queued` marks scope ordering and has no status equivalent. */
  phase: 'queued' | 'pending' | MutationResult<unknown>['kind'];
  scope: string | null;
  attempt: number;
  /** Whether the caller supplied an idempotency key; the value stays private. */
  idempotent: boolean;
  linkedKeys: readonly QueryKey[];
  startedAt: number;
  settledAt: number | null;
}>;

export type SyncMutationEvent = Readonly<{
  type: 'started' | 'updated' | 'settled';
  entry: SyncMutationEntry;
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
  networkMode?: NetworkMode;
  /** A known server value used only while the key has no baseline. */
  initialData?: T;
  /** Timestamp of initialData; defaults to the time it is installed. */
  initialUpdatedAt?: number;
}> &
  AutomaticRefetchOptions;

/**
 * How a local dehydration treats a query with an active READ or linked WRITE.
 * `reject` refuses the snapshot; `unconfirmed` stores it with conservative
 * markings so a checkpoint can run while a WRITE is still in flight.
 */
export type InFlightDehydration = 'reject' | 'unconfirmed';

export type LocalDehydrateOptions = Readonly<{
  /** Defaults to `reject`. */
  inFlight?: InFlightDehydration;
}>;

export type SyncClientOptions = Readonly<{
  ssr?: boolean;
  /** Client-scoped focus and connectivity events for automatic refetch. */
  environment?: SyncEnvironment;
}>;

export type QueryHandle<T> = Readonly<{
  queryKey: QueryKey;
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
  infiniteQuery: <Page, Param>(
    options: InfiniteQueryOptions<Page, Param>
  ) => InfiniteQueryHandle<Page, Param>;
  infiniteView: <Page, Param, S = InfiniteData<Page, Param>>(
    options: InfiniteQueryOptions<Page, Param>,
    viewOptions?: QueryViewOptions<InfiniteData<Page, Param>, S>
  ) => InfiniteQueryViewHandle<Page, Param, S>;
  view: <T, S = T>(
    options: QueryOptions<T>,
    viewOptions?: QueryViewOptions<T, S>
  ) => QueryViewHandle<T, S>;
  /** Follow a state-ref source, automatically loading its active query key. */
  liveView: <I, T, S = T>(
    source: Watch<I>,
    resolve: (input: I) => LiveQueryOptions<T> | null,
    viewOptions?: QueryViewOptions<T, S>
  ) => LiveQueryViewHandle<T, S>;
  /** Return a fresh cached baseline or perform a READ. */
  fetch: <T>(options: QueryOptions<T>) => Promise<T>;
  /** Best-effort fetch that caches success and swallows load rejections. */
  prefetch: <T>(options: QueryOptions<T>) => Promise<void>;
  /** Return a confirmed cached baseline even when stale, or perform a READ. */
  ensure: <T>(options: QueryOptions<T>) => Promise<T>;
  fetchInfinite: <Page, Param>(
    options: InfiniteQueryOptions<Page, Param>
  ) => Promise<InfiniteData<Page, Param>>;
  prefetchInfinite: <Page, Param>(
    options: InfiniteQueryOptions<Page, Param>
  ) => Promise<void>;
  ensureInfinite: <Page, Param>(
    options: InfiniteQueryOptions<Page, Param>
  ) => Promise<InfiniteData<Page, Param>>;
  mutation: <I, T>(options: MutationOptions<I, T>) => MutationHandle<I, T>;
  invalidate: (key: QueryKey) => void;
  remove: (key: QueryKey) => boolean;
  size: () => number;
  /** Current metadata for this client's cache only. */
  inspectCache: () => readonly SyncCacheEntry[];
  /** Future cache events; delivery is deferred until after the current turn. */
  subscribeCache: (listener: (event: SyncCacheEvent) => void) => () => void;
  /** Unsettled WRITE operations started by this client, in start order. */
  inspectMutations: () => readonly SyncMutationEntry[];
  /** Future WRITE events; settled operations are not retained by the client. */
  subscribeMutations: (
    listener: (event: SyncMutationEvent) => void
  ) => () => void;
  dehydrate: () => SyncSnapshot;
  /** Restore into an empty client before creating query handles. */
  hydrate: (snapshot: SyncSnapshot) => void;
  /** Preserve editable local state separately from clean SSR snapshots. */
  dehydrateLocal: (options?: LocalDehydrateOptions) => LocalSyncSnapshot;
  /** Restore into an empty client without starting a READ or WRITE. */
  hydrateLocal: (snapshot: LocalSyncSnapshot) => void;
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
  infinitePolicy: string | null = null;
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
    private readonly evict: (hash: string, entry: QueryEntry<T>) => void,
    private readonly network: ReturnType<typeof createNetworkGate>,
    private readonly changed: (entry: QueryEntry<T>) => void,
    readonly kind: 'query' | 'infinite' = 'query'
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
    this.changed(this);
  };

  key(): QueryKey {
    return frozenCopy(JSON.parse(this.hash)) as QueryKey;
  }

  inspect(): SyncCacheEntry {
    const status = this.statusValue;
    return Object.freeze({
      queryKey: this.key(),
      kind: this.kind,
      owners: this.owners,
      status: Object.freeze({
        status: status.status,
        fetchStatus: status.fetchStatus,
        loaded: status.loaded,
        updatedAt: status.updatedAt,
        invalidated: status.invalidated,
        dirty: status.dirty,
        conflicts: status.conflicts,
        version: status.version,
        pending: status.pending,
        unconfirmed: status.unconfirmed,
      }),
    });
  }

  private publish(patch: Partial<QueryStatus> = {}) {
    this.snapshot(patch);
    this.flush();
  }

  attach() {
    if (this.removed) throw new Error('This query entry has expired.');
    this.owners += 1;
    this.cancelGc();
    this.changed(this);
  }

  detach() {
    this.owners -= 1;
    if (this.owners === 0 && this.pending && !this.linked) this.invalidate();
    this.scheduleGc();
    this.changed(this);
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
      ...(this.kind === 'infinite' ? { kind: 'infinite' as const } : {}),
    });
  }

  dehydrateLocal(
    inFlight: InFlightDehydration = 'reject'
  ): LocalHydratedQuery | null {
    const busy = this.pending !== null || this.linked > 0;
    const conservative = inFlight === 'unconfirmed';
    if (busy && !conservative)
      throw new Error(
        `Query ${this.hash} has an active READ or linked WRITE; it cannot be locally dehydrated.`
      );
    if (!this.statusValue.loaded) {
      if (this.statusValue.unconfirmed && !conservative)
        throw new Error(
          `Query ${this.hash} has an unloaded unconfirmed WRITE.`
        );
      return null;
    }
    if (!this.resource || this.statusValue.updatedAt === null) {
      // A checkpoint keeps the rest of the snapshot rather than failing.
      if (conservative) return null;
      throw new Error(`Query ${this.hash} has no server baseline.`);
    }
    // A linked WRITE may already have changed the server; a READ only means
    // the stored baseline is about to be replaced.
    const unconfirmed =
      this.statusValue.unconfirmed || (conservative && this.linked > 0);
    return Object.freeze({
      queryKey: JSON.parse(this.hash) as QueryKey,
      data: copyJson(this.resource.serverValue()),
      updatedAt: this.statusValue.updatedAt,
      invalidated:
        this.statusValue.invalidated ||
        this.statusValue.status === 'error' ||
        unconfirmed ||
        (conservative && busy),
      editable: this.options.editable ?? true,
      unconfirmed,
      ...(this.kind === 'infinite' ? { kind: 'infinite' as const } : {}),
      ...(this.resource.editable
        ? { local: this.resource.recoveryState() }
        : {}),
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

  hydrateLocal(seed: LocalHydratedQuery) {
    this.hydrate(seed);
    if (seed.local) this.getResource().restoreRecovery(seed.local);
    if (seed.unconfirmed) this.markUnconfirmed();
    if (this.isDirty() || seed.unconfirmed) this.cancelGc();
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
    const mode = options.networkMode ?? 'online';
    const retry = options.retry ?? (this.ssr ? 0 : 3);
    checkDuration(retry, 'retry');
    const delay =
      options.retryDelay ??
      ((attempt: number) => Math.min(1000 * 2 ** attempt, 30_000));
    this.publish({
      fetchStatus:
        mode === 'online' && !this.network.isOnline() ? 'paused' : 'fetching',
      error: null,
    });

    const task = (async () => {
      let attempt = 0;
      while (true) {
        let value: T;
        try {
          aborted(controller.signal);
          if (
            (mode === 'online' || (mode === 'offlineFirst' && attempt > 0)) &&
            !this.network.isOnline()
          ) {
            if (currentEpoch === this.epoch)
              this.publish({ fetchStatus: 'paused' });
            await this.network.wait(controller.signal);
            if (currentEpoch === this.epoch)
              this.publish({ fetchStatus: 'fetching' });
          }
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
          if (mode !== 'always' && !this.network.isOnline())
            this.publish({ fetchStatus: 'paused' });
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

  automaticLoad(force: boolean, requestOptions: QueryOptions<T>): Promise<T> {
    if (this.pending) return this.pending;
    return this.load(force, undefined, false, requestOptions);
  }
}

/** One client owns one cache. Construct a new client for each SSR request. */
export function createSyncClient(options: SyncClientOptions = {}): SyncClient {
  const entries = new Map<string, QueryEntry<any>>();
  type Subscription<E> = { listener: (event: E) => void };
  const listeners = new Set<Subscription<SyncCacheEvent>>();
  const mutationListeners = new Set<Subscription<SyncMutationEvent>>();
  /** Both streams share one queue so their relative order is preserved. */
  const eventQueue: Array<{
    event: SyncCacheEvent | SyncMutationEvent;
    targets: Array<Subscription<any>>;
    registry: Set<Subscription<any>>;
  }> = [];
  let deliveryQueued = false;
  const queueTo = <E>(registry: Set<Subscription<E>>, event: E) => {
    if (!registry.size) return;
    eventQueue.push({
      event: Object.freeze(event) as SyncCacheEvent | SyncMutationEvent,
      targets: Array.from(registry),
      registry,
    });
    if (deliveryQueued) return;
    deliveryQueued = true;
    queueMicrotask(() => {
      deliveryQueued = false;
      while (eventQueue.length) {
        const { event, targets, registry } = eventQueue.shift()!;
        for (const target of targets) {
          if (!registry.has(target)) continue;
          try {
            target.listener(event);
          } catch {
            // Diagnostic observers cannot change query or mutation outcomes.
          }
        }
      }
    });
  };
  const queueEvent = (type: SyncCacheEvent['type'], entry: SyncCacheEntry) =>
    queueTo(listeners, { type, entry });
  const dropQueued = () => {
    if (!listeners.size && !mutationListeners.size) eventQueue.length = 0;
  };
  const changed = (entry: QueryEntry<any>) => {
    if (listeners.size && entries.get(entry.hash) === entry)
      queueEvent('updated', entry.inspect());
  };
  const emit = (type: SyncCacheEvent['type'], entry: QueryEntry<any>) => {
    if (listeners.size) queueEvent(type, entry.inspect());
  };
  /** Unsettled operations only; observers own any completed history. */
  const operations = new Map<number, MutationOperationRecord>();
  const inspectMutation = (
    record: MutationOperationRecord
  ): SyncMutationEntry =>
    Object.freeze({
      operationId: record.operationId,
      phase: record.phase,
      scope: record.scope,
      attempt: record.attempt,
      idempotent: record.idempotent,
      linkedKeys: record.linkedKeys,
      startedAt: record.startedAt,
      settledAt: record.settledAt,
    });
  const emitMutation = (
    type: SyncMutationEvent['type'],
    record: MutationOperationRecord
  ) => {
    if (mutationListeners.size)
      queueTo(mutationListeners, { type, entry: inspectMutation(record) });
  };
  const observeMutation = {
    started: (record: MutationOperationRecord) => {
      operations.set(record.operationId, record);
      emitMutation('started', record);
    },
    updated: (record: MutationOperationRecord) =>
      emitMutation('updated', record),
    settled: (record: MutationOperationRecord) => {
      operations.delete(record.operationId);
      emitMutation('settled', record);
    },
  };
  const handles = new WeakMap<object, QueryEntry<any>>();
  const scopes = new Map<string, Promise<void>>();
  const pageScopes = new Map<string, Promise<void>>();
  const network = createNetworkGate(options.environment, options.ssr ?? false);
  const automaticRefetch = createAutomaticRefetchManager(
    options.environment,
    options.ssr ?? false
  );
  let nextOperationId = 1;
  const scheduleWith = <R>(
    registry: Map<string, Promise<void>>,
    scope: string,
    task: () => Promise<R>
  ): Promise<R> => {
    const previous = registry.get(scope) ?? Promise.resolve();
    const result = previous.then(task);
    const settled = result.then(
      () => {},
      () => {}
    );
    registry.set(scope, settled);
    void settled.then(() => {
      if (registry.get(scope) === settled) registry.delete(scope);
    });
    return result;
  };
  const schedule = <R>(scope: string, task: () => Promise<R>): Promise<R> =>
    scheduleWith(scopes, scope, task);
  const evict = (hash: string, entry: QueryEntry<any>) => {
    if (
      entries.get(hash) !== entry ||
      entry.owners > 0 ||
      entry.isDirty() ||
      entry.isUnconfirmed() ||
      entry.statusValuePending()
    )
      return;
    const snapshot = listeners.size ? entry.inspect() : null;
    entries.delete(hash);
    entry.expire();
    if (snapshot) queueEvent('removed', snapshot);
  };
  const getOrCreate = <T>(
    queryOptions: QueryOptions<T>,
    configureExisting: boolean,
    kind: 'query' | 'infinite' = 'query'
  ): QueryEntry<T> => {
    const hash = hashQueryKey(queryOptions.queryKey);
    checkDuration(queryOptions.staleTime ?? 0, 'staleTime');
    checkDuration(queryOptions.gcTime ?? 0, 'gcTime');
    checkAutomaticRefetchOptions(queryOptions);
    checkNetworkMode(queryOptions.networkMode);
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
      if (entry.kind !== kind)
        throw new TypeError('A query key cannot mix query kinds.');
      entry.assertCompatible(queryOptions);
      if (queryOptions.initialData !== undefined) {
        entry.seedInitial(
          queryOptions.initialData,
          queryOptions.initialUpdatedAt ?? Date.now()
        );
      }
      if (configureExisting) entry.configure(queryOptions);
    } else {
      entry = new QueryEntry(
        hash,
        queryOptions,
        options.ssr ?? false,
        evict,
        network,
        changed,
        kind
      );
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
      emit('added', entry);
    }
    return entry;
  };
  const openQuery = <T>(
    queryOptions: QueryOptions<T>,
    kind: 'query' | 'infinite' = 'query',
    configureExisting = true
  ): QueryHandle<T> => {
    const entry = getOrCreate(queryOptions, configureExisting, kind);
    entry.attach();
    const automatic = automaticRefetch.observe(
      entry,
      queryOptions,
      () => entry.isStale(queryOptions),
      force => entry.automaticLoad(force, queryOptions)
    );
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
      get queryKey() {
        assertActive();
        return JSON.parse(entry!.hash) as QueryKey;
      },
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
        automatic.start();
        return entry!.load();
      },
      refetch: () => {
        assertActive();
        automatic.start();
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
        try {
          automatic.dispose();
        } finally {
          controllers.forEach(controller => controller.abort());
          controllers.clear();
          entry!.detach();
        }
      },
    };
    const frozen = Object.freeze(handle);
    handles.set(frozen, entry);
    return frozen;
  };
  const openInfinite = <Page, Param>(
    infiniteOptions: InfiniteQueryOptions<Page, Param>,
    configureExisting = true
  ): {
    query: QueryHandle<InfiniteData<Page, Param>>;
    entry: QueryEntry<InfiniteData<Page, Param>>;
    queryOptions: QueryOptions<InfiniteData<Page, Param>>;
    handle: InfiniteQueryHandle<Page, Param>;
  } => {
    checkInfiniteOptions(infiniteOptions);
    const hash = hashQueryKey(infiniteOptions.queryKey);
    const policy = JSON.stringify([
      hashQueryKey([infiniteOptions.initialPageParam]),
      infiniteOptions.maxPages ?? null,
    ]);
    const existing = entries.get(hash);
    if (existing?.infinitePolicy && existing.infinitePolicy !== policy)
      throw new TypeError('A query key cannot mix infinite page policies.');
    type Data = InfiniteData<Page, Param>;
    let entry: QueryEntry<Data>;
    const refresh = async ({
      signal,
    }: {
      signal: AbortSignal;
    }): Promise<Data> => {
      const previous = entry.resource?.serverValue();
      if (previous) checkInfiniteData(previous, infiniteOptions.maxPages);
      const count = previous?.pages.length ?? 1;
      const pages: Page[] = [];
      const pageParams: Param[] = [];
      let param = previous?.pageParams[0] ?? infiniteOptions.initialPageParam;
      for (let index = 0; index < count; index += 1) {
        aborted(signal);
        const page = await infiniteOptions.queryFn({
          signal,
          pageParam: param,
        });
        aborted(signal);
        pages.push(page);
        pageParams.push(param);
        if (index + 1 < count) {
          const next = nextPageParam(
            infiniteOptions,
            makeInfiniteData(pages, pageParams)
          );
          if (next == null) break;
          if (pageParams.some(item => samePageParam(item, next)))
            throw new TypeError(
              'Infinite page cursor repeated during refetch.'
            );
          param = next;
        }
      }
      return makeInfiniteData(pages, pageParams);
    };
    const queryOptions: QueryOptions<Data> = {
      ...infiniteOptions,
      editable: false,
      queryFn: refresh,
      initialData: infiniteOptions.initialData
        ? makeInfiniteData(
            infiniteOptions.initialData.pages,
            infiniteOptions.initialData.pageParams
          )
        : undefined,
    };
    const query = openQuery(queryOptions, 'infinite', configureExisting);
    entry = handles.get(query) as QueryEntry<Data>;
    try {
      if (entry.resource)
        checkInfiniteData(
          entry.resource.serverValue(),
          infiniteOptions.maxPages
        );
    } catch (error) {
      query.dispose();
      throw error;
    }
    entry.infinitePolicy = policy;
    const current = (): Data | null =>
      query.status.loaded.value ? query.ref.value : null;
    const append = (direction: 'next' | 'previous'): Promise<Data> =>
      scheduleWith(pageScopes, entry.hash, async () => {
        if (
          !query.status.loaded.value ||
          query.status.fetchStatus.value === 'fetching'
        )
          await query.load();
        const before = current()!;
        checkInfiniteData(before, infiniteOptions.maxPages);
        const candidate =
          direction === 'next'
            ? nextPageParam(infiniteOptions, before)
            : previousPageParam(infiniteOptions, before);
        if (candidate == null) return before;
        if (before.pageParams.some(param => samePageParam(param, candidate)))
          throw new TypeError('Infinite page cursor repeated.');
        return entry.load(true, undefined, false, {
          ...queryOptions,
          queryFn: async ({ signal }) => {
            const page = await infiniteOptions.queryFn({
              signal,
              pageParam: candidate,
            });
            aborted(signal);
            const latest = entry.resource?.serverValue() ?? before;
            checkInfiniteData(latest, infiniteOptions.maxPages);
            if (
              latest.pageParams.some(param => samePageParam(param, candidate))
            )
              return latest;
            const pages =
              direction === 'next'
                ? [...latest.pages, page]
                : [page, ...latest.pages];
            const params =
              direction === 'next'
                ? [...latest.pageParams, candidate]
                : [candidate, ...latest.pageParams];
            const max = infiniteOptions.maxPages;
            if (max !== undefined && pages.length > max) {
              if (direction === 'next') {
                pages.shift();
                params.shift();
              } else {
                pages.pop();
                params.pop();
              }
            }
            return makeInfiniteData(pages, params);
          },
        });
      });
    const handle: InfiniteQueryHandle<Page, Param> = Object.freeze({
      get ref() {
        return query.ref as unknown as InfiniteQueryHandle<Page, Param>['ref'];
      },
      get watch() {
        return query.watch as unknown as InfiniteQueryHandle<
          Page,
          Param
        >['watch'];
      },
      status: query.status,
      watchStatus: query.watchStatus,
      load: query.load,
      refetch: query.refetch,
      fetchNextPage: () => append('next'),
      fetchPreviousPage: () => append('previous'),
      hasNextPage: () => {
        const data = current();
        return data !== null && nextPageParam(infiniteOptions, data) != null;
      },
      hasPreviousPage: () => {
        const data = current();
        return (
          data !== null && previousPageParam(infiniteOptions, data) != null
        );
      },
      invalidate: query.invalidate,
      dispose: query.dispose,
    });
    return { query, entry, queryOptions, handle };
  };
  const client: SyncClient = Object.freeze({
    query<T>(queryOptions: QueryOptions<T>): QueryHandle<T> {
      return openQuery(queryOptions);
    },
    infiniteQuery<Page, Param>(
      infiniteOptions: InfiniteQueryOptions<Page, Param>
    ): InfiniteQueryHandle<Page, Param> {
      return openInfinite(infiniteOptions).handle;
    },
    infiniteView<Page, Param, S = InfiniteData<Page, Param>>(
      infiniteOptions: InfiniteQueryOptions<Page, Param>,
      viewOptions?: QueryViewOptions<InfiniteData<Page, Param>, S>
    ): InfiniteQueryViewHandle<Page, Param, S> {
      if (viewOptions?.placeholderData !== undefined)
        checkInfiniteData(
          viewOptions.placeholderData,
          infiniteOptions.maxPages
        );
      const { query, handle } = openInfinite(infiniteOptions);
      try {
        const view = createQueryView(query, viewOptions);
        return Object.freeze({
          query: handle,
          ref: view.ref,
          watch: view.watch,
          dispose: view.dispose,
        });
      } catch (error) {
        handle.dispose();
        throw error;
      }
    },
    view<T, S = T>(
      queryOptions: QueryOptions<T>,
      viewOptions?: QueryViewOptions<T, S>
    ): QueryViewHandle<T, S> {
      const query = client.query(queryOptions);
      try {
        return createQueryView(query, viewOptions);
      } catch (error) {
        query.dispose();
        throw error;
      }
    },
    liveView<I, T, S = T>(
      source: Watch<I>,
      resolve: (input: I) => LiveQueryOptions<T> | null,
      viewOptions?: QueryViewOptions<T, S>
    ): LiveQueryViewHandle<T, S> {
      return createLiveQueryView(source, resolve, options =>
        client.view(options, viewOptions)
      );
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
    async fetchInfinite<Page, Param>(
      infiniteOptions: InfiniteQueryOptions<Page, Param>
    ): Promise<InfiniteData<Page, Param>> {
      const { entry, queryOptions, handle } = openInfinite(
        infiniteOptions,
        false
      );
      try {
        return await entry.load(false, undefined, false, queryOptions);
      } finally {
        handle.dispose();
      }
    },
    async prefetchInfinite<Page, Param>(
      infiniteOptions: InfiniteQueryOptions<Page, Param>
    ): Promise<void> {
      const { entry, queryOptions, handle } = openInfinite(
        infiniteOptions,
        false
      );
      try {
        await entry.load(false, undefined, false, queryOptions);
      } catch {
        // Prefetch is best-effort; a later fetch still observes the error.
      } finally {
        handle.dispose();
      }
    },
    async ensureInfinite<Page, Param>(
      infiniteOptions: InfiniteQueryOptions<Page, Param>
    ): Promise<InfiniteData<Page, Param>> {
      const { entry, queryOptions, handle } = openInfinite(
        infiniteOptions,
        false
      );
      try {
        if (entry.hasConfirmedBaseline()) return entry.serverValue();
        return await entry.load(false, undefined, false, queryOptions);
      } finally {
        handle.dispose();
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
              queryKey: entry.key(),
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
        schedule,
        observeMutation
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
            evict,
            network,
            changed,
            seed.kind ?? 'query'
          );
          prepared.push([hash, entry]);
          entry.hydrate(seed);
        }
      } catch (error) {
        prepared.forEach(([, entry]) => entry.expire());
        throw error;
      }
      prepared.forEach(([hash, entry]) => entries.set(hash, entry));
      prepared.forEach(([, entry]) => emit('added', entry));
    },
    dehydrateLocal(options: LocalDehydrateOptions = {}): LocalSyncSnapshot {
      const inFlight = options.inFlight ?? 'reject';
      if (inFlight !== 'reject' && inFlight !== 'unconfirmed')
        throw new TypeError('Unsupported in-flight dehydration mode.');
      const queries: LocalHydratedQuery[] = [];
      for (const entry of entries.values()) {
        const seed = entry.dehydrateLocal(inFlight);
        if (seed) queries.push(seed);
      }
      return Object.freeze({
        schemaVersion: 2 as const,
        capturedAt: Date.now(),
        queries: Object.freeze(queries),
      });
    },
    hydrateLocal(snapshot: LocalSyncSnapshot) {
      if (entries.size)
        throw new Error(
          'Hydrate an empty client before creating query handles.'
        );
      const seeds = parseLocalSnapshot(snapshot);
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
            evict,
            network,
            changed,
            seed.kind ?? 'query'
          );
          prepared.push([hash, entry]);
          entry.hydrateLocal(seed);
        }
      } catch (error) {
        prepared.forEach(([, entry]) => entry.expire());
        throw error;
      }
      prepared.forEach(([hash, entry]) => entries.set(hash, entry));
      prepared.forEach(([, entry]) => emit('added', entry));
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
    inspectCache: () =>
      Object.freeze(Array.from(entries.values(), entry => entry.inspect())),
    subscribeCache(listener: (event: SyncCacheEvent) => void) {
      const subscription = { listener };
      listeners.add(subscription);
      return () => {
        listeners.delete(subscription);
        dropQueued();
      };
    },
    inspectMutations: () =>
      Object.freeze(
        Array.from(operations.values(), record => inspectMutation(record))
      ),
    subscribeMutations(listener: (event: SyncMutationEvent) => void) {
      const subscription = { listener };
      mutationListeners.add(subscription);
      return () => {
        mutationListeners.delete(subscription);
        dropQueued();
      };
    },
  });
  return client;
}
