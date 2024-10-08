import { makeProxy } from '@/proxy';
import { firstRunner } from '@/connectors/runner';

import type { Renew, StoreType, StateRefStore, StoreRenderList } from '@/types';

/**
 * If the value you want to share is 'object' (Return Proxy Type)
 */
export function makeObject<V>({
  renew,
  rootValue,
  storeRenderList,
  cacheMap,
}: {
  renew: Renew<StateRefStore<V>>;
  rootValue: StoreType<V>;
  storeRenderList: StoreRenderList<V>;
  cacheMap: WeakMap<Renew<StateRefStore<V>>, StateRefStore<V>>;
}) {
  const ref: { value: null | StateRefStore<StoreType<V>> } = {
    value: null,
  };
  const run = (isFirst?: boolean) => renew(ref.value!.root, isFirst ?? false);

  ref.value = makeProxy<StoreType<V>, StateRefStore<StoreType<V>>, V>(
    rootValue,
    storeRenderList,
    run
  );

  /**
   * It is initialized only once per subscription and collects the 'abort' signal.
   */
  firstRunner(run, storeRenderList, cacheMap, renew);

  cacheMap.set(renew, ref.value!.root);

  return ref.value!.root;
}
