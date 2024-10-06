import { reactive, watch, onUnmounted } from 'vue';
import type { Reactive, UnwrapRef } from 'vue';
import { cloneDeep } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
// import { cloneDeep } from 'state-ref';
// import type { StateRefStore, Watch } from 'state-ref';

/**
 * Vue V3
 */
export function connectWithVueA<T>(refWatch: Watch<T>) {
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
      if (reactiveValue?.value !== stateRef.value && !changing) {
        change(() => {
          if (reactiveValue?.value) {
            reactiveValue.value = stateRef.value as UnwrapRef<V>;
          } else {
            reactiveValue = reactive({ value: stateRef.value }) as J;
          }
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
