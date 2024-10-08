import { lens } from '@/lens';
import type { Lens } from '@/lens';
import { makeDisplayProxyValue } from '@/helper';
import { collector } from '@/connectors/collector';
import { runner } from '@/connectors/runner';
import { Tail } from '@/proxy/tail';
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
       * 1. When accessing ".value" from a proxy
       *   1-1. Have the "collector" collect the subscription callbacks and the
       *   1-2. Subtracts a value from "lens" and returns it
       * 2. When accessing child object types from a proxy
       *   2-1. Create a proxy for a sub object
       * 3. When accessing lower primitive types from a proxy
       *   3-1. Accesses a value by value, wraps the value in a modifiable object and returns it (Tail Type)
       */
      get(_: T, prop: keyof T) {
        const newDepthList = [...depthList, prop.toString()];

        /**
         * When accessing ".value" from a proxy
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
         * When accessing "iterator" from a proxy
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
         * When accessing child object types from a proxy
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
         * When accessing lower primitive types from a proxy
         */
        const tail = new Tail(
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
                tail.setValue(newValue);
              }
            );
          },
          () => {
            runner(storeRenderList);
          }
        );
        return tail;
      },
      /**
       * When assigning a value to “.value”, copyOnWrite is performed.
       * Error if you try to assign a value to something that isn't a ".value".
       * ex) ref.a.b = 'newValue'; // Error
       * ex) ref.a.b.value = 'newValue'; // Success
       */
      set(_, prop: string | symbol, value) {
        if (prop === 'value' && value !== lensValue.get()(rootValue)) {
          const newTree = lensValue.set(value)(rootValue);
          rootValue.root = newTree.root;

          /**
           * Run dependency subscription callbacks.
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
