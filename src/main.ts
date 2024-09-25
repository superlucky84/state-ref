import { makeProxy } from '@/makeProxy';
import { ShelfPrimitive } from '@/helper';
import { addDependency } from '@/dependency';

/**
 * DataStore
 */
type Renew<T> = (store: T) => boolean | AbortSignal | void;
type Run = null | (() => boolean | AbortSignal | void);
type StoreType<V> = { root: V };
type WrapWithValue<S> = S extends object
  ? { [K in keyof S]: WrapWithValue<S[K]> }
  : { value: S };

function isPrimitive<P, V>(orignalValue: P | V): orignalValue is P {
  const isObjectTypeValue =
    !Array.isArray(orignalValue) &&
    typeof orignalValue === 'object' &&
    orignalValue !== null;

  return !isObjectTypeValue;
}

const DEFAULT_OPTION = { cache: true };

// export const store = <V extends { [key: string | symbol]: unknown }>(
export const store = <P, V>(orignalValue: P | V) => {
  type S = StoreType<V>; // 처음 제공받는 값 타입 V에 root를 달음
  type G = WrapWithValue<V> | WrapWithValue<P>; // 끝에 root가 안달린 상태 끝에 value를 달음
  type T = WrapWithValue<S>; // 끝에 root가 달린 상태 끝에 value를 달음

  const storeRenderList: Map<Run, [P | V, () => P | V, number][]> = new Map();
  const cacheMap = new WeakMap<Renew<G>, G>();

  return (renew?: Renew<G>, userOption?: { cache?: boolean }) => {
    /**
     * 캐시처리
     */
    const { cache } = Object.assign({}, DEFAULT_OPTION, userOption || {});

    if (cache && renew && cacheMap.has(renew)) {
      return cacheMap.get(renew) as G;
    }

    /**
     * 객체 가 아닌 데이터면 shelfPrimitive로 만들어서 반환
     */
    if (isPrimitive<P, V>(orignalValue)) {
      const temp: { j: null | ShelfPrimitive<P> } = { j: null };
      // const value: S = { root: orignalValue } as S;
      if (renew) {
        const run = () => renew(temp.j!);
      }

      // const runAddDeps = addDependency({ run, storeRenderList, depthList: [] });
      temp.j = new ShelfPrimitive<P>(orignalValue, []);

      return temp.j;
    }

    /**
     * 객체일때는 프록시 만들어서 리턴
     */
    const initialValue = orignalValue as V;
    const value: S = { root: initialValue } as S;

    const proxy: { j: null | T } = {
      j: null,
    };

    if (renew) {
      const run = () => renew(proxy.j!.root);
      proxy.j = makeProxy<S, T, V, P>(value, storeRenderList, run);

      // 처음 실행시 abort 이벤트 리스너에 추가
      runFirstEmit(run, storeRenderList, cacheMap, renew);

      cacheMap.set(renew, proxy.j!.root);
    }

    return proxy.j!.root;
  };
};

const runFirstEmit = <P, V, G>(
  run: Run,
  storeRenderList: Map<Run, [P | V, () => P | V, number][]>,
  cacheMap: WeakMap<Renew<G>, G>,
  renew: Renew<G>
) => {
  const renewResult = run!();

  if (renewResult instanceof AbortSignal) {
    // 구독 취소시 일부로 구독 수집기를 고장냄
    renewResult.addEventListener('abort', () => {
      const chatValue = {} as V;
      cacheMap.delete(renew);
      storeRenderList.set(run, [[chatValue, () => chatValue, 0]]);
    });
  }
};
