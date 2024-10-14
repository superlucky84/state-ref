import { useState, useRef, useEffect } from 'react';
import type { StateRefStore, Watch } from 'state-ref';

/**
 * React V18
 */
export function connectReact<T>(watch: Watch<T>) {
  const useForceUpdate = () => {
    const [, setDummy] = useState(0);
    const abortController = useRef(new AbortController());
    const forceUpdateRef = useRef((_: StateRefStore<T>, isFirst: boolean) => {
      if (!isFirst) {
        setDummy((prev: number) => prev + 1);
      }

      return abortController.current.signal;
    });

    // Unsubscribe if the component is unmounted.
    useEffect(() => () => abortController.current.abort(), []);

    return forceUpdateRef.current;
  };

  return () => watch(useForceUpdate());
}
