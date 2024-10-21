import { createStoreManualSync } from 'state-ref';
import { connectVue } from '@/index';

export type Profile = { name: string; age: number };

export const getDefaultValue = () => ({
  name: 'Brown',
  age: 13,
});

export const { watch, updateRef, sync } = createStoreManualSync<Profile>(
  getDefaultValue()
);
export const handleRef = watch();
export const useProfileRef = connectVue(watch);

export const changeAge = (newAge: number) => {
  updateRef.age.value = newAge;
  sync();
};
