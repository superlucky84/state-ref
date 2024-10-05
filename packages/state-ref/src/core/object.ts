import { makeProxy } from '@/proxy';
import { firstRunner } from '@/connectors/runner';

import type { Renew, StoreType, StateRefStore, StoreRenderList } from '@/types';

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
  const ref: { current: null | StateRefStore<StoreType<V>> } = {
    current: null,
  };
  const run = (isFirst?: boolean) => renew(ref.current!.root, isFirst ?? false);

  ref.current = makeProxy<StoreType<V>, StateRefStore<StoreType<V>>, V>(
    rootValue,
    storeRenderList,
    run
  );

  // 처음 실행시 abort 이벤트 리스너에 추가
  firstRunner(run, storeRenderList, cacheMap, renew);

  cacheMap.set(renew, ref.current!.root);

  return ref.current!.root;
}
