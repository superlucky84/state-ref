import { reactive, watch, onUnmounted } from 'vue';
import type { Reactive, UnwrapRef } from 'vue';
import { cloneDeep } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
// import { cloneDeep } from 'state-ref';
// import type { StateRefStore, Watch } from 'state-ref';

/**
 * Vue V3
 */
export function connectVue<T>(refWatch: Watch<T>) {
  return <V>(
    callback: (store: StateRefStore<T>) => StateRefStore<V>
  ): Reactive<{ value: V }> => {
    type J = Reactive<{ value: V }>;
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
      } else if (reactiveValue.value !== stateRef.value && !changing) {
        /**
         * Whether to update or to create is decided by whether the reactive
         * exists - not by whether its current value is truthy. On a store
         * sitting at `0`, `''`, `false` or `null`, the truthiness test took the
         * create branch on every update and replaced the object the template
         * was bound to, leaving the component wired to an orphan (`CI-26`).
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
