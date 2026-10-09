import { watch } from 'vue';
import type { Ref } from 'vue';
import type {
  ObserveOptions,
  QueryDisplayRef,
  QueryDisplayState,
  QueryObserverControls,
  SyncClient,
} from '@stateref/sync';
import { connectVueView } from './index';

/** Observe a query in the current Vue scope. Read reactive options in a getter. */
export function useSyncQuery<T, S = T>(
  client: SyncClient,
  options: ObserveOptions<T, S> | (() => ObserveOptions<T, S>)
): readonly [
  <V>(
    select: (ref: QueryDisplayRef<QueryDisplayState<S>>) => V
  ) => Readonly<Ref<V>>,
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
    watch(options, next => observer.setOptions(next), { flush: 'pre' });
  }
  return [connectVueView(observer.watch), observer.controls];
}
