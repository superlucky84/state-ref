import type { Run, RunInfo, RenderListSub, StoreRenderList } from '@/types';
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
  (pathNode.subs ??= new Set()).add(run);
}

/**
 * Drops everything a subscription is currently watching and hands the old set
 * back, so it can be re-collected by running the callback again.
 *
 * This is what makes a conditional read stop waking a subscriber: a callback
 * that took the `else` branch this time should no longer be woken by the paths
 * the `if` branch used to read. Without it a subscription only ever grows.
 */
export function forgetDeps(
  storeRenderList: StoreRenderList<any>,
  run: Run
): RenderListSub<any> | undefined {
  const previous = storeRenderList.get(run);

  if (previous) {
    previous.forEach((_, pathNode) => pathNode.subs?.delete(run));
    storeRenderList.delete(run);
  }

  return previous;
}

/**
 * Puts back what `forgetDeps` removed, for paths the re-run did not reach.
 *
 * Used when the callback threw partway through: it may have read a path or two
 * before failing, and dropping the rest would silently stop waking it. Merging
 * can only keep a subscription too wide, never too narrow.
 */
export function restoreDeps(
  storeRenderList: StoreRenderList<any>,
  run: Run,
  previous: RenderListSub<any> | undefined
) {
  if (!previous) {
    return;
  }

  let subList = storeRenderList.get(run);

  if (!subList) {
    subList = new Map();
    storeRenderList.set(run, subList);
  }

  previous.forEach((info, pathNode) => {
    if (!subList!.has(pathNode)) {
      subList!.set(pathNode, info);
      (pathNode.subs ??= new Set()).add(run);
    }
  });
}
