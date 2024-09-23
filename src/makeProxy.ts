import { lens } from '@/lens';
import type { Lens } from '@/lens';

type Run = null | (() => boolean | AbortSignal | void);
type RootedObject = { root: unknown } & { [key: string | symbol]: unknown };

export const makeProxy = <T extends RootedObject, V>(
  value: T,
  storeRenderList: Map<Run, [V, () => V, number][]>,
  needRunFirst: { value: boolean },
  run: Run,
  rootProxy: { value: T | null },
  rootValue: T = value,
  lensValue: Lens<T, T> = lens<T>(),
  depth: number = 0
): T => {
  const result = new Proxy(value, {
    get(target: T, prop: keyof T, receiver: any) {
      if (prop === 'value') {
        return lensValue.get()(rootValue);
      }

      const propertyValue: any = Reflect.get(target, prop, receiver);
      const lens = lensValue.k(prop);

      if (run && storeRenderList.size === 0) {
        queueMicrotask(() => {
          const runInfoItem = [
            propertyValue,
            () => lens.get()(rootValue),
            depth,
          ];

          if (storeRenderList.has(run)) {
            const runInfo = storeRenderList.get(run);
            runInfo!.push([runInfoItem[0], runInfoItem[1], runInfoItem[2]]);
          } else {
            storeRenderList.set(run, [
              [runInfoItem[0], runInfoItem[1], runInfoItem[2]],
            ]);
          }
        });
      }

      if (typeof propertyValue === 'object' && propertyValue !== null) {
        return makeProxy(
          propertyValue,
          storeRenderList,
          needRunFirst,
          run,
          rootProxy,
          rootValue,
          lens,
          depth + 1
        );
      }

      return propertyValue;
    },
    set(target, prop: string | symbol, value) {
      if (target[prop] === value) {
        return true;
      }

      if (lensValue.k(prop).get()(rootValue) !== value) {
        const newValue: T = lensValue.k(prop).set(value)(rootValue) as T;

        rootValue.root = newValue.root;

        // 랜더리스트에서 해당 run 에 해당하는 정보를 가져옴
        const info = storeRenderList.get(run);

        if (info) {
          let needRun = false;
          info.forEach(infoItem => {
            const [target, lens, depth] = infoItem;
            const newTarget = lens();

            if (depth > 0 && target !== newTarget) {
              needRun = true;
            }
            infoItem[0] = newTarget;
          });

          if (needRun && run && run() === false) {
            storeRenderList.delete(run);
          }
        }
      }

      return true;
    },
  });

  return result;
};
