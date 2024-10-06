import { createSignal, onCleanup, createEffect } from 'solid-js';
import type { Signal } from 'solid-js';
import type { StateRefStore, Watch } from 'state-ref';
// import type { StateRefStore, Capture } from 'state-ref';

/**
 * Solid-js V1
 */
export function connectWithSolidA<T>(capture: Watch<T>) {
  return <V>(
    callback: (store: StateRefStore<T>) => StateRefStore<V>
  ): Signal<V> => {
    const abortController = new AbortController();
    let signalValue!: Signal<V>;
    let stateRef!: StateRefStore<V>;
    let changing = false;
    const change = (cb: () => void) => {
      changing = true;
      cb();
      changing = false;
    };

    onCleanup(() => {
      abortController.abort();
    });

    capture(stateInnerRef => {
      stateRef = callback(stateInnerRef);

      if (!changing) {
        if (signalValue) {
          signalValue[1](() => stateRef.value as V);
        } else {
          signalValue = createSignal<V>(stateRef.value as V);
        }
      }

      return abortController.signal;
    });

    createEffect(() => {
      const newValue = signalValue[0]();

      if (stateRef.value !== newValue && !changing) {
        change(() => {
          stateRef.value = newValue;
        });
      }
    });

    return signalValue;
  };
}
