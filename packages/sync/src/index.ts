import { create } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import { guardRef, guardedWatch } from './ref-guard';
import { hashQueryKey } from './key';
import type { QueryKey } from './key';
import { ResourceStore } from './resource';
import type { ResourceChange } from './resource';

export { hashQueryKey } from './key';
export type { QueryKey } from './key';
export type { ResourceChange, ResourceValue } from './resource';

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
  dispose: () => void;
}>;

export type SyncClient = Readonly<{
  query: <T>(options: QueryOptions<T>) => QueryHandle<T>;
  invalidate: (key: QueryKey) => void;
  remove: (key: QueryKey) => boolean;
  size: () => number;
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
    if ((options.editable ?? true) !== (this.options.editable ?? true)) {
      throw new TypeError('A query key cannot mix editable and readonly data.');
    }
    this.options = options;
    this.cancelGc();
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
    if (this.owners > 0 || this.pending || this.resource?.isDirty()) return;
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

  isStale() {
    const staleTime = this.options.staleTime ?? 0;
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

  isDirty() {
    return this.resource?.isDirty() ?? false;
  }

  changes() {
    return this.resource?.changes() ?? Object.freeze([]);
  }

  version() {
    return this.resource?.version() ?? 0;
  }

  load(force = false): Promise<T> {
    if (this.removed)
      return Promise.reject(new Error('This query entry has expired.'));
    if (this.pending && !force) return this.pending;
    if (!force && !this.isStale())
      return Promise.resolve(this.getResource().serverValue());
    if (force && this.pending) this.invalidate();

    const currentEpoch = ++this.epoch;
    const controller = new AbortController();
    this.controller = controller;
    const options = this.options;
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
            if (this.resource) this.resource.accept(value);
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
          });
        }
        return value;
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
  const evict = (hash: string, entry: QueryEntry<any>) => {
    if (entries.get(hash) !== entry || entry.owners > 0 || entry.isDirty())
      return;
    entries.delete(hash);
    entry.expire();
  };
  return Object.freeze({
    query<T>(queryOptions: QueryOptions<T>): QueryHandle<T> {
      const hash = hashQueryKey(queryOptions.queryKey);
      checkDuration(queryOptions.staleTime ?? 0, 'staleTime');
      checkDuration(queryOptions.gcTime ?? 0, 'gcTime');
      let entry = entries.get(hash) as QueryEntry<T> | undefined;
      if (entry) entry.configure(queryOptions);
      else {
        entry = new QueryEntry(hash, queryOptions, options.ssr ?? false, evict);
        entries.set(hash, entry);
      }
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
        dispose: () => {
          if (!active) return;
          active = false;
          controllers.forEach(controller => controller.abort());
          controllers.clear();
          entry!.detach();
        },
      };
      return Object.freeze(handle);
    },
    invalidate(key: QueryKey) {
      entries.get(hashQueryKey(key))?.invalidate();
    },
    remove(key: QueryKey) {
      const hash = hashQueryKey(key);
      const entry = entries.get(hash);
      if (!entry || entry.owners > 0 || entry.isDirty()) return false;
      evict(hash, entry);
      return true;
    },
    size: () => entries.size,
  });
}
