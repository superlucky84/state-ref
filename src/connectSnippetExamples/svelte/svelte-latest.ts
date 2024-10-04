import { onDestroy } from 'svelte';
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { ShelfStore, Take } from '@/index';
// import type { ShelfStore, Take } from 'lenshelf';

/**
 * Svelte V4
 */
export function connectShelfWithSvelte<T>(take: Take<T>) {
  return <V>(callback: (store: ShelfStore<T>) => ShelfStore<V>) => {
    const abortController = new AbortController();
    let signalValue!: Writable<V>;
    let shelf!: ShelfStore<V>;
    let changing = false;
    const change = (cb: () => void) => {
      changing = true;
      cb();
      changing = false;
    };

    onDestroy(() => {
      abortController.abort();
    });

    take(shelfStore => {
      shelf = callback(shelfStore);

      if (!changing) {
        if (signalValue) {
          signalValue.set(shelf.value as V);
        } else {
          signalValue = writable(shelf.value as V);
        }
      }

      return abortController.signal;
    });

    signalValue.subscribe(newValue => {
      if (shelf.value !== newValue && !changing) {
        change(() => {
          shelf.value = newValue;
        });
      }
    });

    return signalValue;
  };
}
