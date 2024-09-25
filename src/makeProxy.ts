import { lens } from '@/lens';
import type { Lens } from '@/lens';
import { makeDisplayProxyValue } from '@/helper';
import { Shelf } from '@/shelf';
import { addDependency } from '@/dependency';
import type { Run, WithRoot } from '@/types';

export const makeProxy = <S extends WithRoot, T extends WithRoot, G>(
  value: S,
  storeRenderList: Map<Run, [G, () => G, number][]>,
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
        const lens = lensValue.k(prop);

        if (prop === 'value') {
          // 디펜던시 추가
          addDependency({ run, storeRenderList, depthList });
          return lensValue.get()(rootValue);
        }

        const newDepthList = [...depthList, prop.toString()];
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

        addDependency({ run, storeRenderList, depthList });

        return new Shelf(propertyValue, newDepthList, lensValue, rootValue);
        /* 디펜던시 추가
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
        if (prop === 'value' && value !== lensValue.get()(rootValue)) {
          const newTree = lensValue.set(value)(rootValue);
          rootValue.root = newTree.root;
        } else if (lensValue.k(prop).get()(rootValue) !== value) {
          const newValue = lensValue.k(prop).set(value)(rootValue);

          rootValue.root = newValue.root;

          /*
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
              // 타겟 업데이트
              infoItem[0] = newTarget;
            });

            if (needRun && run && run() === false) {
              storeRenderList.delete(run);
            }
          }
        */
        }
        return true;
      },
    }
  );

  return result;
};
