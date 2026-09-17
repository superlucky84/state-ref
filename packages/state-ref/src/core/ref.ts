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
  pathRoot,
}: {
  renew: Renew<StateRefStore<V>>;
  rootValue: StoreType<V>;
  storeRenderList: StoreRenderList<any>;
  cacheMap: WeakMap<Renew<StateRefStore<V>>, StateRefStore<V>>;
  autoSync: boolean;
  cache: boolean;
  editable: boolean;
  trackDeps: boolean;
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
   * Off by default - it changes how often subscribers are called, which is a
   * behaviour change (`DC-02`). The first run is never re-collected: there is
   * nothing to forget yet.
   */
  const run: Run = (isFirst?: boolean) => {
    if (!trackDeps || isFirst) {
      return renew(ref.value!.root, isFirst ?? false);
    }

    const previous = forgetDeps(storeRenderList, run);

    try {
      return renew(ref.value!.root, false);
    } catch (error) {
      /**
       * The callback may have read a path or two before failing. Keeping the
       * old set as well leaves the subscription too wide rather than too
       * narrow, so a throwing callback cannot silently stop being woken.
       */
      restoreDeps(storeRenderList, run, previous);

      throw error;
    }
  };

  ref.value = makeProxy<StoreType<V>, StateRefStore<StoreType<V>>>(
    storeRenderList,
    run,
    autoSync,
    editable,
    rootValue,
    pathRoot
  );

  /**
   * It is initialized only once per subscription and collects the 'abort' signal.
   */
  firstRunner(run, storeRenderList, cacheMap, renew);

  /**
   * Only a cached subscription may claim the cache slot. `cache: false` asks
   * for a subscription of its own, so letting it write here handed the next
   * `watch(renew)` a reference belonging to one of those extra subscriptions.
   */
  if (cache) {
    cacheMap.set(renew, ref.value!.root);
  }

  return ref.value!.root;
}
