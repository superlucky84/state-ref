import { createStore, createComputed, combineWatch } from 'state-ref';
import type { Watch } from 'state-ref';
import { connectSvelte } from '@/index';

export type Profile = { name: string; age: number };

export const getDefaultValue = () => ({
  name: 'Brown',
  age: 13,
});

export const watch = createStore<Profile>(getDefaultValue());
export const watch2 = createStore<number>(7);
export const handleRef = watch();
export const useProfileRef = connectSvelte(watch);

const computedWatch = createComputed<[Watch<Profile>, Watch<number>], number>(
  [watch, watch2],
  ([ref, ref2]) => {
    return ref.age.value + ref2.value;
  }
);

export const combinedWatch = combineWatch([watch, watch2] as const);

export const useComputedRef = connectSvelte(computedWatch);
export const useCombindRef = connectSvelte(combinedWatch);
