import { onDestroy } from 'svelte';
import { writable } from 'svelte/store';
import type { Readable, Writable } from 'svelte/store';
import type { Renew, StateRefStore, Watch } from 'state-ref';

export type ViewWatch<R> = (
  renew?: Renew<R>,
  option?: { cache?: boolean }
) => R;

/** One-way Svelte store for a readonly query view. */
export function connectSvelteView<R>(viewWatch: ViewWatch<R>) {
  return <V>(select: (ref: R) => V): Readable<V> => {
    const abortController = new AbortController();
    let signalValue!: Writable<V>;
    onDestroy(() => abortController.abort());
    viewWatch((ref, first) => {
      const value = select(ref);
      if (signalValue) signalValue.set(value);
      else signalValue = writable(value);
      if (first) return abortController.signal;
      return undefined;
    });
    return { subscribe: signalValue.subscribe };
  };
}

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
