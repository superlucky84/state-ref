import { useState, useRef, useEffect } from 'preact/hooks';
import type { StateRefStore, Watch } from 'state-ref';

/**
 * Preact V10 type A
 */
export function connectPreact<T>(watch: Watch<T>) {
  const useForceUpdate = () => {
    const [, setDummy] = useState(0);
    const abortController = useRef(new AbortController());
    const forceUpdateRef = useRef((_: StateRefStore<T>, isFirst: boolean) => {
      if (!isFirst) {
        setDummy(prev => prev + 1);
      }

      return abortController.current.signal;
    });

    // Unsubscribe if the component is unmounted.
    useEffect(() => () => abortController.current.abort(), []);

    return forceUpdateRef.current;
  };

  return () => watch(useForceUpdate());
}
