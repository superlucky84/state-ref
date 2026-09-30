import { create } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import { hashQueryKey } from './key';
import type { QueryKey } from './key';
import { guardRef, guardedWatch } from './ref-guard';
import type { QueryOptions, QueryHandle } from './index';
import {
  IDLE_STATUS,
  sameDisplay,
  type QueryDisplayHandle,
  type QueryDisplayRef,
  type QueryDisplayState,
  type QueryDisplayWatch,
} from './display';

export type LiveQueryOptions<T> = QueryOptions<T> &
  Readonly<{ enabled?: boolean }>;

/** A query and the one observer's display over it, opened together. */
export type OpenedQuery<T, S> = Readonly<{
  query: QueryHandle<T, S>;
  display: QueryDisplayHandle<S>;
}>;

export type LiveQueryCursor<T, S> = Readonly<{
  /** The query for the active key, or null while there is none. */
  current: () => QueryHandle<T, S> | null;
  ref: QueryDisplayRef<QueryDisplayState<S>>;
  watch: QueryDisplayWatch<QueryDisplayState<S>>;
  dispose: () => void;
}>;

const idle = <S>(): QueryDisplayState<S> =>
  Object.freeze({
    ...IDLE_STATUS,
    data: undefined as S | undefined,
    isPlaceholder: false,
    errorSource: null,
    queryKey: null,
    enabled: false,
  });

/**
 * A stable display cursor that follows a state-ref source across query keys.
 *
 * The cursor outlives every query it opens, so `ref`/`watch` stay the same
 * observation point for the handle's whole life while the query underneath
 * is replaced (DC9-10).
 */
export function createLiveQuery<I, T, S>(
  source: Watch<I>,
  resolve: (input: I) => LiveQueryOptions<T> | null,
  open: (options: QueryOptions<T>) => OpenedQuery<T, S>
): LiveQueryCursor<T, S> {
  const store = create<QueryDisplayState<S>>(idle<S>(), { autoSync: false });
  const sourceAbort = new AbortController();
  const cursorAbort = new AbortController();
  const controllers = new Set<AbortController>();
  const rawRef = store.watch(() => cursorAbort.signal);
  const refs = new WeakMap<object, object>();
  const snapshots = new WeakMap<object, object>();
  let current = rawRef.value;
  let opened: OpenedQuery<T, S> | null = null;
  let currentSubscription: AbortController | null = null;
  let active = true;

  const assertActive = () => {
    if (!active) throw new Error('This query handle has been disposed.');
  };
  const guard = (ref: StateRefStore<QueryDisplayState<S>>) =>
    guardRef(ref, assertActive, refs, snapshots);
  const watch = guardedWatch(
    store.watch,
    rawRef,
    guard,
    assertActive,
    controllers,
    true
  );
  const publish = (next: QueryDisplayState<S>) => {
    if (Object.is(next.data, current.data) && sameDisplay(next, current))
      return;
    current = next;
    store.updateRef.value = next;
    store.sync();
  };
  const release = () => {
    currentSubscription?.abort();
    currentSubscription = null;
    opened?.display.dispose();
    opened?.query.dispose();
    opened = null;
  };

  const switchTo = (input: I) => {
    let options: LiveQueryOptions<T> | null;
    let key: QueryKey | null;
    let candidate: OpenedQuery<T, S> | null;
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
      release();
      publish(
        Object.freeze({
          ...idle<S>(),
          status: 'error' as const,
          error,
          errorSource: 'source' as const,
        })
      );
      return;
    }
    const previous = opened;
    currentSubscription?.abort();
    currentSubscription = null;
    opened = candidate;
    previous?.display.dispose();
    previous?.query.dispose();
    if (!candidate) {
      publish(Object.freeze({ ...idle<S>(), queryKey: key }));
      return;
    }

    // The inner display reports its own key and `enabled: true`; the cursor
    // owns both facts, so it overlays the key it actually resolved.
    const overlay = (state: QueryDisplayState<S>): QueryDisplayState<S> =>
      Object.freeze({ ...state, queryKey: key, enabled: true });
    publish(overlay(candidate.display.ref.value));
    // A subscriber may synchronously change the source while publish runs.
    if (opened !== candidate) return;
    const subscription = new AbortController();
    currentSubscription = subscription;
    candidate.display.watch((ref, first) => {
      if (opened === candidate) publish(overlay(ref.value));
      if (first) return subscription.signal;
    });
    if (opened === candidate) {
      void candidate.query.load().catch(() => {
        // The display publishes the error through its own status.
      });
    }
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
    release();
    sourceAbort.abort();
    cursorAbort.abort();
    throw error;
  }

  return Object.freeze({
    current: () => {
      assertActive();
      return opened?.query ?? null;
    },
    ref: guard(rawRef) as QueryDisplayRef<QueryDisplayState<S>>,
    watch: watch as QueryDisplayWatch<QueryDisplayState<S>>,
    dispose: () => {
      if (!active) return;
      active = false;
      sourceAbort.abort();
      release();
      controllers.forEach(controller => controller.abort());
      controllers.clear();
      cursorAbort.abort();
    },
  });
}
