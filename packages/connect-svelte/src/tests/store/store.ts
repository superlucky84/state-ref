import { createStore } from 'state-ref';
import { connectSvelte } from '@/index';

export type Profile = { name: string; age: number };

export const getDefaultValue = () => ({
  name: 'Brown',
  age: 13,
});

export const watch = createStore<Profile>(getDefaultValue());
export const handleRef = watch();
export const useProfileRef = connectSvelte(watch);
