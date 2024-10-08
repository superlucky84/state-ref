import { onDestroy } from 'svelte';
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { StateRefStore, Watch } from 'state-ref';

/**
 * Svelte V4
 */
export function connectSvelte<T>(watch: Watch<T>) {
  return <V>(callback: (store: StateRefStore<T>) => StateRefStore<V>) => {
    const abortController = new AbortController();
    let signalValue!: Writable<V>;
    let stateRef!: StateRefStore<V>;
    let changing = false;
    const change = (cb: () => void) => {
      changing = true;
      cb();
      changing = false;
    };

    onDestroy(() => {
      abortController.abort();
    });

    watch(stateInnerRef => {
      stateRef = callback(stateInnerRef);

      if (!changing) {
        if (signalValue) {
          signalValue.set(stateRef.value as V);
        } else {
          signalValue = writable(stateRef.value as V);
        }
      }

      return abortController.signal;
    });

    signalValue.subscribe(newValue => {
      if (stateRef.value !== newValue && !changing) {
        change(() => {
          stateRef.value = newValue;
        });
      }
    });

    return signalValue;
  };
}
