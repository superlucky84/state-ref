import type { Run, RunInfo, StoreRenderList } from '@/types';
import type { PathNode } from '@/path';

/**
 * The subscription to store starts the moment the user of stateRef fetches the reference as a “.value”.
 * This code captures the moment of fetching to “.value” and collects the subscription.
 */
export function collector(
  value: unknown,
  getNextValue: () => unknown,
  pathNode: PathNode,
  run: Run,
  storeRenderList: StoreRenderList<any>
) {
  if (!run) {
    return;
  }

  let subList = storeRenderList.get(run);

  if (!subList) {
    subList = new Map<PathNode, RunInfo<unknown>>();
    storeRenderList.set(run, subList);
  }

  /**
   * Reading the same path twice in one callback is one subscription. The node's
   * identity says so on its own - no key needs to be built.
   */
  if (subList.has(pathNode)) {
    return;
  }

  subList.set(pathNode, { value, getNextValue });
  pathNode.subs.add(run);
}
