// @ts-ignore
import { useState, useRef, useEffect } from 'react';
import type { ShelfStore, Subscribe } from '@/index';
// import type { ShelfStore, Subscribe } from 'lenshelf';

export function connectShelfWithReact<T>(subscribe: Subscribe<T>) {
  const useForceUpdate = () => {
    const [dummy, setDummy] = useState(0);
    const abortController = useRef(new AbortController());
    const forceUpdateRef = useRef((_: ShelfStore<T>, isFirst: Boolean) => {
      if (!isFirst) {
        setDummy(dummy < 100 ? dummy + 1 : 0);
      }

      return abortController.current.signal;
    });

    // 컴포넌트가 언마운트될 때 abort 작업 수행
    useEffect(() => () => abortController.current.abort(), []);

    return forceUpdateRef.current;
  };

  return () => subscribe(useForceUpdate());
}
