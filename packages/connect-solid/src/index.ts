import { createSignal, onCleanup } from 'solid-js';
import { isServer } from 'solid-js/web';
import type { Accessor, Setter, Signal } from 'solid-js';
import { cloneDeep } from 'state-ref';
import type { Renew, StateRefStore, Watch } from 'state-ref';

export type ViewWatch<R> = (
  renew?: Renew<R>,
  option?: { cache?: boolean }
) => R;

/** One-way Solid accessor for a readonly query view. */
export function connectSolidView<R>(viewWatch: ViewWatch<R>) {
  return <V>(select: (ref: R) => V): Accessor<V> => {
    // See `connectSolid`: a server render has no cleanup to release a
    // subscription, so it reads without making one.
    if (isServer) {
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

function deepFreeze<V>(value: V): V {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}

/**
 * What the accessor hands out: a frozen copy for objects and arrays.
 *
 * `value().city = 'x'`, or a functional update that mutates `prev` and returns
 * it, does not pass through the connector, so it could only change the store
 * behind its back (F-SO3). A frozen copy refuses both with a TypeError. Write
 * through the setter with a new value instead (DC-CN-04).
 */
function shown<V>(value: V): V {
  return value !== null && typeof value === 'object'
    ? deepFreeze(cloneDeep(value))
    : value;
}

/**
 * Solid 1.
 *
 * The accessor is a signal the store subscription feeds; reads go through the
 * subscribed state-ref reference, so the paths a component reads are the ones
 * it follows. The setter writes the store directly and synchronously. The
 * previous version copied the signal back into the store from a
 * `createEffect`, which Solid advises against for syncing state and which the
 * Solid 2 effect model changes (DC-CN-06).
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
    if (isServer) {
      const serverRef = callback(watch());
      return createSignal<V>(shown(serverRef.value as V));
    }
    const abortController = new AbortController();
    let stateRef!: StateRefStore<V>;
    let signal!: Signal<V>;

    onCleanup(() => {
      abortController.abort();
    });

    watch(stateInnerRef => {
      stateRef = callback(stateInnerRef);
      const next = shown(stateRef.value as V);
      if (signal) signal[1](() => next);
      else signal = createSignal<V>(next, { equals: false });
      return abortController.signal;
    });

    const set = ((next: V | ((prev: V) => V)) => {
      const value =
        typeof next === 'function'
          ? (next as (prev: V) => V)(signal[0]())
          : next;
      // Once the owner is gone the setter writes nowhere, the same contract
      // the other connectors keep after unmount.
      if (!abortController.signal.aborted) stateRef.value = value;
      return value;
    }) as Setter<V>;

    return [signal[0], set];
  };
}
