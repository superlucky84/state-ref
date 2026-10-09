import { onDestroy } from 'svelte';
import type { Readable, Unsubscriber } from 'svelte/store';
import type {
  ObserveOptions,
  QueryDisplayRef,
  QueryDisplayState,
  QueryObserver,
  QueryObserverControls,
  SyncClient,
} from '@stateref/sync';
import { connectSvelteView } from './index';

/** Observe a query during component initialization, with fixed or store options. */
export function createSyncQuery<T, S = T>(
  client: SyncClient,
  options: ObserveOptions<T, S> | Readable<ObserveOptions<T, S>>
): readonly [
  <V>(select: (ref: QueryDisplayRef<QueryDisplayState<S>>) => V) => Readable<V>,
  QueryObserverControls<T>
] {
  if (typeof client.observe !== 'function') {
    throw new Error(
      'This sync client has no observe(); align the @stateref/sync versions of the bundles on this page.'
    );
  }
  let observer: QueryObserver<T, S> | undefined;
  let initial!: ObserveOptions<T, S>;
  let stop: Unsubscriber | undefined;
  if ('subscribe' in options) {
    // Svelte's store contract delivers its current value synchronously.
    // Use this same subscription for updates, so start/stop run only once.
    stop = options.subscribe(next => {
      initial = next;
      observer?.setOptions(next);
    });
  } else initial = options;
  try {
    observer = client.observe(initial);
    if (stop) onDestroy(stop);
    return [connectSvelteView(observer.watch), observer.controls];
  } catch (error) {
    stop?.();
    throw error;
  }
}
