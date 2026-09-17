import type {
  Run,
  RunInfo,
  Renew,
  StateRefStore,
  StoreRenderList,
} from '@/types';
import type { PathNode } from '@/path';
import { forEachAffected } from '@/path';

/**
 * Reports the errors user code threw during a single propagation pass.
 *
 * The new state is already committed by the time subscribers run, so
 * rethrowing would leave the store updated with its notifications only half
 * delivered - and it would surface at the assignment site, which is never
 * where the faulty code lives.
 */
function reportPassErrors(errors: unknown[]) {
  if (errors.length === 0) {
    return;
  }

  console.error(
    new AggregateError(
      errors,
      `state-ref: ${errors.length} error(s) thrown while propagating a store change.`
    )
  );
}

/**
 * Drops a subscription and the marks it left on the path tree.
 */
export function removeRun(storeRenderList: StoreRenderList<any>, run: Run) {
  const subList = storeRenderList.get(run);

  if (subList) {
    subList.forEach((_, pathNode) => pathNode.subs?.delete(run));
  }

  storeRenderList.delete(run);
}

/**
 * Based on the information gathered by the “collector”,
 * this code identifies and executes a callback function for store changes.
 *
 * `writtenNode` narrows the candidates to the subscriptions a write at that
 * path could have touched. Without it - a manual `sync()`, where any number of
 * writes may have landed - every subscription is examined.
 */
export function runner(
  storeRenderList: StoreRenderList<any>,
  /**
   * A write is addressed as "the parent's node plus the segment written", not
   * as a node, because the written path may have no node at all - nodes exist
   * only for paths a subscription reached (`CI-22`). `writtenSegment` is `null`
   * when the write landed on `writtenParent` itself, which is the store's root
   * proxy. Neither is given for a manual `sync()`, where nothing is known about
   * where the writes went.
   */
  writtenParent?: PathNode,
  writtenSegment?: string | symbol | null
) {
  const runableRenewList: Set<Run> = new Set();
  const errors: unknown[] = [];

  /**
   * Re-reads one subscribed path and records the subscriber if it moved.
   *
   * Reading a subscribed path only throws when the user's state exposes a
   * throwing accessor somewhere along it. A value that was merely removed
   * yields "undefined" instead, because the lens walks with optional chaining.
   * Either way, one bad path must not abort the scan for every other
   * subscriber.
   */
  const check = (run: Run, item: RunInfo<any>) => {
    try {
      const nextValue = item.getNextValue();

      if (item.value !== nextValue) {
        runableRenewList.add(run);
        item.value = nextValue;
      }
    } catch (error) {
      errors.push(error);
    }
  };

  if (writtenParent) {
    /**
     * A write moves references only along its own path and through the subtree
     * it replaced, so those are the only nodes worth re-reading - and at each
     * one, only the subscribers registered on that exact node. A subscriber
     * watching twenty paths is checked on the one that moved rather than on all
     * twenty.
     */
    const visit = (node: PathNode) =>
      node.subs?.forEach(run => {
        const item = storeRenderList.get(run)?.get(node);

        if (item) {
          check(run, item);
        }
      });

    forEachAffected(writtenParent, writtenSegment, visit);
  } else {
    /**
     * A manual `sync()` knows nothing about where the writes landed, so every
     * subscribed path is re-read.
     */
    storeRenderList.forEach((defs, run) =>
      defs.forEach(item => check(run, item))
    );
  }

  runableRenewList.forEach(run => {
    if (!run) {
      return;
    }

    try {
      if (run() === false) {
        removeRun(storeRenderList, run);
      }
    } catch (error) {
      /**
       * A subscriber that throws must not swallow the subscribers queued
       * behind it.
       */
      errors.push(error);
    }
  });

  runableRenewList.clear();
  reportPassErrors(errors);
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
      removeRun(storeRenderList, run);
    });
  }
}
