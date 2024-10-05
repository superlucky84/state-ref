import { Root } from '@/proxy/Root';
import { collector } from '@/connectors/collector';
import { firstRunner, runner } from '@/connectors/runner';

import type { Renew, StoreType, StateRefStore, StoreRenderList } from '@/types';

export function makePrimitive<V>({
  renew,
  orignalValue,
  rootValue,
  storeRenderList,
  cacheMap,
}: {
  renew: Renew<StateRefStore<V>>;
  orignalValue: V;
  rootValue: StoreType<V>;
  storeRenderList: StoreRenderList<V>;
  cacheMap: WeakMap<Renew<StateRefStore<V>>, StateRefStore<V>>;
}) {
  const ref: { current: null | StateRefStore<V> } = { current: null };
  const run = (isFirst?: boolean) => renew(ref.current!, isFirst ?? false);

  ref.current = new Root(
    orignalValue,
    rootValue,
    () => {
      collector(
        orignalValue,
        () => rootValue.root,
        ['root'],
        run,
        storeRenderList,
        newValue => {
          (ref.current as Root<V>).setValue(newValue);
        }
      );
    },
    () => {
      runner(storeRenderList);
    }
  ) as unknown as StateRefStore<V>;

  // 처음 실행시 abort 이벤트 리스너에 추가
  firstRunner(run, storeRenderList, cacheMap, renew);

  cacheMap.set(renew, ref.current!);

  return ref.current! as StateRefStore<V>;
}
