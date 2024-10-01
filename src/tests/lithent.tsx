import { h, mount, render } from 'lithent';
import { lenshelf } from '@/index';

const subscribe = lenshelf<{ name: string; age: number }>({
  name: 'brown',
  age: 13,
});

const store = subscribe(store => {
  console.log(store.age.value);
});
console.log(store.age.value);

//@ts-ignore
window.p = store;

const Name = mount(renew => {
  const shelf = subscribe(renew);

  return () => <div>aa = {shelf.name.value}</div>;
});

const Age = mount(renew => {
  const shelf = subscribe(renew);

  return () => <div>aa = {shelf.age.value}</div>;
});

render(<Age />, document.getElementById('root') as HTMLElement);
render(<Name />, document.getElementById('root2') as HTMLElement);
