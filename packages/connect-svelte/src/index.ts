import { onDestroy } from 'svelte';
import { writable } from 'svelte/store';
import type { Readable, Writable } from 'svelte/store';
import { cloneDeep } from 'state-ref';
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
 * Report an error the way an uncaught one would be reported, without letting it
 * escape into the caller's stack. `reportError` is the platform primitive for
 * exactly this; where it is missing an `error` event carries the same meaning,
 * and the timer is the last resort off the DOM.
 */
function reportRefusal(error: unknown) {
  const host = globalThis as typeof globalThis & {
    reportError?: (value: unknown) => void;
    ErrorEvent?: typeof ErrorEvent;
    dispatchEvent?: (event: Event) => boolean;
  };
  if (typeof host.reportError === 'function') {
    host.reportError(error);
    return;
  }
  if (
    typeof host.ErrorEvent === 'function' &&
    typeof host.dispatchEvent === 'function'
  ) {
    host.dispatchEvent(
      new host.ErrorEvent('error', {
        error,
        message: error instanceof Error ? error.message : String(error),
      })
    );
    return;
  }
  setTimeout(() => {
    throw error;
  }, 0);
}

/**
 * What Svelte is handed of a store value: a copy for objects and arrays.
 *
 * `$store.field = value` is Svelte's own syntax and compiles to a mutation of
 * the store's current value followed by `store.set(value)`. Handing Svelte the
 * store's internal object made that mutation land inside the store with no
 * write and no notification, and the `set` then looked like "no change"
 * (F-S5). A copy keeps the store untouched until the `set` arrives, which is
 * then an ordinary write with a correct `before` (DC-CN-04: a write that
 * passes through the connector reaches the store).
 */
function copied<V>(value: V): V {
  return value !== null && typeof value === 'object' ? cloneDeep(value) : value;
}

/**
 * Structural equality for the plain data a store holds. The write-back uses it
 * to tell Svelte handing a value back unchanged from a real write: Svelte
 * queues a `set` made while it is notifying, so a flag raised around the
 * connector's own delivery is already down by the time that delivery reaches
 * the write-back, and an identity test cannot work either - `$store.x = y`
 * mutates the very copy the connector delivered.
 */
function sameData(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    a === null ||
    b === null ||
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    Array.isArray(a) !== Array.isArray(b)
  )
    return false;
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  if (keys.length !== Object.keys(right).length) return false;
  return keys.every(
    key =>
      Object.prototype.hasOwnProperty.call(right, key) &&
      sameData(left[key], right[key])
  );
}

/**
 * Svelte 4 and 5 (the store API; `$store` works in both).
 */
export function connectSvelte<T>(watch: Watch<T>) {
  return <V>(callback: (store: StateRefStore<T>) => StateRefStore<V>) => {
    const abortController = new AbortController();
    let signalValue!: Writable<V>;
    let stateRef!: StateRefStore<V>;
    let release: (() => void) | null = null;

    onDestroy(() => {
      abortController.abort();
      /**
       * Svelte cleans up the `$store` reads a component's markup makes, but not
       * a `subscribe` the connector called itself. Without this the write-back
       * outlives the component and a later `set` still reaches the source -
       * the one teardown of the five that had no owner.
       */
      release?.();
      release = null;
    });

    const deliver = (value: V) => {
      if (signalValue) signalValue.set(value);
      else signalValue = writable(value);
    };

    watch(stateInnerRef => {
      stateRef = callback(stateInnerRef);
      deliver(copied(stateRef.value as V));
      return abortController.signal;
    });

    release = signalValue.subscribe(newValue => {
      /**
       * Nothing in here may throw into Svelte's flush. A subscriber that
       * throws leaves the global subscriber queue unflushed, and every store
       * in the application then stops notifying - silently, including stores
       * created afterwards. The write can legitimately be refused (a
       * discarded draft, a disposed or readonly query), so it is reported the
       * way an uncaught error would be instead.
       */
      try {
        if (!sameData(stateRef.value, newValue)) stateRef.value = newValue;
      } catch (error) {
        reportRefusal(error);
      }
    });

    return signalValue;
  };
}
