import type { Run, RunInfo, StoreRenderList } from '@/types';

/**
 * The subscription to store starts the moment the user of stateRef fetches the reference as a “.value”.
 * This code captures the moment of fetching to “.value” and collects the subscription.
 */
export function collector<V>(
  value: V,
  getNextValue: () => V,
  newDepthList: string[],
  run: Run,
  storeRenderList: StoreRenderList<V>
) {
  const runInfo: RunInfo<V> = {
    value,
    getNextValue,
    key: newDepthList.join('.'),
  };

  if (run) {
    if (storeRenderList.has(run)) {
      const subList = storeRenderList.get(run);
      if (!subList!.has(runInfo.key)) {
        subList!.set(runInfo.key, runInfo);
      }
    } else {
      const subList = new Map<string, typeof runInfo>();
      if (!subList!.has(runInfo.key)) {
        subList.set(runInfo.key, runInfo);
        storeRenderList.set(run, subList);
      }
    }
  }
}
