import { createSignal, onCleanup, createEffect } from 'solid-js';
import type { Accessor, Signal } from 'solid-js';
import type { Renew, StateRefStore, Watch } from 'state-ref';
// import type { StateRefStore, Capture } from 'state-ref';

export type ViewWatch<R> = (
  renew?: Renew<R>,
  option?: { cache?: boolean }
) => R;

/** One-way Solid accessor for a readonly query view. */
export function connectSolidView<R>(viewWatch: ViewWatch<R>) {
  return <V>(select: (ref: R) => V): Accessor<V> => {
    const abortController = new AbortController();
    let signalValue!: Signal<V>;
    onCleanup(() => abortController.abort());
    viewWatch((ref, first) => {
      const value = select(ref);
      if (signalValue) signalValue[1](() => value);
      else signalValue = createSignal<V>(value);
      if (first) return abortController.signal;
      return undefined;
    });
    return signalValue[0];
  };
}

/**
 * Solid-js V1
 */
export function connectSolid<T>(watch: Watch<T>) {
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

    watch(stateInnerRef => {
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
