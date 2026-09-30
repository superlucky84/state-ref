import type { Run, RunInfo, RenderListSub, StoreRenderList } from '@/types';
import type { PathNode } from '@/path';

/**
 * Runs whose subscription has ended for good.
 *
 * `removeRun` drops a subscription's record and its marks on the path tree, but
 * the `run` itself lives on inside the ref the caller still holds - and every
 * read through that ref comes back here. Without this set, one read re-creates
 * the record and the next write wakes a subscription the caller ended
 * (`CI-30`). `CI-24` closed the same hole for a read from inside a propagation
 * pass by refusing to *run* such a subscriber; this closes it at the collector,
 * which is the one place every entrance passes through.
 *
 * A `WeakSet` because the mark must not outlive the run.
 */
const endedRuns = new WeakSet<object>();

/** Marks a run as ended. Nothing it reads afterwards may resubscribe it. */
export function endRun(run: Run) {
  if (run) {
    endedRuns.add(run);
  }
}

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
  if (!run || endedRuns.has(run)) {
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
  // A callback that threw *and* ended in the same pass has no deps to restore:
  // putting them back would resubscribe what the caller ended (`CI-30`).
  if (!previous || (run && endedRuns.has(run))) {
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
