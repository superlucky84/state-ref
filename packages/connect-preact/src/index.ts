import { useState, useRef, useEffect } from 'preact/hooks';
import type { StateRefStore, Watch } from 'state-ref';

/**
 * Preact V10 type A
 */
export function connectWithPreactA<T>(watch: Watch<T>) {
  const useForceUpdate = () => {
    const [, setDummy] = useState(0);
    const abortController = useRef(new AbortController());
    const forceUpdateRef = useRef((_: StateRefStore<T>, isFirst: boolean) => {
      if (!isFirst) {
        setDummy(prev => prev + 1);
      }

      return abortController.current.signal;
    });

    // 컴포넌트가 언마운트될 때 abort 작업 수행
    useEffect(() => () => abortController.current.abort(), []);

    return forceUpdateRef.current;
  };

  return () => watch(useForceUpdate());
}