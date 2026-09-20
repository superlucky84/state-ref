import { create } from 'state-ref';
import type { StateRefStore } from 'state-ref';
import { guardRef, guardedWatch } from './ref-guard';
import type { QueryHandle, QueryStatus } from './index';

export type QueryViewOptions<T, S = T> = Readonly<{
  /** Runs only for this view; the shared cache keeps the original data. */
  select?: (data: T) => S;
  /** Shown before the first baseline, never stored in the shared cache. */
  placeholderData?: T;
  /** Compares selected values; Object.is is used by default. */
  equals?: (next: S, previous: S) => boolean;
}>;

export type QueryViewState<S> = Readonly<{
  data: S | undefined;
  phase: 'pending' | 'placeholder' | 'success' | 'error';
  fetchStatus: QueryStatus['fetchStatus'];
  isPlaceholder: boolean;
  error: unknown | null;
  errorSource: 'query' | 'select' | null;
}>;

/** A state-ref-shaped display cursor with no public setters. */
export type QueryViewRef<S> = S extends readonly any[]
  ? number extends S['length']
    ? {
        readonly [index: number]: QueryViewRef<S[number]>;
        readonly length: QueryViewRef<number>;
        readonly value: S;
      } & Iterable<QueryViewRef<S[number]>>
    : { readonly [K in keyof S]: QueryViewRef<S[K]> } & {
        readonly value: S;
      }
  : S extends object
  ? { readonly [K in keyof S]: QueryViewRef<S[K]> } & {
      readonly value: S;
    }
  : { readonly value: S };

export type QueryViewWatch<S> = (
  renew?: (
    ref: QueryViewRef<S>,
    isFirst: boolean
  ) => boolean | AbortSignal | void,
  option?: { cache?: boolean }
) => QueryViewRef<S>;

export type QueryViewHandle<T, S> = Readonly<{
  /** The editable query handle owned by this view. */
  query: QueryHandle<T>;
  ref: QueryViewRef<QueryViewState<S>>;
  watch: QueryViewWatch<QueryViewState<S>>;
  dispose: () => void;
}>;

/** One observer's display state; never installs placeholder or selection in the cache. */
export function createQueryView<T, S = T>(
  query: QueryHandle<T>,
  options: QueryViewOptions<T, S> = {}
): QueryViewHandle<T, S> {
  const project = options.select ?? ((data: T) => data as unknown as S);
  const equals = options.equals ?? Object.is;
  const controllers = new Set<AbortController>();
  const statusAbort = new AbortController();
  const viewAbort = new AbortController();
  let dataAbort: AbortController | null = null;
  let active = true;
  let lastInput: T | undefined;
  let lastPlaceholder = false;
  let lastProjection:
    | { ok: true; data: S }
    | { ok: false; error: unknown }
    | null = null;

  const calculate = (value?: T): QueryViewState<S> => {
    const status = query.status.value;
    let data: S | undefined;
    let phase: QueryViewState<S>['phase'] = status.status;
    let error = status.error;
    let errorSource: QueryViewState<S>['errorSource'] =
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
        if (isPlaceholder) phase = 'placeholder';
      } else {
        phase = 'error';
        error = lastProjection.error;
        errorSource = 'select';
        isPlaceholder = false;
      }
    }
    return Object.freeze({
      data,
      phase,
      fetchStatus: status.fetchStatus,
      isPlaceholder,
      error,
      errorSource,
    });
  };

  const store = create<QueryViewState<S>>(calculate(), { autoSync: false });
  const rawRef = store.watch(() => viewAbort.signal);
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
        phase: 'error' as const,
        error: comparisonError,
        errorSource: 'select' as const,
        isPlaceholder: false,
      });
      sameData = Object.is(next.data, current.data);
    }
    if (
      sameData &&
      next.phase === current.phase &&
      next.fetchStatus === current.fetchStatus &&
      next.isPlaceholder === current.isPlaceholder &&
      Object.is(next.error, current.error) &&
      next.errorSource === current.errorSource
    )
      return;
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
    if (!active) throw new Error('This query view has been disposed.');
  };
  const refs = new WeakMap<object, object>();
  const snapshots = new WeakMap<object, object>();
  const guard = (ref: StateRefStore<QueryViewState<S>>) =>
    guardRef(ref, assertActive, refs, snapshots);
  const watch = guardedWatch(
    store.watch,
    rawRef,
    guard,
    assertActive,
    controllers,
    true
  );
  const handle: QueryViewHandle<T, S> = {
    query,
    ref: guard(rawRef) as QueryViewRef<QueryViewState<S>>,
    watch: watch as QueryViewWatch<QueryViewState<S>>,
    dispose: () => {
      if (!active) return;
      active = false;
      dataAbort?.abort();
      statusAbort.abort();
      controllers.forEach(controller => controller.abort());
      controllers.clear();
      viewAbort.abort();
      query.dispose();
    },
  };
  return Object.freeze(handle);
}
