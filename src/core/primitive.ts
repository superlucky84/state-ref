import { ShelfRoot } from '@/shelf/ShelfRoot';
import { collector } from '@/connectors/collector';
import { firstRunner, runner } from '@/connectors/runner';

import type { Renew, StoreType, ShelfStore, StoreRenderList } from '@/types';

export function makePrimitive<V>({
  renew,
  orignalValue,
  rootValue,
  storeRenderList,
  cacheMap,
}: {
  renew: Renew<ShelfStore<V>>;
  orignalValue: V;
  rootValue: StoreType<V>;
  storeRenderList: StoreRenderList<V>;
  cacheMap: WeakMap<Renew<ShelfStore<V>>, ShelfStore<V>>;
}) {
  const ref: { current: null | ShelfStore<V> } = { current: null };
  const run = (isFirst?: boolean) => renew(ref.current!, isFirst ?? false);

  ref.current = new ShelfRoot(
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
          (ref.current as ShelfRoot<V>).setValue(newValue);
        }
      );
    },
    () => {
      runner(storeRenderList);
    }
  ) as unknown as ShelfStore<V>;

  // 처음 실행시 abort 이벤트 리스너에 추가
  firstRunner(run, storeRenderList, cacheMap, renew);

  cacheMap.set(renew, ref.current!);

  return ref.current! as ShelfStore<V>;
}
