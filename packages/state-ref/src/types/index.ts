/**
 * S StoreType<V>; // 처음 제공받는 값 타입 V에 root를 달음
 * G StateRefStore<V>; // 끝에 root가 안달린 상태 끝에 current를 달음
 * T StateRefStore<StoreType<V>>; // 끝에 root가 달린 상태 끝에 current를 달음
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
      current: S;
    }
  : { current: S };
// [K in keyof S]: StateRefStore<S[K]> & { current: S[K] };
// current: { [K in keyof S]: StateRefStore<S[K]> } & { current: S };

export type Capture<V> = (
  renew: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean }
) => StateRefStore<V>;

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

export type Copyable<T> = {
  [K in keyof T]: Copyable<T[K]>;
} & {
  writeCopy: <J>(v?: T) => J; // lensIns.set의 반환 타입을 사용
};
