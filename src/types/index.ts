export type Renew<T> = (store: T) => boolean | AbortSignal | void;
export type Run = null | (() => boolean | AbortSignal | void);
export type StoreType<V> = { root: V };
export type WithRoot = { root: unknown } & { [key: string | symbol]: unknown };
export type WrapWithValue<S> = S extends object
  ? {
      [K in keyof S]: WrapWithValue<S[K]> & { value: WrapWithValue<S[K]> };
    } & {
      value: { [K in keyof S]: WrapWithValue<S[K]> } & { value: S };
    }
  : { value: S };

export type PrivitiveType =
  | string
  | number
  | symbol
  | null
  | undefined
  | boolean
  | bigint;

export type RunInfo<A> = {
  value: A;
  getNextValue: () => A;
  key: string;
  primitiveSetter?: (newValue: A) => void;
};

export type RenderListSub<A> = Map<string, RunInfo<A>>;

export type StoreRenderList<A> = Map<Run, RenderListSub<A>>;
