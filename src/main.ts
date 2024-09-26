import { makeProxy } from '@/makeProxy';
import { ShelfPrimitive } from '@/shelf';
import { isPrimitiveType } from '@/helper';
import { collector } from '@/collector';
import { runner } from '@/runner';

import type {
  Renew,
  StoreType,
  WrapWithValue,
  Run,
  StoreRenderList,
} from '@/types';

const DEFAULT_OPTION = { cache: true };

export const store = <V>(orignalValue: V) => {
  type S = StoreType<V>; // 처음 제공받는 값 타입 V에 root를 달음
  type G = WrapWithValue<V>; // 끝에 root가 안달린 상태 끝에 value를 달음
  type T = WrapWithValue<S>; // 끝에 root가 달린 상태 끝에 value를 달음

  const storeRenderList: StoreRenderList<V> = new Map();
  const cacheMap = new WeakMap<Renew<G>, G>();

  return (renew?: Renew<G>, userOption?: { cache?: boolean }): G => {
    /**
     * 캐시처리
     */
    const { cache } = Object.assign({}, DEFAULT_OPTION, userOption || {});

    if (cache && renew && cacheMap.has(renew)) {
      return cacheMap.get(renew)!;
    }

    /**
     * 객체 가 아닌 데이터면 shelfPrimitive로 만들어서 반환
     */
    if (isPrimitiveType(orignalValue)) {
      const ref: { current: null | G } = { current: null };

      ref.current = new ShelfPrimitive(
        orignalValue,
        () => {
          let newValue: V = orignalValue;
          if (renew) {
            const run = () => renew(ref.current!);
            collector(
              orignalValue,
              () => newValue as V & undefined,
              ['root'],
              run,
              storeRenderList
            );
          }

          return (value: V) => {
            newValue = value;
          };
        },
        () => {
          runner(storeRenderList);
        }
      ) as unknown as G;

      if (renew) {
        const run = () => renew(ref.current!);
        // 처음 실행시 abort 이벤트 리스너에 추가
        runFirstEmit(run, storeRenderList, cacheMap, renew);

        cacheMap.set(renew, ref.current!);
      }

      return ref.current! as G;
    }

    /**
     * 객체일때는 프록시 만들어서 리턴
     */
    const initialValue = orignalValue;
    const value: S = { root: initialValue };
    const ref: { current: null | T } = { current: null };

    if (renew) {
      const run = () => renew(ref.current!.root);
      ref.current = makeProxy<S, T, V>(value, storeRenderList, run);

      // 처음 실행시 abort 이벤트 리스너에 추가
      runFirstEmit(run, storeRenderList, cacheMap, renew);

      cacheMap.set(renew, ref.current!.root);
    }

    return ref.current!.root;
  };
};

const runFirstEmit = <V, G>(
  run: Run,
  storeRenderList: StoreRenderList<V>,
  cacheMap: WeakMap<Renew<G>, G>,
  renew: Renew<G>
) => {
  const renewResult = run!();

  if (renewResult instanceof AbortSignal) {
    renewResult.addEventListener('abort', () => {
      cacheMap.delete(renew);
      storeRenderList.delete(run);
    });
  }
};
