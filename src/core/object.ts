import { makeProxy } from '@/proxy';
import { firstRunner } from '@/connectors/runner';

import type { Renew, StoreType, ShelfStore, StoreRenderList } from '@/types';

export function makeObject<V>({
  renew,
  rootValue,
  storeRenderList,
  cacheMap,
}: {
  renew: Renew<ShelfStore<V>>;
  rootValue: StoreType<V>;
  storeRenderList: StoreRenderList<V>;
  cacheMap: WeakMap<Renew<ShelfStore<V>>, ShelfStore<V>>;
}) {
  const ref: { current: null | ShelfStore<StoreType<V>> } = {
    current: null,
  };
  const run = (isFirst?: boolean) => renew(ref.current!.root, isFirst ?? false);

  ref.current = makeProxy<StoreType<V>, ShelfStore<StoreType<V>>, V>(
    rootValue,
    storeRenderList,
    run
  );

  // 처음 실행시 abort 이벤트 리스너에 추가
  firstRunner(run, storeRenderList, cacheMap, renew);

  cacheMap.set(renew, ref.current!.root);

  return ref.current!.root;
}
