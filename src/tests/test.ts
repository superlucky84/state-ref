import { store } from '@/index';

const subscribe = store<{
  a: {
    a1: [{ a8: number }, { a2: number }];
    a2: { a3: number; a4: number };
    a12: number;
  };
  b: number;
}>({
  a: {
    a1: [{ a8: 3 }, { a2: 3 }],
    a2: { a3: 3, a4: 3 },
    a12: 3,
  },
  b: 3,
});
const subscribe2 = store<number>(3);
const p2 = subscribe2(store => {
  console.log('9999', store.value);
});
//@ts-ignore
window.p2 = p2;

const subscribe3 = store<number[]>([1, 2, 3]);
const p3 = subscribe3(store => {
  console.log('7777', store);
});

//@ts-ignore
window.p3 = p3;

const abortController = new AbortController();
// const abortController2 = new AbortController();
const proxy = subscribe(state => {
  console.log('1', state.a.a1[0].a8.value);
  console.log('2', state.a.a12);
  return abortController.signal;
});

/*
const proxy2 = subscribe(state => {
  console.log('3', state.a.a1[1].a2);
  console.log('4', state.b);
  return abortController2.signal;
});
*/

// @ts-ignore
window.p = proxy;
// @ts-ignore
// window.p2 = proxy2;
// @ts-ignore
window.abort = abortController;
// @ts-ignore
// window.abort2 = abortController2;

/*
console.log(proxy);
console.log('------------');
console.log(proxy.a);
console.log('------------');
console.log(proxy.b);
*/
