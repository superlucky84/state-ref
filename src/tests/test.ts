import { store } from '@/index';

const subscribe = store<{
  a: { a1: [{ a8: number }, { a2: number }]; a12: number };
  b: number;
}>({
  a: {
    a1: [{ a8: 3 }, { a2: 3 }],
    a12: 3,
  },
  b: 2,
});

const abortController = new AbortController();
const proxy = subscribe(state => {
  console.log('1', state.a.a1[0].a8);
  console.log('2', state.a.a12);
  return abortController.signal;
});
// @ts-ignore
window.p = proxy;
// @ts-ignore
window.abort = abortController;

/*
console.log(proxy);
console.log('------------');
console.log(proxy.a);
console.log('------------');
console.log(proxy.b);
*/
