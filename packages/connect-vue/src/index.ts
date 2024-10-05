import { reactive, watch, onUnmounted } from 'vue';
import type { Reactive, UnwrapRef } from 'vue';
import { cloneDeep } from 'state-ref';
import type { StateRefStore, Capture } from 'state-ref';
// import { cloneDeep } from 'state-ref';
// import type { StateRefStore, Capture } from 'state-ref';

/**
 * Vue V3
 */
export function connectWithVueA<T>(capture: Capture<T>) {
  return <V>(
    callback: (store: StateRefStore<T>) => StateRefStore<V>
  ): Reactive<{ current: V }> => {
    type J = Reactive<{ current: V }>;
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

    capture(stateInnerRef => {
      stateRef = callback(stateInnerRef);
      if (reactiveValue?.current !== stateRef.current && !changing) {
        change(() => {
          if (reactiveValue?.current) {
            reactiveValue.current = stateRef.current as UnwrapRef<V>;
          } else {
            reactiveValue = reactive({ current: stateRef.current }) as J;
          }
        });
      }

      return abortController.signal;
    });

    watch(reactiveValue, newValues => {
      if (stateRef.current !== newValues.current && !changing) {
        const newV =
          typeof newValues.current === 'object'
            ? cloneDeep(newValues.current)
            : newValues.current;

        change(() => {
          stateRef.current = newV as V;
        });
      }
    });

    return reactiveValue;
  };
}
