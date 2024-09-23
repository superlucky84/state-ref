import { lens } from '@/lens';
import type { Lens } from '@/lens';

type Run = null | (() => boolean | AbortSignal | void);
type RootedObject = { root: unknown } & { [key: string | symbol]: unknown };

export const makeProxy = <T extends RootedObject, V>(
  value: T,
  storeRenderList: Map<Run, [V, () => V, number][]>,
  run: Run,
  rootValue: T = value,
  lensValue: Lens<T, T> = lens<T>(),
  depth: number = 0
): T => {
  const result = new Proxy(value, {
    get(_: T, prop: keyof T) {
      if (prop === 'value') {
        return lensValue.get()(rootValue);
      }

      const lens = lensValue.k(prop);
      const propertyValue: any = lens.get()(rootValue);

      // 랜더 콜백 리스트가 비어있고 콜스택 실행이 아직 안끝났으면 계속 수집 시도
      // Todo: target에 대해 중복 수집 막기
      // Todo: 값이 객체 타입이 아닐경우 value 처리
      // Todo: 더깊은 프록시로 내려갈때 이전 값을 가지고 다니면서 구독 배열에서 제거하는 코드 추가 및 테스트
      // Todo: RunInfo 는 Set로 관리 하고 쎗의 아이템은 객체로 관리하도록 변경
      // p.a.a2.a4 = 7; 로 업데이트 하면 예상하지 못한 결과
      // [현재객체, 현재랜즈, 깊이, 이전객체] 과거2
      // [현재객체, 현재랜즈, 깊이, 이전객체] 과거1
      // [현재객체, 현재랜즈, 깊이, 이전객체] 현재
      //    {currentValue, currentLens, depth, pastInfo} 과거2
      //    {currentValue, currentLens, depth, pastInfo} 과거1
      //    {currentValue, currentLens, depth, pastInfo} 현재
      //     pastInfo가 있으면 postInfo는 제거
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

      return propertyValue;
    },
    set(_, prop: string | symbol, value) {
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
