import type { Run, Renew, StateRefStore, StoreRenderList } from '@/types';

/**
 * Based on the information gathered by the “collector”,
 * this code identifies and executes a callback function for store changes.
 */
export function runner<V>(storeRenderList: StoreRenderList<V>) {
  const runableRenewList: Set<Run> = new Set();

  storeRenderList.forEach((defs, run) => {
    defs.forEach((item, key) => {
      const { value, getNextValue, primitiveSetter } = item;
      try {
        const nextValue = getNextValue();

        if (value !== nextValue) {
          runableRenewList.add(run);
          item.value = nextValue;

          if (primitiveSetter) {
            primitiveSetter(nextValue);
          }
        }
      } catch {
        defs.delete(key);

        /**
         * Should still leave it there in case the dependency is created later.
         * if (!defs.size) {
         *   storeRenderList.delete(run);
         * }
         */
      }
    });
  });

  runableRenewList.forEach(run => {
    if (run && run() === false) {
      storeRenderList.delete(run);
    }
  });
  runableRenewList.clear();
}

export function firstRunner<V>(
  run: Run,
  storeRenderList: StoreRenderList<V>,
  cacheMap: WeakMap<Renew<StateRefStore<V>>, StateRefStore<V>>,
  renew: Renew<StateRefStore<V>>
) {
  const renewResult = run!(true);

  if (renewResult instanceof AbortSignal) {
    renewResult.addEventListener('abort', () => {
      cacheMap.delete(renew);
      storeRenderList.delete(run);
    });
  }
}
