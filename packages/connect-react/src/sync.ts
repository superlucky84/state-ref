import { useEffect, useState, useSyncExternalStore } from 'react';
import type {
  ObserveOptions,
  QueryDisplayRef,
  QueryDisplayState,
  QueryObserverControls,
  SyncClient,
} from '@stateref/sync';
import { connectReactView } from './index';

const subscribeToNothing = () => () => {};

/** Observe a query for this component's lifetime; leaf values use `.value`. */
export function useSyncQuery<T, S = T>(
  client: SyncClient,
  options: ObserveOptions<T, S>
): readonly [QueryDisplayRef<QueryDisplayState<S>>, QueryObserverControls<T>] {
  const [link] = useState(() => {
    if (typeof client.observe !== 'function') {
      throw new Error(
        'This sync client has no observe(); align the @stateref/sync versions of the bundles on this page.'
      );
    }
    const observer = client.observe(options);
    return { client, observer, useView: connectReactView(observer.watch) };
  });
  if (link.client !== client) {
    throw new Error('This query observer is bound to another client.');
  }

  // Confirm before the connector's effects run, including effect remounts.
  useEffect(() => {
    link.observer.setOptions(options);
  });
  const display = link.useView();

  // During a key switch the connector still tracks the previous key. Give
  // React the new key's root for its concurrent consistency check. After
  // confirmation this becomes null, prompting a render that collects paths
  // through the connector's subscribed ref (DC-QH-27/28).
  const getSnapshot = () =>
    link.observer.matches(options) ? null : link.observer.peek(options).value;
  useSyncExternalStore(subscribeToNothing, getSnapshot, getSnapshot);

  return [
    link.observer.matches(options) ? display : link.observer.peek(options),
    link.observer.controls,
  ];
}
