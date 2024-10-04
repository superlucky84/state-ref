import { h, mount, render } from 'lithent';
import { lenshelf } from '@/index';

const take = lenshelf<{ name: string; age: number }>({
  name: 'brown',
  age: 13,
});

const store = take(store => {
  console.log(store.age.value);
});
console.log(store.age.value);

//@ts-ignore
window.p = store;

const Name = mount(renew => {
  const shelf = take(renew);

  return () => <div>aa = {shelf.name.value}</div>;
});

const Age = mount(renew => {
  const shelf = take(renew);

  return () => <div>aa = {shelf.age.value}</div>;
});

render(<Age />, document.getElementById('root') as HTMLElement);
render(<Name />, document.getElementById('root2') as HTMLElement);
