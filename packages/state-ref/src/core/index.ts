import { isPrimitiveType, DEFAULT_OPTION } from '@/helper';
import { makePrimitive } from '@/core/primitive';
import { makeObject } from '@/core/object';

import type { Renew, StoreType, StateRefStore, StoreRenderList } from '@/types';

/**
 * createStore - The argument is the initial value of the state
 *
 * Can work with primitive types, or you can work with object types.
 * The return value is the "watch" function.
 *
 * example>
 * const watch = createStore<number>(7)
 * // const watch = createStore<{name: string; age: number;}>({ name: 'brown', age: 38 })
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
     * If the value you want to share is not 'object' (primitive)
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
     * If the value you want to share is 'object' (proxy)
     */
    return makeObject({ renew, rootValue, storeRenderList, cacheMap });
  };
}
