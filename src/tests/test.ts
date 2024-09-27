import { store } from '@/index';

const subscribe = store<number>(3);

// @ts-ignore
window.p = subscribe(store => {
  console.log('sub1', store.value);
});

subscribe(store => {
  console.log('sub2', store.value);
});

subscribe(store => {
  console.log('sub3', store.value);
});
