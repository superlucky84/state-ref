import { lens } from '@/lens';
import type { Lens } from '@/lens';
import { makeDisplayProxyValue } from '@/helper';
import { collector } from '@/connectors/collector';
import { runner } from '@/connectors/runner';
import { ShelfTail } from '@/shelf/ShelfTail';
import type { Run, WithRoot, StoreRenderList } from '@/types';

export const makeProxy = <S extends WithRoot, T extends WithRoot, V>(
  value: S,
  storeRenderList: StoreRenderList<V>,
  run: Run,
  rootValue: S = value,
  lensValue: Lens<S, S> = lens<S>(),
  depth: number = 0,
  depthList: string[] = []
): T => {
  const result = new Proxy(
    makeDisplayProxyValue(depth, value) as unknown as T,
    {
      get(_: T, prop: keyof T) {
        const newDepthList = [...depthList, prop.toString()];

        /**
         * 프록시에서 value로 접근할때
         */
        if (prop === 'value') {
          const value: any = lensValue.get()(rootValue);
          collector(
            value,
            () => lensValue.get()(rootValue),
            [...depthList],
            run,
            storeRenderList
          );

          return value;
        }

        /**
         * 프록시에서 하위 객체타입으로 접근할때
         */
        const lens = lensValue.k(prop);
        const propertyValue: any = lens.get()(rootValue);

        if (typeof propertyValue === 'object' && propertyValue !== null) {
          return makeProxy(
            propertyValue,
            storeRenderList,
            run,
            rootValue,
            lens,
            depth + 1,
            newDepthList
          );
        }

        /**
         * 프록시에서 하위 프리미티브 타입으로 접근할때
         */
        return new ShelfTail(
          propertyValue,
          newDepthList,
          lensValue,
          rootValue,
          () => {
            collector(
              propertyValue,
              () => lens.get()(rootValue),
              newDepthList,
              run,
              storeRenderList
            );
          },
          () => {
            runner(storeRenderList);
          }
        );
      },
      set(_, prop: string | symbol, value) {
        if (prop === 'value' && value !== lensValue.get()(rootValue)) {
          const newTree = lensValue.set(value)(rootValue);
          rootValue.root = newTree.root;

          /**
           * 디팬던시 run 실행
           */
          runner(storeRenderList);
        } else if (lensValue.k(prop).get()(rootValue) !== value) {
          throw new Error('Can only be assigned to a "value".');
        }

        return true;
      },
    }
  );

  return result;
};
