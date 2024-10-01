import { createSignal, onCleanup, createEffect } from 'solid-js';
import type { Signal } from 'solid-js';
import type { ShelfStore, Subscribe } from '@/index';
// import type { ShelfStore, Subscribe } from 'lenshelf';

export function connectShelfWithSolid<T>(subscribe: Subscribe<T>) {
  return <V>(callback: (store: ShelfStore<T>) => ShelfStore<V>): Signal<V> => {
    const abortController = new AbortController();
    let signalValue!: Signal<V>;
    let shelf!: ShelfStore<V>;

    onCleanup(() => {
      abortController.abort();
    });

    createEffect(() => {
      shelf.value = signalValue[0]();
    });

    subscribe(shelfStore => {
      shelf = callback(shelfStore);
      if (signalValue) {
        signalValue[1](() => shelf.value as V);
      } else {
        signalValue = createSignal<V>(shelf.value as V);
      }

      return abortController.signal;
    });

    return signalValue;
  };
}
