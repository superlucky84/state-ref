import { DEFAULT_WATCH_OPTION, DEFAULT_CREATE_OPTION } from '@/helper';
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
  const { watch } = create(orignalValue, { autoSync: true });

  return watch;
}
export function createStoreManualSync<V>(orignalValue: V) {
  return create(orignalValue, { autoSync: false });
}

function create<V>(orignalValue: V, userCreateOption?: { autoSync?: boolean }) {
  const storeRenderList: StoreRenderList<any> = new Map();
  const cacheMap = new WeakMap<Renew<StateRefStore<V>>, StateRefStore<V>>();
  const { autoSync } = Object.assign(
    {},
    DEFAULT_CREATE_OPTION,
    userCreateOption || {}
  );
  const rootValue: StoreType<V> = { root: orignalValue };

  const watch = (
    renew: Renew<StateRefStore<V>> = () => {},
    userOption?: { cache?: boolean; editable?: boolean }
  ): StateRefStore<V> => {
    const watchOption = Object.assign(
      {},
      DEFAULT_WATCH_OPTION,
      userOption || { editable: autoSync }
    );
    const { cache, editable } = watchOption;

    /**
     * Caching
     */
    if (cache && renew && cacheMap.has(renew)) {
      return cacheMap.get(renew)!;
    }

    /**
     * Make the value a stateRef.
     */
    return makeReference({
      renew,
      rootValue,
      storeRenderList,
      cacheMap,
      autoSync,
      editable,
    });
  };

  return {
    watch,
    updateRef: watch(() => {}, { editable: true }),
    sync: () => {
      runner(storeRenderList);
    },
  };
}
