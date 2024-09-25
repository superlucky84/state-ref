import { lens } from '@/lens';
import type { Lens } from '@/lens';
import { makeDisplayProxyValue } from '@/helper';
import { collector } from '@/collector';
import { Shelf } from '@/shelf';
import type { Run, WithRoot, RunInfo, StoreRenderList } from '@/types';

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
          const value = lensValue.get()(rootValue);
          const runInfo: RunInfo<typeof propertyValue> = {
            value,
            getNextValue: () => lensValue.get()(rootValue),
            key: newDepthList.join('.'),
          };

          if (run) {
            if (storeRenderList.has(run)) {
              const subList = storeRenderList.get(run);
              if (!subList!.has(runInfo.key)) {
                subList!.set(runInfo.key, runInfo);
              }
            } else {
              const subList = new Map<string, typeof runInfo>();
              subList.set(runInfo.key, runInfo);
              storeRenderList.set(run, subList);
            }
          }

          console.log('3333333333333333', storeRenderList);
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
        return new Shelf(
          propertyValue,
          newDepthList,
          lensValue,
          rootValue,
          () => {
            collector(
              propertyValue,
              lens,
              rootValue,
              newDepthList,
              run,
              storeRenderList
            );
          }
        );
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
