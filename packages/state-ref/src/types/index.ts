import type { PathNode } from '@/path';

/**
 * S StoreType<V>; // Append root to the first value type V you are given
 * G StateRefStore<V>; // Add "value" to the ending  point with “root” unattached.
 * T StateRefStore<StoreType<V>>; // Attach a "value" to the ending point in the state where the root exists.
 */
/**
 * A subscription callback.
 *
 * Its return value is how a subscription ends - there is no `dispose()`:
 *
 * - an `AbortSignal` returned from the **first** run (`isFirst === true`) is
 *   registered, and aborting it later drops the subscription
 * - `false` returned from any **later** run drops it immediately
 *
 * A signal returned from a later run is not registered, and `false` on the
 * first run is ignored - the store is not yet listening for either. The same
 * rules hold through `combineWatch` and `createComputed`, where teardown
 * reaches every subscription the helper made.
 */
export type Renew<G> = (
  store: G,
  isFirst: boolean
) => boolean | AbortSignal | void;

export type Run = null | ((isFirst?: boolean) => boolean | AbortSignal | void);
export type StoreType<V> = { root: V };
export type WithRoot = { root: unknown } & { [key: string | symbol]: unknown };
/**
 * A stateRef mirrors the shape of the value it points at, with `.value` at
 * every node.
 *
 * Arrays get their own branch. A proxy only ever holds a path, so it cannot
 * carry real array methods - `ref.items.map(fn)` used to type-check and then
 * fail at runtime. Indexing, `length` and iteration are all genuine paths, so
 * those are what the type exposes:
 *
 *   ref.items[0].value        // element
 *   ref.items.length.value    // reactive, re-runs when the array is replaced
 *   ref.items.value.length    // plain snapshot
 *   [...ref.items]            // Iterable
 *
 * Tuples keep their positional types; only variable-length arrays collapse to
 * an index signature.
 */
export type StateRefStore<S> = S extends readonly any[]
  ? number extends S['length']
    ? {
        [index: number]: StateRefStore<S[number]>;
      } & {
        length: StateRefStore<number>;
        value: S;
      } & Iterable<StateRefStore<S[number]>>
    : {
        -readonly [K in keyof S]: StateRefStore<S[K]>;
      } & {
        value: S;
      }
  : S extends object
  ? {
      [K in keyof S]: StateRefStore<S[K]>;
    } & {
      value: S;
    }
  : { value: S };

/**
 * Subscribes, or hands back a reference when called with no callback.
 *
 * `cache` (default `true`) de-duplicates by callback identity: calling
 * `watch(fn)` twice with the same `fn` returns the same reference and
 * subscribes once. `cache: false` asks for a subscription of its own every
 * time, so N calls mean N subscriptions and N invocations per change - that is
 * the point of the option, not a leak. Such a subscription can only be ended
 * through its callback's return value (see `Renew`), and it no longer occupies
 * the cache slot, so a later cached `watch(fn)` still makes its own.
 */
export type Watch<V> = (
  renew?: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean; editable?: boolean }
) => StateRefStore<V>;

export type RunInfo<A> = {
  value: A;
  getNextValue: () => A;
};

export type RenderListSub<A> = Map<PathNode, RunInfo<A>>;

export type StoreRenderList<A> = Map<Run, RenderListSub<A>>;

export type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(v: V) => Root;
};

export type StateRefsTuple<W extends readonly Watch<any>[]> = {
  -readonly [K in keyof W]: W[K] extends Watch<infer T>
    ? StateRefStore<T>
    : never;
};

export type CombinedValue<W extends readonly Watch<any>[]> = {
  [K in keyof W]: W[K] extends Watch<infer T> ? T : never;
};

export type ManualSyncStore<V> = {
  watch: Watch<V>;
  updateRef: StateRefStore<V>;
  sync: () => void;
};

/**
 * Options for `createStore` / `createStoreManualSync`.
 *
 * `trackDeps` re-collects a subscriber's dependencies on every run: a path the
 * callback no longer reads stops waking it. It is off by default because it
 * changes how often subscribers are called, which is a behaviour change for
 * existing code rather than a fix.
 */
export type CreateStoreOption = { trackDeps?: boolean };
