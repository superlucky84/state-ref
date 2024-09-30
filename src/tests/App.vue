<script setup lang="ts">
import { ref, Ref, watch, onUnmounted } from 'vue';
import lenshelf from '@/index';
import type { ShelfStore, Subscribe } from '@/index';

function createVueShelfHook<T>(subscribe: Subscribe<T>) {
  const useShelf = (callback: (store: ShelfStore<T>) => ShelfStore<T>) => {
    const abortController = new AbortController();
    let vueRefs: Ref<T> = {} as Ref<T>;
    let shelf: ShelfStore<T> = {} as ShelfStore<T>;

    onUnmounted(() => {
      abortController.abort();
    });

    subscribe(shelf => {
      shelf = callback(shelf);
      if (vueRefs) {
        vueRefs.value = shelf.value as T;
      }

      return abortController.signal;
    });

    vueRefs.value = shelf.value as T;

    watch(vueRefs, newValues => {
      shelf.value = newValues;
    });

    return vueRefs;
  };

  return useShelf;
}

const subscribe = lenshelf({
  name: 'brown',
  age: 13,
});
const useProfileShelf = createVueShelfHook(subscribe);

// @ts-ignore
window.p = subscribe();

const age = useProfileShelf(store => {
  return store.age;
});

const increment = () => {
  age.value += 1;
};
</script>

<template>
  <button @click="increment">Count is: {{ age }}</button>
</template>
