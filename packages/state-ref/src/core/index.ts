import { isPrimitiveType, DEFAULT_OPTION } from '@/helper';
import { makePrimitive } from '@/core/primitive';
import { makeObject } from '@/core/object';

import type { Renew, StoreType, StateRefStore, StoreRenderList } from '@/types';

/**
 * createStore 스토어를 만들어 준다
 * 인자는 초기값
 * const watch = createStore({ name: 'brown', age: 38 })
 * const stateRef = watch(stateRef => {
 *   console.log(stateRef.value));
 * });
 */
export function createStore<V>(orignalValue: V) {
  const storeRenderList: StoreRenderList<V> = new Map();
  const cacheMap = new WeakMap<Renew<StateRefStore<V>>, StateRefStore<V>>();
  const rootValue: StoreType<V> = { root: orignalValue };

  return (
    renew: Renew<StateRefStore<V>> = () => {},
    userOption?: { cache?: boolean }
  ): StateRefStore<V> => {
    /**
     * 캐시처리
     */
    const { cache } = Object.assign({}, DEFAULT_OPTION, userOption || {});

    if (cache && renew && cacheMap.has(renew)) {
      return cacheMap.get(renew)!;
    }

    /**
     * 객체 가 아닌 데이터면 Root로 만들어서 반환
     */
    if (isPrimitiveType(orignalValue)) {
      return makePrimitive<V>({
        renew,
        orignalValue,
        rootValue,
        storeRenderList,
        cacheMap,
      });
    }

    /**
     * 객체일때는 프록시 만들어서 리턴
     */
    return makeObject({ renew, rootValue, storeRenderList, cacheMap });
  };
}
