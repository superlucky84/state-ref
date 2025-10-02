import { lens } from '@/lens';
import type { Lens } from '@/lens';
import { makeDisplayProxyValue } from '@/helper';
import { collector } from '@/connectors/collector';
import { runner } from '@/connectors/runner';
import type { Run, WithRoot, StoreRenderList } from '@/types';

/**
 * Use proxies to secure values and match them to lens.
 */
export function makeProxy<S extends WithRoot, T extends object>(
  value: unknown,
  storeRenderList: StoreRenderList<any>,
  run: Run,
  autoSync: boolean,
  editable: boolean,
  rootValue: S,
  lensValue: Lens<S> = lens<S>(),
  depth: number = 0,
  depthList: (string | number | symbol)[] = []
): T {
  const result = new Proxy(
    makeDisplayProxyValue(depthList, value) as unknown as T,
    {
      /**
       * 1. When accessing ".value" from a proxy
       *   1-1. Have the "collector" collect the subscription callbacks and the
       *   1-2. Subtracts a value from "lens" and returns it
       * 2. When accessing iterables from a proxy.
       * 3. When accessing child object types from a proxy
       */
      get(_: T, prop: keyof T & (string | symbol)) {
        const newDepthList = [...depthList, prop];

        /**
         * When accessing ".value" from a proxy
         */
        if (prop === 'value') {
          const currentValue = lensValue.get(rootValue);

          collector(
            currentValue,
            () => lensValue.get(rootValue),
            [...depthList],
            run,
            storeRenderList
          );

          return currentValue;
        }

        /**
         * When accessing "iterator" from a proxy
         */
        if (prop === Symbol.iterator) {
          return function* () {
            const iterableValue = lensValue.get(rootValue);
            if (
              !iterableValue ||
              typeof (iterableValue as any)[Symbol.iterator] !== 'function'
            ) {
              return;
            }
            for (const [index, itemValue] of (
              iterableValue as any[]
            ).entries()) {
              yield makeProxy(
                itemValue,
                storeRenderList,
                run,
                autoSync,
                editable,
                rootValue,
                lensValue.chain(index),
                depth + 1,
                [...depthList, String(index)]
              );
            }
          };
        }

        /**
         * When accessing child object types from a proxy
         */
        const lens = lensValue.chain(prop);
        const propertyValue = lens.get(rootValue);

        return makeProxy(
          propertyValue,
          storeRenderList,
          run,
          autoSync,
          editable,
          rootValue,
          lens,
          depth + 1,
          newDepthList
        );
      },

      /**
       * When assigning a value to “.value”, copyOnWrite is performed.
       * Error if you try to assign a value to something that isn't a ".value".
       * ex) ref.a.b = 'newValue'; // Error
       * ex) ref.a.b.value = 'newValue'; // Success
       */
      set(_, prop: string | symbol, value) {
        if (prop !== 'value') {
          throw new Error('Can only be assigned to a "value".');
        } else if (prop === 'value' && !editable) {
          throw new Error(
            'With the current settings, direct modification is not allowed.'
          );
        } else if (prop === 'value' && value !== lensValue.get(rootValue)) {
          const newTree = lensValue.set(value)(rootValue);
          rootValue.root = newTree.root;

          /**
           * Run dependency subscription callbacks.
           */
          if (autoSync) {
            runner(storeRenderList);
          }
        }
        return true;
      },
    }
  );

  return result;
}
