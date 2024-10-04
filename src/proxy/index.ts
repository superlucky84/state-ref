import { lens } from '@/lens';
import type { Lens } from '@/lens';
import { makeDisplayProxyValue } from '@/helper';
import { collector } from '@/connectors/collector';
import { runner } from '@/connectors/runner';
import { ShelfTail } from '@/shelf/ShelfTail';
import type { Run, WithRoot, StoreRenderList } from '@/types';

/**
 * 자료형의 중첩되는 객체들을 프록시로 만들어 lens와 값을 연결해준다.
 */
export function makeProxy<S extends WithRoot, T extends WithRoot, V>(
  value: S,
  storeRenderList: StoreRenderList<V>,
  run: Run,
  rootValue: S = value,
  lensValue: Lens<S, S> = lens<S>(),
  depth: number = 0,
  depthList: string[] = []
): T {
  const result = new Proxy(
    makeDisplayProxyValue(depthList, value) as unknown as T,
    {
      /**
       * 1. 프록시에서 value로 접근할때
       *   1-1. collector 가 구독 콜백을 수집하도록 하고
       *   1-2. 랜즈에서 값을 빼서 리턴해준다
       * 2. 프록시에서 하위 객체타입으로 접근할때
       *   2-1. 하위객체애 대한 프록시를 만든다
       * 3. 프록시에서 하위 프리미티브 타입으로 접근할때
       *   3-1. value로 값에 접근하고, value로 값을 수정할수 있는 객체로 감싸서 리턴한다.
       */
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
         * 프록시에서 이터레이터로 접근할때
         */
        if (prop === Symbol.iterator) {
          return function* () {
            for (const [index, value] of (
              lensValue.get()(rootValue) as any
            ).entries()) {
              yield makeProxy(
                value,
                storeRenderList,
                run,
                rootValue,
                lensValue.k(index),
                depth + 1,
                [...depthList, String(index)]
              );
            }
          };
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
        const shelfTail = new ShelfTail(
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
              storeRenderList,
              newValue => {
                shelfTail.setValue(newValue);
              }
            );
          },
          () => {
            runner(storeRenderList);
          }
        );
        return shelfTail;
      },
      /**
       * value에 값을 할당할때는 copyOnWrite를 해준다.
       * value 가 아닌데 값을 할당할 경우 에러를 던진다.
       * ex) shelf.a.b = 'newValue'; // Error
       * ex) shelf.a.b.value = 'newValue'; // Success
       */
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
}
