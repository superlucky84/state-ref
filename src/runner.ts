import type { Run, StoreRenderList } from '@/types';

export const runner = <V>(storeRenderList: StoreRenderList<V>) => {
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
         * 나중에 라도 def가 들어올수 있으니 run map 은 남겨놔야 함
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
};
