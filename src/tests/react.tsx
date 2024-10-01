// @ts-ignore
import { createElement as h } from 'react';
// @ts-ignore
import { createRoot } from 'react-dom/client';

import { lenshelf } from '@/index';
import { connectShelfWithReact } from '@/connectSnippetExamples/react/react-latest';

const subscribe = lenshelf<{ name: string; age: number }>({
  name: 'brown',
  age: 13,
});

const usePofileStore = connectShelfWithReact(subscribe);

const p = subscribe();

//@ts-ignore
window.p = p;

function Name() {
  const shelf = usePofileStore();

  return <div>aa = {shelf.age.value}</div>;
}

function Age() {
  const shelf = usePofileStore();

  return <div>bb = {shelf.name.value}</div>;
}

createRoot(document.getElementById('root') as HTMLElement).render(<Age />);
createRoot(document.getElementById('root2') as HTMLElement).render(<Name />);
