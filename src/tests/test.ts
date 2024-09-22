import { store } from '@/index';

const subscribe = store<any>({
  a: {
    a1: { a2: 3 },
    a12: 3,
  },
  b: 2,
});

const proxy = subscribe(state => {
  console.log(state.a.a1.a2);
  console.log(state.a.a12);
});
// @ts-ignore
window.p = proxy;
console.log(proxy);
console.log('------------');
console.log(proxy.a);
console.log('------------');
console.log(proxy.b);
