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
    // See `connectSolid`: a server render has no cleanup to release a
    // subscription, so it reads without making one.
    if (typeof window === 'undefined') {
      const [value] = createSignal<V>(select(viewWatch()));
      return value;
    }
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
    /**
     * `onCleanup` does not run during a server render, so a subscription made
     * there can outlive the request if the store is shared. Reading without a
     * renew produces the same markup and subscribes to nothing.
     */
    if (typeof window === 'undefined') {
      const serverRef = callback(watch());
      return createSignal<V>(serverRef.value as V);
    }
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
