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
 * Svelte V4
 */
export function connectSvelte<T>(watch: Watch<T>) {
  return <V>(callback: (store: StateRefStore<T>) => StateRefStore<V>) => {
    const abortController = new AbortController();
    let signalValue!: Writable<V>;
    let stateRef!: StateRefStore<V>;
    let changing = false;
    let release: (() => void) | null = null;
    const change = (cb: () => void) => {
      changing = true;
      cb();
      changing = false;
    };

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

    release = signalValue.subscribe(newValue => {
      /**
       * Nothing in here may throw into Svelte's flush. A subscriber that throws
       * leaves the global subscriber queue unflushed, and every store in the
       * application then stops notifying - silently, including stores created
       * afterwards. Both halves can legitimately be refused: reading the ref of
       * a discarded draft or a disposed query throws just as writing one does,
       * so the guard covers the comparison too, not only the assignment. The
       * refusal still surfaces as an uncaught error, the way the other
       * connectors report the same thing.
       */
      try {
        if (stateRef.value !== newValue && !changing) {
          change(() => {
            stateRef.value = newValue;
          });
        }
      } catch (error) {
        reportRefusal(error);
      }
    });

    return signalValue;
  };
}
