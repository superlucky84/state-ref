import { DEFAULT_WATCH_OPTION, DEFAULT_CREATE_OPTION } from '@/helper';
import { makeReference } from '@/core/ref';
import { runner } from '@/connectors/runner';
import { createPathRoot } from '@/path';

import type {
  Renew,
  StoreType,
  StateRefStore,
  StoreRenderList,
  ManualSyncStore,
} from '@/types';

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
export function createStore<V>(originalValue: V) {
  const { watch } = create(originalValue, { autoSync: true });

  return watch;
}
export function createStoreManualSync<V>(originalValue: V): ManualSyncStore<V> {
  return create(originalValue, { autoSync: false });
}

function create<V>(
  originalValue: V,
  userCreateOption?: { autoSync?: boolean }
) {
  const storeRenderList: StoreRenderList<any> = new Map();
  const pathRoot = createPathRoot();
  const cacheMap = new WeakMap<Renew<StateRefStore<V>>, StateRefStore<V>>();
  const { autoSync } = Object.assign(
    {},
    DEFAULT_CREATE_OPTION,
    userCreateOption || {}
  );
  const rootValue: StoreType<V> = { root: originalValue };

  const watch = (
    renew: Renew<StateRefStore<V>> = () => {},
    userOption?: { cache?: boolean; editable?: boolean }
  ): StateRefStore<V> => {
    /**
     * Resolved as: DEFAULT_WATCH_OPTION < store mode < userOption.
     * The store mode must be applied unconditionally, otherwise passing any
     * unrelated option (say `{ cache: false }`) would drop it and silently
     * make a manual-sync store writable through `watch`.
     */
    const watchOption = Object.assign(
      {},
      DEFAULT_WATCH_OPTION,
      { editable: autoSync },
      userOption || {}
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
      pathRoot,
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
