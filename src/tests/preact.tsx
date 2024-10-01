import { h, render } from 'preact';
import { lenshelf } from '@/index';
import { connectShelfWithPreact } from '@/connectSnippetExamples/preact/preact-v10';

const subscribe = lenshelf<{ name: string; age: number }>({
  name: 'brown',
  age: 13,
});

const usePofileStore = connectShelfWithPreact(subscribe);

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

render(<Age />, document.getElementById('root') as HTMLElement);
render(<Name />, document.getElementById('root2') as HTMLElement);
