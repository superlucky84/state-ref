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

type Absent = null | undefined;

/**
 * A state-ref-shaped display cursor with no public setters.
 *
 * Data that may be missing - `data` before the first load, an optional or
 * nullable field - is not split into a union of refs. The paths under it stay
 * open and their leaf values gain `| undefined`, which is what reading through
 * a missing parent returns at run time (DC-QH-18). A union of present types is
 * still distributed, so a discriminated union reads as before.
 */
export type QueryDisplayRef<S> = [Exclude<S, Absent>] extends [never]
  ? { readonly value: S }
  : DisplayNode<
      Exclude<S, Absent>,
      Extract<S, Absent>,
      [Extract<S, Absent>] extends [never] ? never : undefined
    >;

/**
 * One present member `D` of a display value. `E` is what the value itself may
 * also be (`null`, `undefined`); `M` is what every path below it may read as
 * when it is.
 *
 * A child ref always exists at run time, so an optional field gives a
 * non-optional ref whose value may be `undefined` instead.
 */
type Child<D, K extends keyof D, M> = QueryDisplayRef<
  D[K] | M | ({} extends Pick<D, K> ? undefined : never)
>;

type DisplayNode<D, E, M> = D extends readonly any[]
  ? number extends D['length']
    ? {
        readonly [index: number]: QueryDisplayRef<D[number] | M>;
        readonly length: QueryDisplayRef<number | M>;
        readonly value: D | E;
      } & Iterable<QueryDisplayRef<D[number] | M>>
    : { readonly [K in keyof D]-?: Child<D, K, M> } & {
        readonly value: D | E;
      }
  : D extends object
  ? { readonly [K in keyof D]-?: Child<D, K, M> } & {
      readonly value: D | E;
    }
  : { readonly value: D | E };

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
  /**
   * Project again with the latest options and publish only a real change.
   *
   * For an observer whose `select` or `placeholderData` was replaced
   * (DC-QH-26). A display made with fixed options never needs it.
   */
  reproject: () => void;
  dispose: () => void;
}>;

/** The display fields a status and the observer's options determine. */
export type ProjectedDisplay<S> = Omit<
  QueryDisplayState<S>,
  'queryKey' | 'enabled'
>;

/**
 * The last projection, so an unchanged input reuses its result.
 *
 * `select` is part of the key: an observer whose options change gets a new
 * projection for the same input. A display with fixed options always passes
 * the same function, so for it this is the input-only cache it always was.
 */
export type ProjectionMemo<T, S> = {
  last: {
    input: T;
    placeholder: boolean;
    select: ((data: T) => S) | undefined;
    result: { ok: true; data: S } | { ok: false; error: unknown };
  } | null;
};

/**
 * Derive one observer's display fields from the shared status.
 *
 * `readValue` is only called once the query has a baseline, because reading
 * the data before that throws. A `select` failure belongs to this observer
 * alone (`errorSource: 'select'`) and leaves the query's own status as is.
 */
export function projectDisplay<T, S>(
  status: QueryStatus,
  readValue: () => T,
  options: QueryDisplayOptions<T, S>,
  memo: ProjectionMemo<T, S>
): ProjectedDisplay<S> {
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
    const input = status.loaded ? readValue() : options.placeholderData!;
    const select = options.select;
    const last = memo.last;
    if (
      !last ||
      !Object.is(input, last.input) ||
      isPlaceholder !== last.placeholder ||
      select !== last.select
    ) {
      const project = select ?? ((value: T) => value as unknown as S);
      let result: NonNullable<ProjectionMemo<T, S>['last']>['result'];
      try {
        result = { ok: true, data: project(input) };
      } catch (selectionError) {
        result = { ok: false, error: selectionError };
      }
      memo.last = { input, placeholder: isPlaceholder, select, result };
    }
    const result = memo.last!.result;
    if (result.ok) {
      data = result.data;
    } else {
      resolved = 'error';
      error = result.error;
      errorSource = 'select';
      isPlaceholder = false;
    }
  }
  return {
    ...status,
    status: resolved,
    error,
    data,
    isPlaceholder,
    errorSource,
  };
}

const isPlain = (value: unknown): value is Record<PropertyKey, unknown> => {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/**
 * `next` with every part that deeply equals `previous` replaced by the
 * previous object - TanStack's structural sharing.
 *
 * Plain objects and arrays are shared, and a `Date` with the same time is
 * kept. Anything else (Map, Set, class instances) is compared by identity
 * only, so a `select` that builds one fresh each time still changes.
 */
export function shareStructure(previous: unknown, next: unknown): unknown {
  if (Object.is(previous, next)) return previous;
  if (previous instanceof Date && next instanceof Date) {
    return previous.getTime() === next.getTime() ? previous : next;
  }
  if (Array.isArray(previous) && Array.isArray(next)) {
    let same = previous.length === next.length;
    const shared = next.map((item, index) => {
      const value = shareStructure(previous[index], item);
      if (!Object.is(value, previous[index])) same = false;
      return value;
    });
    return same ? previous : shared;
  }
  if (isPlain(previous) && isPlain(next)) {
    const previousKeys = Object.keys(previous);
    const nextKeys = Object.keys(next);
    let same = previousKeys.length === nextKeys.length;
    const shared: Record<PropertyKey, unknown> = Object.create(
      Object.getPrototypeOf(next)
    );
    for (const key of nextKeys) {
      const value = shareStructure(previous[key], next[key]);
      if (
        !Object.prototype.hasOwnProperty.call(previous, key) ||
        !Object.is(value, previous[key])
      ) {
        same = false;
      }
      shared[key] = value;
    }
    return same ? previous : shared;
  }
  return next;
}

/** Same kind and message: a `select` that keeps failing the same way. */
export function sameSelectError(next: unknown, previous: unknown): boolean {
  if (Object.is(next, previous)) return true;
  return (
    next instanceof Error &&
    previous instanceof Error &&
    next.constructor === previous.constructor &&
    next.message === previous.message
  );
}

/**
 * Carry the previous result over when re-projecting gave the same thing in a
 * new object - the step that keeps an inline `select` from republishing on
 * every commit (DC-QH-26). The memo is updated too, so the next ordinary
 * recalculation reuses the kept object instead of reintroducing the new one.
 */
export function carryProjection<T, S>(
  next: ProjectedDisplay<S>,
  previous: ProjectedDisplay<S>,
  memo: ProjectionMemo<T, S>
): ProjectedDisplay<S> {
  const last = memo.last;
  if (
    next.errorSource === 'select' &&
    previous.errorSource === 'select' &&
    sameSelectError(next.error, previous.error)
  ) {
    if (last) last.result = { ok: false, error: previous.error };
    return { ...next, error: previous.error };
  }
  if (next.data !== undefined && previous.data !== undefined) {
    const data = shareStructure(previous.data, next.data) as S;
    if (!Object.is(data, next.data)) {
      if (last) last.result = { ok: true, data };
      return { ...next, data };
    }
  }
  return next;
}

/**
 * One observer's display state over a query.
 *
 * Never installs placeholder or selection in the shared cache. The query is
 * *not* owned here: the handle that exposes this display owns it, so
 * `dispose()` releases only this observer's subscriptions.
 *
 * `options` may be a function, read at every calculation, for an observer
 * whose options change after it is made (DC-QH-26); `reproject()` then
 * applies a new `select` or `placeholderData` without waiting for the cache.
 */
export function createQueryDisplay<T, S = T>(
  query: DisplaySource<T>,
  options: QueryDisplayOptions<T, S> | (() => QueryDisplayOptions<T, S>) = {}
): QueryDisplayHandle<S> {
  const readOptions = typeof options === 'function' ? options : () => options;
  const controllers = new Set<AbortController>();
  const statusAbort = new AbortController();
  const displayAbort = new AbortController();
  let dataAbort: AbortController | null = null;
  let active = true;
  const memo: ProjectionMemo<T, S> = { last: null };

  /**
   * Read once and reused.
   *
   * `query.queryKey` parses its hash on every read, so it answers a fresh
   * array each time - comparing those by identity would republish forever.
   * A fixed query handle never changes key, so one read is the key.
   */
  const queryKey = query.queryKey;

  const calculate = (value?: T): QueryDisplayState<S> =>
    Object.freeze({
      ...projectDisplay(
        query.status.value,
        () => value ?? query.ref.value,
        readOptions(),
        memo
      ),
      queryKey,
      enabled: true,
    });

  const store = create<QueryDisplayState<S>>(calculate(), { autoSync: false });
  const rawRef = store.watch(() => displayAbort.signal);
  let current = rawRef.value;
  let comparisonFailure: { data: S; error: unknown } | null = null;
  const publish = (value?: T, carry = false) => {
    if (!active) return;
    let next = calculate(value);
    if (carry) {
      next = Object.freeze({
        ...carryProjection(next, current, memo),
        queryKey,
        enabled: true,
      });
    }
    const equals = readOptions().equals ?? Object.is;
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
    reproject: () => publish(undefined, true),
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
