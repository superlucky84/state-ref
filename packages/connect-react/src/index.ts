import { useState, useSyncExternalStore } from 'react';
import type { Renew, StateRefStore, Watch } from 'state-ref';

export type ViewWatch<R> = (
  renew?: Renew<R>,
  option?: { cache?: boolean }
) => R;

/**
 * One component's link to a store.
 *
 * React's contract for an external store is `useSyncExternalStore`: render
 * reads a snapshot, and the subscription is made by `subscribe` after commit
 * and ended by the function it returns. The snapshot here is a counter the
 * subscription bumps whenever the store says something this component read
 * has changed.
 *
 * What the component reads is decided by state-ref, not by a selector: every
 * `.value` read through a subscribed ref adds that path to the subscription
 * (`collector.ts`). So render must read through the ref `subscribe` made.
 * Before the first commit there is no such ref - render reads through a live
 * ref that registers nothing, and `subscribe` bumps the counter so React
 * renders once more, this time through the subscribed ref, which is how the
 * paths get collected. That is one extra render per mount (DC-CN-03).
 *
 * `<StrictMode>` subscribes, unsubscribes and subscribes again. Each
 * `subscribe` makes a new subscription with its own AbortSignal, so the
 * simulated unmount ends the first one for good and the remount starts clean
 * (F-R1). A render React throws away may still read through the current ref
 * and add paths to it; that can only widen the subscription, never lose one.
 */
type Link<R> = {
  ref: R | null;
  version: number;
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => number;
};

function createLink<R>(watch: ViewWatch<R>): Link<R> {
  const link: Link<R> = {
    ref: null,
    version: 0,
    subscribe: onChange => {
      const controller = new AbortController();
      const renew: Renew<R> = (_, isFirst) => {
        if (!isFirst) {
          link.version += 1;
          onChange();
        }
        return controller.signal;
      };
      link.ref = watch(renew);
      // Render once more through the subscribed ref so it collects paths.
      link.version += 1;
      onChange();
      return () => {
        controller.abort();
        link.ref = null;
      };
    },
    getSnapshot: () => link.version,
  };
  return link;
}

function connectWatch<R>(watch: ViewWatch<R>) {
  return (): R => {
    const [link] = useState(() => createLink(watch));
    // The server snapshot is the same counter: a server render never
    // subscribes, so it reads through a ref that registers nothing.
    useSyncExternalStore(link.subscribe, link.getSnapshot, link.getSnapshot);
    return link.ref ?? watch();
  };
}

/**
 * React 18 and 19.
 */
export function connectReact<T>(watch: Watch<T>) {
  return connectWatch<StateRefStore<T>>(watch);
}

/** Connect a readonly query view without granting display-value setters. */
export function connectReactView<R>(watch: ViewWatch<R>) {
  return connectWatch(watch);
}
