<script setup lang="ts">
import { ref, Ref, watch, onUnmounted } from 'vue';
import lenshelf from '@/index';
import type { ShelfStore, Subscribe } from '@/index';

function createVueShelfHook<T>(subscribe: Subscribe<T>) {
  const useShelf = <V>(
    callback: (store: ShelfStore<T>) => ShelfStore<V>
  ): Ref<V> => {
    const abortController = new AbortController();
    let vueRefs: Ref<V> = {} as Ref<V>;
    let shelf: ShelfStore<V> = {} as ShelfStore<V>;

    onUnmounted(() => {
      abortController.abort();
    });

    watch(vueRefs, newValues => {
      shelf.value = newValues;
    });

    subscribe(shelfStore => {
      shelf = callback(shelfStore);
      if (vueRefs.value) {
        vueRefs.value = shelf.value as V;
      } else {
        vueRefs = ref(shelf.value) as Ref<V>;
      }

      return abortController.signal;
    });

    vueRefs.value = shelf.value as V;

    return vueRefs;
  };

  return useShelf;
}

const subscribe = lenshelf<{ name: string; age: number }>({
  name: 'brown',
  age: 13,
});
const useProfileShelf = createVueShelfHook(subscribe);

// @ts-ignore
window.p = subscribe();

const age = useProfileShelf<number>(store => store.age);
const name = useProfileShelf<string>(store => store.name);

const increment = () => {
  age.value += 1;
}; </script>

<template>
  <button @click="increment">{{ name }} Count is: {{ age }}</button>
</template>
