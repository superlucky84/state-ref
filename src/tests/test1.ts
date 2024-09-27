import { store } from '@/index';

const subscribe = store<{
  a: {
    a1: number;
    a2: number;
    a3: number;
  };
}>({
  a: {
    a1: 1,
    a2: 2,
    a3: 3,
  },
});

// @ts-ignore
window.p = subscribe(store => {
  console.log('sub1', store.a.a1.value);
});

subscribe(store => {
  console.log('sub2', store.a.a1.value);
});

subscribe(store => {
  console.log('sub3', store.a.a1.value);
});
