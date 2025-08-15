import { createStore, createComputed } from 'state-ref';
import type { Watch } from 'state-ref';
import { connectVue } from '@/index';

export type Profile = { name: string; age: number };

export const getDefaultValue = () => ({
  name: 'Brown',
  age: 13,
});

export const watch = createStore<Profile>(getDefaultValue());
export const watch2 = createStore<number>(7);
export const handleRef = watch();
export const useProfileRef = connectVue(watch);

const computedWatch = createComputed<[Watch<Profile>, Watch<number>], number>(
  [watch, watch2],
  ([ref, ref2]) => {
    return ref.age.value + ref2.value;
  }
);

export const useComputedRef = connectVue(computedWatch);
