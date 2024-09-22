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

const proxy = subscribe(state => {
  console.log(state.a.a1[0].a8);
  console.log(state.a.a12);
});
// @ts-ignore
window.p = proxy;

console.log(proxy);
console.log('------------');
console.log(proxy.a);
console.log('------------');
console.log(proxy.b);
