import { useState, useRef, useEffect } from 'react';
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
      if (!isFirst) setDummy((prev: number) => prev + 1);
      return abortController.current.signal;
    });
    useEffect(() => () => abortController.current.abort(), []);
    /**
     * A server render never unmounts, so the effect above never registers and
     * a subscription made here could outlive the request if the store is
     * shared. Reading without a renew keeps the value live without retaining
     * this closure or registering a core subscription.
     */
    if (typeof window === 'undefined') return watch();
    return watch(forceUpdateRef.current);
  };
}

/**
 * React V18
 */
export function connectReact<T>(watch: Watch<T>) {
  return connectWatch<StateRefStore<T>>(watch);
}

/** Connect a readonly query view without granting display-value setters. */
export function connectReactView<R>(watch: ViewWatch<R>) {
  return connectWatch(watch);
}
