import { createSubscriber } from 'svelte/reactivity';
import { cloneDeep } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';

/** A selection read and written through `.value`, reactive under runes. */
export type RunesSelection<V> = { value: V };

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
 * What a reader is handed: a frozen copy for objects and arrays.
 *
 * A nested mutation (`address.value.city = 'x'`) does not pass through the
 * connector, so it could only change the store behind its back. A frozen copy
 * refuses it - a TypeError in the strict code Svelte compiles - and leaves the
 * store untouched. Write through `.value` instead (DC-CN-04).
 */
function shown<V>(value: V): V {
  return value !== null && typeof value === 'object'
    ? deepFreeze(cloneDeep(value))
    : value;
}

/**
 * Svelte 5 runes.
 *
 * `createSubscriber` subscribes to the store while something reactive - a
 * template, an `$effect`, a `$derived` - reads `.value`, and releases when the
 * last reader goes away. Reads go through the subscribed state-ref reference,
 * so state-ref collects exactly the paths that were read, and a change to one
 * of them re-runs those readers. Outside any reactive context (a plain
 * function, a server render) `.value` reads the live store without
 * subscribing. Assigning `.value` writes the store synchronously.
 *
 * Unlike the store API it is not tied to a component: a selection made at
 * module level works too, and writes through it always reach the store.
 */
export function connectSvelteRunes<T>(watch: Watch<T>) {
  return <V>(
    select: (store: StateRefStore<T>) => StateRefStore<V>
  ): RunesSelection<V> => {
    let subscribed: StateRefStore<V> | null = null;
    const track = createSubscriber(update => {
      const controller = new AbortController();
      subscribed = select(
        watch((_, isFirst) => {
          if (!isFirst) update();
          return controller.signal;
        })
      );
      return () => {
        controller.abort();
        subscribed = null;
      };
    });
    const target = () => subscribed ?? select(watch());

    return {
      get value(): V {
        track();
        return shown(target().value as V);
      },
      set value(value: V) {
        target().value = value;
      },
    };
  };
}
