import { mountCallback, updateCallback, useRenew } from 'lithent';
import type {
  ObserveOptions,
  QueryDisplayRef,
  QueryDisplayState,
  QueryObserverControls,
  SyncClient,
} from '@stateref/sync';
import { connectLithentView } from './index';

/** Create once in a mounter; a getter follows live props, then commits options. */
export function createSyncQuery<T, S = T>(
  client: SyncClient,
  options: ObserveOptions<T, S> | (() => ObserveOptions<T, S>)
): readonly [
  () => QueryDisplayRef<QueryDisplayState<S>>,
  QueryObserverControls<T>
] {
  if (typeof client.observe !== 'function') {
    throw new Error(
      'This sync client has no observe(); align the @stateref/sync versions of the bundles on this page.'
    );
  }
  const getter = typeof options === 'function' ? options : null;
  let rendered = getter ? getter() : (options as ObserveOptions<T, S>);
  const observer = client.observe(rendered);
  const renew = useRenew();
  // Confirm before the connector subscribes, including props changed before mount.
  mountCallback(() => {
    observer.setOptions(getter ? getter() : rendered);
  });
  if (getter) {
    updateCallback(
      () => {
        const next = rendered;
        return () => {
          if (observer.setOptions(next)) queueMicrotask(renew);
        };
      },
      () => {
        rendered = getter();
        return [];
      }
    );
  }
  const view = connectLithentView(observer.watch);
  return [
    () => (observer.matches(rendered) ? view() : observer.peek(rendered)),
    observer.controls,
  ];
}
