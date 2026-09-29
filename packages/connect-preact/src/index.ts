import { useEffect, useState } from 'preact/hooks';
import type { Renew, StateRefStore, Watch } from 'state-ref';

export type ViewWatch<R> = (
  renew?: Renew<R>,
  option?: { cache?: boolean }
) => R;

/**
 * One component's link to a store - the same design as the React connector
 * (docs/connectors/DESIGN.md, DC-CN-03), written with `preact/hooks` because
 * `useSyncExternalStore` lives only in `preact/compat`.
 *
 * The subscription is made in an effect, after commit, and ended by that
 * effect's cleanup. A render that never commits - one that suspends - makes
 * nothing to release (F-P3). Render reads through the subscribed ref so
 * state-ref collects exactly the paths the component reads; before the first
 * commit there is none, so a mount renders once more to collect them. A
 * server render runs no effects, so it subscribes to nothing.
 */
type Link<R> = {
  ref: R | null;
  version: number;
  subscribe: (onChange: (version: number) => void) => () => void;
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
          onChange(link.version);
        }
        return controller.signal;
      };
      link.ref = watch(renew);
      // Render once more through the subscribed ref so it collects paths.
      link.version += 1;
      onChange(link.version);
      return () => {
        controller.abort();
        link.ref = null;
      };
    },
  };
  return link;
}

function connectWatch<R>(watch: ViewWatch<R>) {
  return (): R => {
    const [link] = useState(() => createLink(watch));
    const [, setVersion] = useState(0);
    useEffect(() => link.subscribe(setVersion), [link]);
    return link.ref ?? watch();
  };
}

/**
 * Preact 10.
 */
export function connectPreact<T>(watch: Watch<T>) {
  return connectWatch<StateRefStore<T>>(watch);
}

/** Connect a readonly query view without granting display-value setters. */
export function connectPreactView<R>(watch: ViewWatch<R>) {
  return connectWatch(watch);
}
