import { h, render } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';

import lenshelf from '@/index';
import type { ShelfStore, Subscribe } from '@/index';

function createPreactShelfHook<T>(subscribe: Subscribe<T>) {
  // 커스텀 훅을 정의하여 forceUpdate 기능과 abort를 제공합니다.
  const useForceUpdate = () => {
    const [, setDummy] = useState(0);
    const abortController = useRef(new AbortController());
    const forceUpdateRef = useRef((_: ShelfStore<T>, isFirst: Boolean) => {
      if (!isFirst) {
        setDummy(prev => (prev < 100 ? prev + 1 : 0));
      }

      return abortController.current.signal;
    });

    // 컴포넌트가 언마운트될 때 abort 작업 수행
    useEffect(() => () => abortController.current.abort(), []);

    return forceUpdateRef.current;
  };

  return () => subscribe(useForceUpdate());
}

const subscribe = lenshelf<{ name: string; age: number }>({
  name: 'brown',
  age: 13,
});

const usePofileStore = createPreactShelfHook(subscribe);

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
