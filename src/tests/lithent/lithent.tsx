import { h, mount, render } from 'lithent';
import { fromState } from '@/index';

const capture = fromState<{ name: string; age: number }>({
  name: 'brown',
  age: 13,
});

const store = capture(store => {
  console.log(store.age.value);
});
console.log(store.age.value);

//@ts-ignore
window.p = store;

const Name = mount(renew => {
  const stateRef = capture(renew);

  return () => <div>aa = {stateRef.name.value}</div>;
});

const Age = mount(renew => {
  const stateRef = capture(renew);

  return () => <div>aa = {stateRef.age.value}</div>;
});

render(<Age />, document.getElementById('root') as HTMLElement);
render(<Name />, document.getElementById('root2') as HTMLElement);
