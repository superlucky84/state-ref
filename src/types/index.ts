export type Renew<T> = (store: T) => boolean | AbortSignal | void;
export type Run = null | (() => boolean | AbortSignal | void);
export type StoreType<V> = { root: V };
export type WithRoot = { root: unknown } & { [key: string | symbol]: unknown };
export type WrapWithValue<S> = S extends object
  ? { [K in keyof S]: WrapWithValue<S[K]> }
  : { value: S };
