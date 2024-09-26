import type { Run, StoreRenderList } from '@/types';

export const runner = <V>(storeRenderList: StoreRenderList<V>) => {
  const runableRenewList: Set<Run> = new Set();
  storeRenderList.forEach((defs, renew) => {
    defs.forEach((item, key) => {
      const { value, getNextValue } = item;
      try {
        const nextValue = getNextValue();

        if (value !== nextValue) {
          runableRenewList.add(renew);
          item.value = nextValue;
        }
      } catch {
        defs.delete(key);
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
