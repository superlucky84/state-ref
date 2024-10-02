import { useState, useRef, useEffect } from 'react';
import type { ShelfStore, Subscribe } from '@/index';
// import type { ShelfStore, Subscribe } from 'lenshelf';

/**
 * React V18
 */
export function connectShelfWithReact<T>(subscribe: Subscribe<T>) {
  const useForceUpdate = () => {
    const [dummy, setDummy] = useState(0);
    const abortController = useRef(new AbortController());
    const forceUpdateRef = useRef((_: ShelfStore<T>, isFirst: boolean) => {
      if (!isFirst) {
        setDummy(dummy + 1);
      }

      return abortController.current.signal;
    });

    // 컴포넌트가 언마운트될 때 abort 작업 수행
    useEffect(() => () => abortController.current.abort(), []);

    return forceUpdateRef.current;
  };

  return () => subscribe(useForceUpdate());
}
