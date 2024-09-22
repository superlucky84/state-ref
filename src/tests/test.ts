import { store } from '@/index';

const subscribe = store({
  a: {
    a1: { a2: 3 },
    a12: 3,
  },
  b: 2,
});

subscribe(state => {
  console.log(state.a.a1.a2);
  console.log(state.a.a12);
});
