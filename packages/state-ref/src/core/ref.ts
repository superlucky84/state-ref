import { makeProxy } from '@/proxy';
import type { PathNode } from '@/path';
import { firstRunner } from '@/connectors/runner';
import { forgetDeps, restoreDeps } from '@/connectors/collector';

import type {
  Run,
  Renew,
  StoreType,
  StateRefStore,
  StoreRenderList,
  RefWrite,
} from '@/types';

/**
 * Make the value a stateRef.
 */
export function makeReference<V>({
  renew,
  rootValue,
  storeRenderList,
  cacheMap,
  autoSync,
  cache,
  editable,
  trackDeps,
  onWrite,
  pathRoot,
}: {
  renew?: Renew<StateRefStore<V>>;
  rootValue: StoreType<V>;
  storeRenderList: StoreRenderList<any>;
  cacheMap: WeakMap<Renew<StateRefStore<V>>, StateRefStore<V>>;
  autoSync: boolean;
  cache: boolean;
  editable: boolean;
  trackDeps: boolean;
  onWrite?: (write: RefWrite) => void;
  pathRoot: PathNode;
}) {
  const ref: { value: null | StateRefStore<StoreType<V>> } = {
    value: null,
  };
  /**
   * `trackDeps` re-collects the callback's dependencies on every run.
   *
   * It lives here rather than in the runner because it is a property of the
   * subscription, not of the write: what a callback reads is decided by the
   * callback. Dropping the old set before the callback runs lets `collector`
   * refill it from what this pass actually reads, so a path the callback has
   * stopped reading stops waking it.
   *
   * Off by default (`DC-02`); 2.x had no such option, and its subscriptions
   * only ever grew because nothing on the read path removes anything -
   * `collector` adds and never deletes. That is all this flag decides:
   * whether the set is empty when the callback starts.
   *
   * The first run is never re-collected: there is nothing to forget yet.
   *
   * Note where the wipe lives - inside `run`, so only a store change triggers
   * it. A reader that runs outside `run` (a framework re-rendering for its own
   * reasons) still reaches `collector` and therefore only ever adds.
   */
  // A callbackless ref remains live, but reading it must not register a run.
  const run: Run = renew
    ? (isFirst?: boolean) => {
        if (!trackDeps || isFirst) {
          return renew(ref.value!.root, isFirst ?? false);
        }

        const previous = forgetDeps(storeRenderList, run);

        try {
          return renew(ref.value!.root, false);
        } catch (error) {
          /**
           * The callback may have read a path or two before failing. Keeping
           * the old set leaves the subscription too wide rather than narrow.
           */
          restoreDeps(storeRenderList, run, previous);

          throw error;
        }
      }
    : null;

  ref.value = makeProxy<StoreType<V>, StateRefStore<StoreType<V>>>(
    storeRenderList,
    run,
    autoSync,
    editable,
    rootValue,
    pathRoot,
    onWrite
  );

  /**
   * It is initialized only once per subscription and collects the 'abort' signal.
   */
  if (renew) firstRunner(run, storeRenderList, cacheMap, renew);

  /**
   * Only a cached subscription may claim the cache slot. `cache: false` asks
   * for a subscription of its own, so letting it write here handed the next
   * `watch(renew)` a reference belonging to one of those extra subscriptions.
   */
  if (cache && renew) {
    cacheMap.set(renew, ref.value!.root);
  }

  return ref.value!.root;
}
