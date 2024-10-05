import { useState, useRef, useEffect } from 'react';
import type { StateRefStore, Capture } from '@/index';
// import type { StateRefStore, Capture } from 'state-ref';

/**
 * React V18
 */
export function connectWithReactA<T>(capture: Capture<T>) {
  const useForceUpdate = () => {
    const [dummy, setDummy] = useState(0);
    const abortController = useRef(new AbortController());
    const forceUpdateRef = useRef((_: StateRefStore<T>, isFirst: boolean) => {
      if (!isFirst) {
        setDummy(dummy + 1);
      }

      return abortController.current.signal;
    });

    // 컴포넌트가 언마운트될 때 abort 작업 수행
    useEffect(() => () => abortController.current.abort(), []);

    return forceUpdateRef.current;
  };

  return () => capture(useForceUpdate());
}
