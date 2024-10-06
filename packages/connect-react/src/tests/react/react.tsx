// @ts-ignore
import { createElement as h } from 'react';
// @ts-ignore
import { createRoot } from 'react-dom/client';

import { createStore } from 'state-ref';
import { connectWithReactA } from '@/index';

const watch = createStore<{ name: string; age: number }>({
  name: 'brown',
  age: 13,
});

const usePofileStore = connectWithReactA(watch);

const p = watch();

//@ts-ignore
window.p = p;

function Name() {
  const stateRef = usePofileStore();

  return <div>aa = {stateRef.age.value}</div>;
}

function Age() {
  const stateRef = usePofileStore();

  return <div>bb = {stateRef.name.value}</div>;
}

createRoot(document.getElementById('root') as HTMLElement).render(<Age />);
createRoot(document.getElementById('root2') as HTMLElement).render(<Name />);
