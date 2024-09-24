import { lens } from '@/lens';
import type { Lens } from '@/lens';

type Run = null | (() => boolean | AbortSignal | void);
type RootedObject = { root: unknown } & { [key: string | symbol]: unknown };

export const makeProxy = <S extends RootedObject, T extends RootedObject, V>(
  value: S,
  storeRenderList: Map<Run, [V, () => V, number][]>,
  run: Run,
  rootValue: S = value,
  lensValue: Lens<S, S> = lens<S>(),
  depth: number = 0
): T => {
  const result = new Proxy({} as T, {
    get(_: T, prop: keyof T) {
      if (prop === 'value') {
        return lensValue.get()(rootValue);
      }

      const lens = lensValue.k(prop);
      const propertyValue: any = lens.get()(rootValue);

      if (typeof propertyValue === 'object' && propertyValue !== null) {
        return makeProxy(
          propertyValue,
          storeRenderList,
          run,
          rootValue,
          lens,
          depth + 1
        );
      }

      return {
        get value() {
          return propertyValue;
        },
        set value(_) {
          throw new Error('value is a read-only property.');
        },
      };
      /*
      if (
        run &&
        (!storeRenderList.has(run) || storeRenderList.get(run)!.length === 0)
      ) {
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
      */
    },
    set(_, prop: string | symbol, value) {
      if (lensValue.k(prop).get()(rootValue) !== value) {
        const newValue = lensValue.k(prop).set(value)(rootValue);

        rootValue.root = newValue.root;

        // 랜더리스트에서 해당 run 에 해당하는 정보를 가져옴
        const info = storeRenderList.get(run);

        if (info) {
          let needRun = false;
          info.forEach(infoItem => {
            const [target, lens, depth] = infoItem;
            const newTarget = lens();

            if (depth > 0 && target !== newTarget) {
              console.log(depth, target, newTarget);
              needRun = true;
            }
            // 타겟 업데이트
            infoItem[0] = newTarget;
          });

          console.log('NNEED', needRun);

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