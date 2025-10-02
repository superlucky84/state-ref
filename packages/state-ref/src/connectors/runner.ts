import type { Run, Renew, StateRefStore, StoreRenderList } from '@/types';

/**
 * Based on the information gathered by the “collector”,
 * this code identifies and executes a callback function for store changes.
 */
export function runner(storeRenderList: StoreRenderList<any>) {
  const runableRenewList: Set<Run> = new Set();

  storeRenderList.forEach((defs, run) => {
    defs.forEach((item, key) => {
      const { value, getNextValue } = item;
      try {
        const nextValue = getNextValue();

        if (value !== nextValue) {
          runableRenewList.add(run);
          item.value = nextValue;
        }
      } catch (error) {
        /**
         * The subscribe function is subscribing to a value that has already been removed,
         * so when run is executed, either the user has handled the exception with optional chaining or similar,
         * or an error will occur. Therefore, it’s fine not to throw an error at this point.
         */
        console.warn(
          `Value for key ${key} has been removed, skipping update:`,
          error
        );
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
  storeRenderList: StoreRenderList<any>,
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
