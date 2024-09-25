import { makeProxy } from '@/makeProxy';
import { ShelfPrimitive } from '@/helper';
import type { Renew, StoreType, WrapWithValue, Run } from '@/types';
// import { addDependency } from '@/dependency';

// type ObjectType = { [key: string | symbol]: unknown }; // 객체타입
type PrivitiveType = string | number | symbol | null | undefined; // 기본타입

/**
 * DataStore
 */

function isPrimitiveType(orignalValue: unknown): orignalValue is PrivitiveType {
  const isObjectTypeValue =
    typeof orignalValue === 'object' && orignalValue !== null;

  return !isObjectTypeValue;
}

const DEFAULT_OPTION = { cache: true };

// export const store = <V extends { [key: string | symbol]: unknown }>(
export const store = <V>(orignalValue: V) => {
  type S = StoreType<V>; // 처음 제공받는 값 타입 V에 root를 달음
  type G = WrapWithValue<V>; // 끝에 root가 안달린 상태 끝에 value를 달음
  type T = WrapWithValue<S>; // 끝에 root가 달린 상태 끝에 value를 달음

  const storeRenderList: Map<Run, [G, () => G, number][]> = new Map();
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
    if (isPrimitiveType(orignalValue)) {
      const temp: { j: null | G } = { j: null };

      if (renew) {
        // const run = () => renew(temp.j!);
      }

      // const runAddDeps = addDependency({ run, storeRenderList, depthList: [] });
      const shelf = new ShelfPrimitive<PrivitiveType>(
        orignalValue,
        []
      ) as unknown as G;

      const value: S = { root: shelf } as S;
      temp.j = value.root as G;

      return shelf;
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
      proxy.j = makeProxy<S, T, G>(value, storeRenderList, run);

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
