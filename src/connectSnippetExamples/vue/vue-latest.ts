import { reactive, watch, onUnmounted } from 'vue';
import type { Reactive, UnwrapRef } from 'vue';
import { cloneDeep } from '@/index';
import type { ShelfStore, Take } from '@/index';
// import { cloneDeep } from 'lenshelf';
// import type { ShelfStore, Take } from 'lenshelf';

/**
 * Vue V3
 */
export function connectShelfWithVue<T>(take: Take<T>) {
  return <V>(
    callback: (store: ShelfStore<T>) => ShelfStore<V>
  ): Reactive<{ value: V }> => {
    type J = Reactive<{ value: V }>;
    const abortController = new AbortController();
    let reactiveValue!: J;
    let shelf!: ShelfStore<V>;
    let changing = false;
    const change = (cb: () => void) => {
      changing = true;
      cb();
      queueMicrotask(() => (changing = false));
    };

    onUnmounted(() => {
      abortController.abort();
    });

    take(shelfStore => {
      shelf = callback(shelfStore);
      if (reactiveValue?.value !== shelf.value && !changing) {
        change(() => {
          if (reactiveValue?.value) {
            reactiveValue.value = shelf.value as UnwrapRef<V>;
          } else {
            reactiveValue = reactive({ value: shelf.value }) as J;
          }
        });
      }

      return abortController.signal;
    });

    watch(reactiveValue, newValues => {
      if (shelf.value !== newValues.value && !changing) {
        const newV =
          typeof newValues.value === 'object'
            ? cloneDeep(newValues.value)
            : newValues.value;

        change(() => {
          shelf.value = newV as V;
        });
      }
    });

    return reactiveValue;
  };
}
