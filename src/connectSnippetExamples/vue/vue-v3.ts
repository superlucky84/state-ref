import { ref, Ref, watch, onUnmounted } from 'vue';
import type { ShelfStore, Subscribe } from '@/index';
// import type { ShelfStore, Subscribe } from 'lenshelf';

export function connectShelfWithVue<T>(subscribe: Subscribe<T>) {
  return <V>(callback: (store: ShelfStore<T>) => ShelfStore<V>): Ref<V> => {
    const abortController = new AbortController();
    let vueRefs!: Ref<V>;
    let shelf!: ShelfStore<V>;

    onUnmounted(() => {
      abortController.abort();
    });

    watch(vueRefs, newValues => {
      shelf.value = newValues;
    });

    subscribe(shelfStore => {
      shelf = callback(shelfStore);
      if (vueRefs?.value) {
        vueRefs.value = shelf.value as V;
      } else {
        vueRefs = ref(shelf.value) as Ref<V>;
      }

      return abortController.signal;
    });

    return vueRefs;
  };
}
