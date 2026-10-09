import { createComputed } from 'solid-js';
import type { Accessor } from 'solid-js';
import type {
  ObserveOptions,
  QueryDisplayRef,
  QueryDisplayState,
  QueryObserverControls,
  SyncClient,
} from '@stateref/sync';
import { connectSolidView } from './index';

/** Observe a query in the current Solid owner. An accessor follows option changes. */
export function createSyncQuery<T, S = T>(
  client: SyncClient,
  options: ObserveOptions<T, S> | Accessor<ObserveOptions<T, S>>
): readonly [
  <V>(select: (ref: QueryDisplayRef<QueryDisplayState<S>>) => V) => Accessor<V>,
  QueryObserverControls<T>
] {
  if (typeof client.observe !== 'function') {
    throw new Error(
      'This sync client has no observe(); align the @stateref/sync versions of the bundles on this page.'
    );
  }
  const observer = client.observe(
    typeof options === 'function' ? options() : options
  );
  if (typeof options === 'function') {
    createComputed(() => observer.setOptions(options()));
  }
  return [connectSolidView(observer.watch), observer.controls];
}
