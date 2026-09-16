/**
 * S StoreType<V>; // Append root to the first value type V you are given
 * G StateRefStore<V>; // Add "value" to the ending  point with “root” unattached.
 * T StateRefStore<StoreType<V>>; // Attach a "value" to the ending point in the state where the root exists.
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

export type Watch<V> = (
  renew?: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean; editable?: boolean }
) => StateRefStore<V>;

export type RunInfo<A> = {
  value: A;
  getNextValue: () => A;
  key: string;
  primitiveSetter?: (newValue: A) => void;
};

export type RenderListSub<A> = Map<string, RunInfo<A>>;

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
