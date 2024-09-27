import { makeProxy } from '@/proxy';
import { firstRunner } from '@/connectors/runner';

import type { Renew, StoreType, WrapWithValue, StoreRenderList } from '@/types';

export function makeObject<V>({
  renew,
  rootValue,
  storeRenderList,
  cacheMap,
}: {
  renew: Renew<WrapWithValue<V>>;
  rootValue: StoreType<V>;
  storeRenderList: StoreRenderList<V>;
  cacheMap: WeakMap<Renew<WrapWithValue<V>>, WrapWithValue<V>>;
}) {
  const ref: { current: null | WrapWithValue<StoreType<V>> } = {
    current: null,
  };
  const run = () => renew(ref.current!.root);

  ref.current = makeProxy<StoreType<V>, WrapWithValue<StoreType<V>>, V>(
    rootValue,
    storeRenderList,
    run
  );

  // 처음 실행시 abort 이벤트 리스너에 추가
  firstRunner(run, storeRenderList, cacheMap, renew);

  cacheMap.set(renew, ref.current!.root);

  return ref.current!.root;
}
