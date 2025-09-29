import { createStore, combineWatch } from '@/index';

// let newValue!: People;

const defaultValue1 = 1000;
const defaultValue2 = { jj: 2000 };

const watch1 = createStore<number>(defaultValue1);
const watch2 = createStore<{ jj: number }>(defaultValue2);

const combindWatch = combineWatch([watch1, watch2] as const);

combindWatch(([ref1, ref2]) => {
  console.log(ref1.value + ref2.jj.value);
});
