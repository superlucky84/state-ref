import { useState, useRef, useEffect } from 'preact/hooks';
import type { Renew, StateRefStore, Watch } from 'state-ref';

export type ViewWatch<R> = (
  renew?: Renew<R>,
  option?: { cache?: boolean }
) => R;

function connectWatch<R>(watch: ViewWatch<R>) {
  return () => {
    const [, setDummy] = useState(0);
    const abortController = useRef(new AbortController());
    const forceUpdateRef = useRef((_: R, isFirst: boolean) => {
      if (!isFirst) setDummy(prev => prev + 1);
      return abortController.current.signal;
    });
    useEffect(() => () => abortController.current.abort(), []);
    return watch(forceUpdateRef.current);
  };
}

/**
 * Preact V10 type A
 */
export function connectPreact<T>(watch: Watch<T>) {
  return connectWatch<StateRefStore<T>>(watch);
}

/** Connect a readonly query view without granting display-value setters. */
export function connectPreactView<R>(watch: ViewWatch<R>) {
  return connectWatch(watch);
}
