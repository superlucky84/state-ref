import { createStore } from 'state-ref';
import { batch } from 'state-ref/batch';

const watch = createStore({ b: 0, c: 0 });
const ref = watch();
const result: number = batch(() => {
  ref.b.value = 3;
  ref.c.value = 4;
  return ref.b.value + ref.c.value;
});

void result;
