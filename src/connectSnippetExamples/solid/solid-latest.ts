import { createSignal, onCleanup, createEffect } from 'solid-js';
import type { Signal } from 'solid-js';
import type { ShelfStore, Subscribe } from '@/index';
// import type { ShelfStore, Subscribe } from 'lenshelf';

/**
 * Solid-js V1
 */
export function connectShelfWithSolid<T>(subscribe: Subscribe<T>) {
  return <V>(callback: (store: ShelfStore<T>) => ShelfStore<V>): Signal<V> => {
    const abortController = new AbortController();
    let signalValue!: Signal<V>;
    let shelf!: ShelfStore<V>;
    let changing = false;
    const change = (cb: () => void) => {
      changing = true;
      cb();
      changing = false;
    };

    onCleanup(() => {
      abortController.abort();
    });

    subscribe(shelfStore => {
      shelf = callback(shelfStore);

      if (!changing) {
        if (signalValue) {
          signalValue[1](() => shelf.value as V);
        } else {
          signalValue = createSignal<V>(shelf.value as V);
        }
      }

      return abortController.signal;
    });

    createEffect(() => {
      const newValue = signalValue[0]();

      if (shelf.value !== newValue && !changing) {
        change(() => {
          shelf.value = newValue;
        });
      }
    });

    return signalValue;
  };
}
