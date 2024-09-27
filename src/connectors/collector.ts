import type { Run, RunInfo, StoreRenderList } from '@/types';

export function collector<V>(
  value: V,
  getNextValue: () => V,
  newDepthList: string[],
  run: Run,
  storeRenderList: StoreRenderList<V>,
  primitiveSetter?: (newValue: V) => void
) {
  const runInfo: RunInfo<V> = {
    value,
    getNextValue,
    key: newDepthList.join('.'),
    primitiveSetter,
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
