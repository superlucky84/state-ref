<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import lenshelf from '@/index';
import type { ShelfStore, Subscribe } from '@/index';

function createVueShelfHook<T>(subscribe: Subscribe<T>) {
  const useShelf = (callback: (store: ShelfStore<T>) => ShelfStore<T>[]) => {
    const abortController = new AbortController();
    const vueRefs: ShelfStore<T>[] = [];
    let shelves: ShelfStore<T>[] = [];

    onUnmounted(() => {
      abortController.abort();
    });

    subscribe(shelf => {
      shelves = callback(shelf);
      if (vueRefs.length) {
        vueRefs.forEach((refItem, index) => {
          if (refItem.value !== shelves[index].value) {
            refItem.value !== shelves[index].value;
          }
        });
      }

      return abortController.signal;
    });

    vueRefs.push(...shelves.map(shelfItem => ref(shelfItem.value)));

    watch(vueRefs, newValues => {
      newValues.forEach((newValueItem, index) => {
        if (shelves[index].value !== newValueItem) {
          shelves[index].value = newValueItem;
        }
      });
    });

    return [...vueRefs];
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

const [name, age] = useProfileShelf(({ name, age }) => {
  return [name, age];
});

const increment = () => {
  age.value += 1;
};
</script>

<template>
  <button @click="increment">Count is: {{ name }} {{ age }}</button>
</template>
