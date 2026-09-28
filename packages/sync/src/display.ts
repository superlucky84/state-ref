import { create } from 'state-ref';
import type { StateRefStore } from 'state-ref';
import { guardRef, guardedWatch } from './ref-guard';
import type { QueryKey } from './key';
import type { QueryHandle, QueryStatus } from './index';

export type QueryDisplayOptions<T, S = T> = Readonly<{
  /** Runs only for this observer; the shared cache keeps the original data. */
  select?: (data: T) => S;
  /** Shown before the first baseline, never stored in the shared cache. */
  placeholderData?: T;
  /** Compares selected values; Object.is is used by default. */
  equals?: (next: S, previous: S) => boolean;
}>;

/**
 * One observer's state.
 *
 * A strict superset of `QueryStatus` using the same field names (DC9-09).
 * There is no `phase`: it was `status` plus a placeholder flag, and
 * `isPlaceholder` already carried that fact. Merging the two vocabularies
 * removes a word rather than adding one.
 */
export type QueryDisplayState<S> = QueryStatus &
  Readonly<{
    data: S | undefined;
    isPlaceholder: boolean;
    errorSource: 'query' | 'select' | 'source' | null;
    /** null while a reactive key resolves to no query. */
    queryKey: QueryKey | null;
    enabled: boolean;
  }>;

/** A state-ref-shaped display cursor with no public setters. */
export type QueryDisplayRef<S> = S extends readonly any[]
  ? number extends S['length']
    ? {
        readonly [index: number]: QueryDisplayRef<S[number]>;
        readonly length: QueryDisplayRef<number>;
        readonly value: S;
      } & Iterable<QueryDisplayRef<S[number]>>
    : { readonly [K in keyof S]: QueryDisplayRef<S[K]> } & {
        readonly value: S;
      }
  : S extends object
  ? { readonly [K in keyof S]: QueryDisplayRef<S[K]> } & {
      readonly value: S;
    }
  : { readonly value: S };

export type QueryDisplayWatch<S> = (
  renew?: (
    ref: QueryDisplayRef<S>,
    isFirst: boolean
  ) => boolean | AbortSignal | void,
  option?: { cache?: boolean }
) => QueryDisplayRef<S>;

/** What a reactive key shows while it resolves to no query. */
export const IDLE_STATUS: QueryStatus = Object.freeze({
  status: 'pending' as const,
  fetchStatus: 'idle' as const,
  loaded: false,
  error: null,
  updatedAt: null,
  invalidated: false,
  dirty: false,
  conflicts: 0,
  version: 0,
  pending: 0,
  unconfirmed: false,
});

/**
 * What a display reads from its query.
 *
 * Narrower than the handle on purpose: the handle is generic in its own
 * display type, so depending on the whole of it would make the two types
 * chase each other.
 */
export type DisplaySource<T> = Pick<
  QueryHandle<T, any>,
  'queryKey' | 'ref' | 'watch' | 'status' | 'watchStatus'
>;

export type QueryDisplayHandle<S> = Readonly<{
  ref: QueryDisplayRef<QueryDisplayState<S>>;
  watch: QueryDisplayWatch<QueryDisplayState<S>>;
  dispose: () => void;
}>;

/**
 * One observer's display state over a query.
 *
 * Never installs placeholder or selection in the shared cache. The query is
 * *not* owned here: the handle that exposes this display owns it, so
 * `dispose()` releases only this observer's subscriptions.
 */
export function createQueryDisplay<T, S = T>(
  query: DisplaySource<T>,
  options: QueryDisplayOptions<T, S> = {}
): QueryDisplayHandle<S> {
  const project = options.select ?? ((data: T) => data as unknown as S);
  const equals = options.equals ?? Object.is;
  const controllers = new Set<AbortController>();
  const statusAbort = new AbortController();
  const displayAbort = new AbortController();
  let dataAbort: AbortController | null = null;
  let active = true;
  let lastInput: T | undefined;
  let lastPlaceholder = false;
  let lastProjection:
    | { ok: true; data: S }
    | { ok: false; error: unknown }
    | null = null;

  /**
   * Read once and reused.
   *
   * `query.queryKey` parses its hash on every read, so it answers a fresh
   * array each time - comparing those by identity would republish forever.
   * A fixed query handle never changes key, so one read is the key.
   */
  const queryKey = query.queryKey;

  const calculate = (value?: T): QueryDisplayState<S> => {
    const status = query.status.value;
    let data: S | undefined;
    let resolved = status.status;
    let error = status.error;
    let errorSource: QueryDisplayState<S>['errorSource'] =
      status.status === 'error' ? 'query' : null;
    let isPlaceholder = false;
    if (
      status.loaded ||
      (status.status !== 'error' && options.placeholderData !== undefined)
    ) {
      isPlaceholder = !status.loaded;
      const input = status.loaded
        ? value ?? query.ref.value
        : options.placeholderData!;
      if (
        !lastProjection ||
        !Object.is(input, lastInput) ||
        isPlaceholder !== lastPlaceholder
      ) {
        lastInput = input;
        lastPlaceholder = isPlaceholder;
        try {
          lastProjection = { ok: true, data: project(input) };
        } catch (selectionError) {
          lastProjection = { ok: false, error: selectionError };
        }
      }
      if (lastProjection.ok) {
        data = lastProjection.data;
      } else {
        resolved = 'error';
        error = lastProjection.error;
        errorSource = 'select';
        isPlaceholder = false;
      }
    }
    return Object.freeze({
      ...status,
      status: resolved,
      error,
      data,
      isPlaceholder,
      errorSource,
      queryKey,
      enabled: true,
    });
  };

  const store = create<QueryDisplayState<S>>(calculate(), { autoSync: false });
  const rawRef = store.watch(() => displayAbort.signal);
  let current = rawRef.value;
  let comparisonFailure: { data: S; error: unknown } | null = null;
  const publish = (value?: T) => {
    if (!active) return;
    let next = calculate(value);
    let sameData = false;
    let comparisonError: unknown;
    let comparisonFailed = false;
    if (comparisonFailure && Object.is(next.data, comparisonFailure.data)) {
      comparisonError = comparisonFailure.error;
      comparisonFailed = true;
    } else {
      comparisonFailure = null;
      try {
        sameData =
          Object.is(next.data, current.data) ||
          (next.data !== undefined &&
            current.data !== undefined &&
            equals(next.data, current.data));
      } catch (error) {
        comparisonFailure = { data: next.data as S, error };
        comparisonError = error;
        comparisonFailed = true;
      }
    }
    if (comparisonFailed) {
      next = Object.freeze({
        ...next,
        data: undefined,
        status: 'error' as const,
        error: comparisonError,
        errorSource: 'select' as const,
        isPlaceholder: false,
      });
      sameData = Object.is(next.data, current.data);
    }
    /**
     * `equals` answering true has to keep the previous value, not just skip
     * the notification.
     *
     * The display also carries the shared status now (DC9-09), so a change to
     * `dirty` or `version` publishes even when the selected value is
     * unchanged. Re-projecting produces a fresh object each time, and
     * publishing that would wake every subscriber watching `data` - which is
     * exactly what `equals` exists to prevent.
     */
    if (sameData && !Object.is(next.data, current.data))
      next = Object.freeze({ ...next, data: current.data });
    if (sameData && sameDisplay(next, current)) return;
    current = next;
    store.updateRef.value = next;
    store.sync();
  };

  query.watchStatus((status, first) => {
    void status.value;
    if (status.loaded.value && !dataAbort) {
      dataAbort = new AbortController();
      query.watch(
        (ref, initial) => {
          const value = ref.value;
          publish(value);
          if (initial) return dataAbort!.signal;
        },
        { editable: false }
      );
    }
    publish();
    if (first) return statusAbort.signal;
  });

  const assertActive = () => {
    if (!active) throw new Error('This query display has been disposed.');
  };
  const refs = new WeakMap<object, object>();
  const snapshots = new WeakMap<object, object>();
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
  return Object.freeze({
    ref: guard(rawRef) as QueryDisplayRef<QueryDisplayState<S>>,
    watch: watch as QueryDisplayWatch<QueryDisplayState<S>>,
    dispose: () => {
      if (!active) return;
      active = false;
      dataAbort?.abort();
      statusAbort.abort();
      controllers.forEach(controller => controller.abort());
      controllers.clear();
      displayAbort.abort();
    },
  });
}

/** Every display field but `data`, which its own comparator handles. */
export function sameDisplay<S>(
  next: QueryDisplayState<S>,
  current: QueryDisplayState<S>
): boolean {
  return (
    next.status === current.status &&
    next.fetchStatus === current.fetchStatus &&
    next.loaded === current.loaded &&
    Object.is(next.error, current.error) &&
    next.updatedAt === current.updatedAt &&
    next.invalidated === current.invalidated &&
    next.dirty === current.dirty &&
    next.conflicts === current.conflicts &&
    next.version === current.version &&
    next.pending === current.pending &&
    next.unconfirmed === current.unconfirmed &&
    next.isPlaceholder === current.isPlaceholder &&
    next.errorSource === current.errorSource &&
    next.enabled === current.enabled &&
    Object.is(next.queryKey, current.queryKey)
  );
}
