import { makeReference } from '@/core/ref';
import { runner } from '@/connectors/runner';
import { createPathRoot } from '@/path';

import type {
  CreateStoreOption,
  Renew,
  StoreType,
  StateRefStore,
  StoreRenderList,
  ManualSyncStore,
  RefWrite,
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
 *
 * `{ trackDeps: true }` re-collects each subscriber's dependencies on every
 * run, so a path the callback has stopped reading stops waking it. Off by
 * default, because it changes how often subscribers are called.
 */
export function createStore<V>(
  originalValue: V,
  userCreateOption?: CreateStoreOption
) {
  const { watch } = create(originalValue, {
    ...(userCreateOption || {}),
    autoSync: true,
  });

  return watch;
}
export function createStoreManualSync<V>(
  originalValue: V,
  userCreateOption?: CreateStoreOption
): ManualSyncStore<V> {
  return create(originalValue, {
    ...(userCreateOption || {}),
    autoSync: false,
  });
}

/**
 * Exported for tests and the bench, not from the package index.
 *
 * `pathRoot` is the only way to observe how many nodes a store actually has,
 * and Phase 6.5's whole point is that most paths no longer get one - a property
 * that is otherwise unobservable by construction, so there would be no way to
 * gate it (`DC-14`).
 */
export function create<V>(
  originalValue: V,
  userCreateOption?: {
    autoSync?: boolean;
    trackDeps?: boolean;
    onWrite?: (write: RefWrite) => void;
  }
) {
  const storeRenderList: StoreRenderList<any> = new Map();
  const pathRoot = createPathRoot();
  const cacheMap = new WeakMap<Renew<StateRefStore<V>>, StateRefStore<V>>();
  const autoSync = userCreateOption?.autoSync ?? true;
  const trackDeps = userCreateOption?.trackDeps ?? false;
  const rootValue: StoreType<V> = { root: originalValue };
  const onWrite = userCreateOption?.onWrite;

  const watch = (
    renew?: Renew<StateRefStore<V>>,
    userOption?: { cache?: boolean; editable?: boolean }
  ): StateRefStore<V> => {
    /**
     * Cache defaults to true; writability follows the store mode unless the
     * caller explicitly changes it. An unrelated option such as
     * `{ cache: false }` must not make a manual-sync store writable.
     */
    const cache = userOption?.cache ?? true;
    const editable = userOption?.editable ?? autoSync;

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
      cache,
      editable,
      trackDeps,
      onWrite,
      pathRoot,
    });
  };

  return {
    pathRoot,
    watch,
    updateRef: watch(undefined, { editable: true }),
    sync: () => {
      runner(storeRenderList);
    },
  };
}
