import lenshelf from '@/index';

const subscribe = lenshelf<number>(3);

// @ts-ignore
window.p = subscribe();

subscribe(store => {
  console.log('sub2', store.value);
});

subscribe(store => {
  console.log('sub3', store.value);
});
