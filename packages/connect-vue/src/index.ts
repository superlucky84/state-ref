import {
  reactive,
  watch,
  onUnmounted,
  shallowRef,
  readonly,
  customRef,
} from 'vue';
import type { Reactive, UnwrapRef, Ref, ShallowRef } from 'vue';
import { cloneDeep } from 'state-ref';
import type { Renew, StateRefStore, Watch } from 'state-ref';
// import { cloneDeep } from 'state-ref';
// import type { StateRefStore, Watch } from 'state-ref';

export type ViewWatch<R> = (
  renew?: Renew<R>,
  option?: { cache?: boolean }
) => R;

/** One-way Vue value for a readonly query view. */
export function connectVueView<R>(viewWatch: ViewWatch<R>) {
  return <V>(select: (ref: R) => V): Readonly<Ref<V>> => {
    // See `connectVue`: a server render has no unmount to release a
    // subscription, so it reads without making one.
    if (typeof window === 'undefined') {
      const serverRef = viewWatch();
      // A custom getter avoids caching a value read before server prefetch.
      // customRef is also available throughout our Vue 3 peer range.
      return readonly(
        customRef<V>(() => ({
          get: () => select(serverRef),
          set: () => {},
        }))
      ) as Readonly<Ref<V>>;
    }
    const abortController = new AbortController();
    let valueRef!: ShallowRef<V>;
    onUnmounted(() => abortController.abort());
    viewWatch((ref, first) => {
      const value = select(ref);
      if (valueRef) valueRef.value = value;
      else valueRef = shallowRef(value) as ShallowRef<V>;
      if (first) return abortController.signal;
      return undefined;
    });
    return readonly(valueRef) as Readonly<Ref<V>>;
  };
}

/**
 * Vue V3
 */
export function connectVue<T>(refWatch: Watch<T>) {
  return <V>(
    callback: (store: StateRefStore<T>) => StateRefStore<V>
  ): Reactive<{ value: V }> => {
    type J = Reactive<{ value: V }>;
    /**
     * `onUnmounted` does not run during a server render, so a subscription
     * made there can outlive the request if the store is shared. Reading
     * without a renew produces the same markup and subscribes to nothing.
     */
    if (typeof window === 'undefined') {
      const serverRef = refWatch();
      return reactive({
        get value() {
          return callback(serverRef).value;
        },
        set value(value: V) {
          callback(serverRef).value = value;
        },
      }) as J;
    }
    const abortController = new AbortController();
    let reactiveValue!: J;
    let stateRef!: StateRefStore<V>;
    let changing = false;
    const change = (cb: () => void) => {
      changing = true;
      cb();
      queueMicrotask(() => (changing = false));
    };

    onUnmounted(() => {
      abortController.abort();
    });

    refWatch(stateInnerRef => {
      stateRef = callback(stateInnerRef);

      if (!reactiveValue) {
        /**
         * Creating the reactive is not an echo of anything, so it must not arm
         * the guard. It used to: the guard then stayed up until a microtask
         * ran, and any store write landing in the same turn as the component's
         * mount was dropped without a sound (`CI-25`).
         */
        reactiveValue = reactive({ value: stateRef.value }) as J;
      } else if (reactiveValue.value !== stateRef.value) {
        /**
         * Whether to update or to create is decided by whether the reactive
         * exists - not by whether its current value is truthy. On a store
         * sitting at `0`, `''`, `false` or `null`, the truthiness test took the
         * create branch on every update and replaced the object the template
         * was bound to, leaving the component wired to an orphan (`CI-26`).
         *
         * This branch deliberately does NOT ask whether the guard is up. The
         * guard's job is to stop the write-back below from echoing, and it
         * clears only on a microtask; asking about it here made the *second*
         * store write of a turn vanish, so a selection covering several leaves
         * stayed one write behind forever (`CI-29`, found in the browser by
         * Phase 8.8 - the Vue demo's operation card showed the previous
         * operation, always). Re-arming on each inbound update keeps the guard
         * up at least as long as before, so the write-back is no less
         * protected. It cannot be dropped instead: `reactive` hands the
         * template a proxy of the value, so the write-back's own equality test
         * does not recognise what this assignment just stored and would copy a
         * clone back over the store.
         */
        change(() => {
          reactiveValue.value = stateRef.value as UnwrapRef<V>;
        });
      }

      return abortController.signal;
    });

    watch(reactiveValue, newValues => {
      if (stateRef.value !== newValues.value && !changing) {
        const newV =
          typeof newValues.value === 'object'
            ? cloneDeep(newValues.value)
            : newValues.value;

        change(() => {
          stateRef.value = newV as V;
        });
      }
    });

    return reactiveValue;
  };
}
