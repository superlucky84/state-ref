import type { Lens } from '@/lens';

import type { Run, RunInfo, StoreType, StoreRenderList } from '@/types';

export function collector<V, S extends StoreType<V>>(
  value: V,
  lens: Lens<S, V>,
  rootValue: S,
  newDepthList: string[],
  run: Run,
  storeRenderList: StoreRenderList<V>
) {
  const runInfo: RunInfo<typeof value> = {
    value,
    getNextValue: () => lens.get()(rootValue),
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
      subList.set(runInfo.key, runInfo);
      storeRenderList.set(run, subList);
    }
  }
}
