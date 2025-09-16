import type { Run, RunInfo, StoreRenderList } from '@/types';
import { keyFromDepthList } from '@/helper';

/**
 * The subscription to store starts the moment the user of stateRef fetches the reference as a “.value”.
 * This code captures the moment of fetching to “.value” and collects the subscription.
 */
export function collector<V>(
  value: V,
  getNextValue: () => V,
  newDepthList: (string | number | symbol)[],
  run: Run,
  storeRenderList: StoreRenderList<V>
) {
  if (run) {
    const key = keyFromDepthList(newDepthList);

    const runInfo: RunInfo<V> = {
      value,
      getNextValue,
      key,
    };

    if (storeRenderList.has(run)) {
      const subList = storeRenderList.get(run)!;
      if (!subList.has(key)) subList.set(key, runInfo);
    } else {
      const subList = new Map<string, typeof runInfo>();
      subList.set(key, runInfo);
      storeRenderList.set(run, subList);
    }
  }
}
