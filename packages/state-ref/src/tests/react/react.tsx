// @ts-ignore
import { createElement as h } from 'react';
// @ts-ignore
import { createRoot } from 'react-dom/client';

import { fromState } from '@/index';
import { connectWithReactA } from '@/connectSnippetExamples/react/react-latest';

const capture = fromState<{ name: string; age: number }>({
  name: 'brown',
  age: 13,
});

const usePofileStore = connectWithReactA(capture);

const p = capture();

//@ts-ignore
window.p = p;

function Name() {
  const stateRef = usePofileStore();

  return <div>aa = {stateRef.age.current}</div>;
}

function Age() {
  const stateRef = usePofileStore();

  return <div>bb = {stateRef.name.current}</div>;
}

createRoot(document.getElementById('root') as HTMLElement).render(<Age />);
createRoot(document.getElementById('root2') as HTMLElement).render(<Name />);
