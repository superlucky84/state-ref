import { create } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import { hashQueryKey } from './key';
import type { QueryKey } from './key';
import { guardRef, guardedWatch } from './ref-guard';
import type { QueryOptions, QueryHandle } from './index';
import type {
  QueryViewHandle,
  QueryViewRef,
  QueryViewState,
  QueryViewWatch,
} from './view';

export type LiveQueryOptions<T> = QueryOptions<T> &
  Readonly<{ enabled?: boolean }>;

export type LiveQueryViewState<S> = Omit<QueryViewState<S>, 'errorSource'> &
  Readonly<{
    errorSource: QueryViewState<S>['errorSource'] | 'source';
    queryKey: QueryKey | null;
    enabled: boolean;
  }>;

export type LiveQueryViewHandle<T, S> = Readonly<{
  /** The current query handle, or null while disabled. */
  query: QueryHandle<T> | null;
  ref: QueryViewRef<LiveQueryViewState<S>>;
  watch: QueryViewWatch<LiveQueryViewState<S>>;
  dispose: () => void;
}>;

const idle = Object.freeze({
  data: undefined,
  phase: 'pending' as const,
  fetchStatus: 'idle' as const,
  isPlaceholder: false,
  error: null,
  errorSource: null,
  queryKey: null,
  enabled: false,
});

/** A stable display cursor that follows a state-ref source across query keys. */
export function createLiveQueryView<I, T, S>(
  source: Watch<I>,
  resolve: (input: I) => LiveQueryOptions<T> | null,
  open: (options: QueryOptions<T>) => QueryViewHandle<T, S>
): LiveQueryViewHandle<T, S> {
  const store = create<LiveQueryViewState<S>>(idle, { autoSync: false });
  const sourceAbort = new AbortController();
  const cursorAbort = new AbortController();
  const controllers = new Set<AbortController>();
  const rawRef = store.watch(() => cursorAbort.signal);
  const refs = new WeakMap<object, object>();
  const snapshots = new WeakMap<object, object>();
  let current = rawRef.value;
  let currentView: QueryViewHandle<T, S> | null = null;
  let currentSubscription: AbortController | null = null;
  let active = true;

  const assertActive = () => {
    if (!active) throw new Error('This live query view has been disposed.');
  };
  const guard = (ref: StateRefStore<LiveQueryViewState<S>>) =>
    guardRef(ref, assertActive, refs, snapshots);
  const watch = guardedWatch(
    store.watch,
    rawRef,
    guard,
    assertActive,
    controllers,
    true
  );
  const publish = (next: LiveQueryViewState<S>) => {
    if (
      Object.is(next.data, current.data) &&
      next.phase === current.phase &&
      next.fetchStatus === current.fetchStatus &&
      next.isPlaceholder === current.isPlaceholder &&
      Object.is(next.error, current.error) &&
      next.errorSource === current.errorSource &&
      Object.is(next.queryKey, current.queryKey) &&
      next.enabled === current.enabled
    )
      return;
    current = next;
    store.updateRef.value = next;
    store.sync();
  };

  const switchTo = (input: I) => {
    let options: LiveQueryOptions<T> | null;
    let key: QueryKey | null;
    let candidate: QueryViewHandle<T, S> | null;
    try {
      options = resolve(input);
      if (
        options &&
        options.enabled !== undefined &&
        typeof options.enabled !== 'boolean'
      ) {
        throw new TypeError('enabled must be a boolean.');
      }
      const hash = options ? hashQueryKey(options.queryKey) : null;
      key = hash === null ? null : (JSON.parse(hash) as QueryKey);
      candidate = options && options.enabled !== false ? open(options) : null;
    } catch (error) {
      currentSubscription?.abort();
      currentSubscription = null;
      currentView?.dispose();
      currentView = null;
      publish(
        Object.freeze({
          ...idle,
          phase: 'error',
          error,
          errorSource: 'source',
        })
      );
      return;
    }
    const previous = currentView;
    currentSubscription?.abort();
    currentSubscription = null;
    currentView = candidate;
    previous?.dispose();
    if (!candidate) {
      publish(Object.freeze({ ...idle, queryKey: key }));
      return;
    }

    const display = (state: QueryViewState<S>): LiveQueryViewState<S> =>
      Object.freeze({ ...state, queryKey: key, enabled: true });
    publish(display(candidate.ref.value));
    // A subscriber may synchronously change the source while publish runs.
    if (currentView !== candidate) return;
    const subscription = new AbortController();
    currentSubscription = subscription;
    candidate.watch((ref, first) => {
      if (currentView === candidate) publish(display(ref.value));
      if (first) return subscription.signal;
    });
    if (currentView === candidate) {
      void candidate.query.load().catch(() => {
        // The query view publishes the error through its own status.
      });
    }
  };

  const releaseCurrent = () => {
    currentSubscription?.abort();
    currentView?.dispose();
    currentView = null;
  };

  try {
    source(
      (ref, first) => {
        switchTo(ref.value);
        if (first) return sourceAbort.signal;
      },
      { cache: false }
    );
  } catch (error) {
    releaseCurrent();
    sourceAbort.abort();
    cursorAbort.abort();
    throw error;
  }

  return Object.freeze({
    get query() {
      assertActive();
      return currentView?.query ?? null;
    },
    ref: guard(rawRef) as QueryViewRef<LiveQueryViewState<S>>,
    watch: watch as QueryViewWatch<LiveQueryViewState<S>>,
    dispose: () => {
      if (!active) return;
      active = false;
      sourceAbort.abort();
      releaseCurrent();
      controllers.forEach(controller => controller.abort());
      controllers.clear();
      cursorAbort.abort();
    },
  });
}
