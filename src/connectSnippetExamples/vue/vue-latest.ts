import { reactive, watch, onUnmounted } from 'vue';
import type { Reactive, UnwrapRef } from 'vue';
import { cloneDeep } from '@/index';
import type { ShelfStore, Subscribe } from '@/index';
// import { cloneDeep } from 'lenshelf';
// import type { ShelfStore, Subscribe } from 'lenshelf';

/**
 * Vue V3
 */
export function connectShelfWithVue<T>(subscribe: Subscribe<T>) {
  return <V>(
    callback: (store: ShelfStore<T>) => ShelfStore<V>
  ): Reactive<{ value: V }> => {
    type J = Reactive<{ value: V }>;
    const abortController = new AbortController();
    let vueRefs!: J;
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

    subscribe(shelfStore => {
      shelf = callback(shelfStore);
      if (vueRefs?.value !== shelf.value && !changing) {
        change(() => {
          if (vueRefs?.value) {
            vueRefs.value = shelf.value as UnwrapRef<V>;
          } else {
            vueRefs = reactive({ value: shelf.value }) as J;
          }
        });
      }

      return abortController.signal;
    });

    watch(vueRefs, newValues => {
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

    return vueRefs;
  };
}
