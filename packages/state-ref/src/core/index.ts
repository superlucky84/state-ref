import { DEFAULT_OPTION } from '@/helper';
import { makeReference } from '@/core/ref';
import { runner } from '@/connectors/runner';

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

  const watch = (
    renew: Renew<StateRefStore<V>> = () => {},
    userOption?: { cache?: boolean }
  ): StateRefStore<V> => {
    /**
     * Caching
     */
    const { cache } = Object.assign({}, DEFAULT_OPTION, userOption || {});

    if (cache && renew && cacheMap.has(renew)) {
      return cacheMap.get(renew)!;
    }

    /**
     * Make the value a stateRef.
     */
    return makeReference({ renew, rootValue, storeRenderList, cacheMap });
  };

  return watch;
}
