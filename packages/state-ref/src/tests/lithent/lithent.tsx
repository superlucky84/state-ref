import { h, mount, render } from 'lithent';
import { fromState } from '@/index';

const capture = fromState<{ name: string; age: number }>({
  name: 'brown',
  age: 13,
});

const store = capture(store => {
  console.log(store.age.current);
});
console.log(store.age.current);

//@ts-ignore
window.p = store;

const Name = mount(renew => {
  const stateRef = capture(renew);

  return () => <div>aa = {stateRef.name.current}</div>;
});

const Age = mount(renew => {
  const stateRef = capture(renew);

  return () => <div>aa = {stateRef.age.current}</div>;
});

render(<Age />, document.getElementById('root') as HTMLElement);
render(<Name />, document.getElementById('root2') as HTMLElement);
