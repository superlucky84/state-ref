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
export type StateRefStore<S> = S extends object
  ? {
      [K in keyof S]: StateRefStore<S[K]>;
    } & {
      value: S;
    }
  : { value: S };
// [K in keyof S]: StateRefStore<S[K]> & { value: S[K] };
// value: { [K in keyof S]: StateRefStore<S[K]> } & { value: S };

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
