import { h, mount, render } from 'lithent';
import lenshelf from '@/index';
/*
    "@types/react": "^18.3.10",
    "@types/react-dom": "^18.3.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
 */

// 커스텀 훅을 정의하여 forceUpdate 기능과 abort를 제공합니다.

const subscribe = lenshelf<{ name: string; age: number }>({
  name: 'brown',
  age: 13,
});

const p = subscribe();

//@ts-ignore
window.p = p;

const Name = mount(renew => {
  const shelf = subscribe(renew);

  return () => <div>aa = {shelf.name.value}</div>;
});

const Age = mount<{ a: number }>(renew => {
  const shelf = subscribe(renew);

  return () => <div>aa = {shelf.age.value}</div>;
});

render(<Age a={3} />, document.getElementById('root') as HTMLElement);
render(<Name />, document.getElementById('root2') as HTMLElement);
