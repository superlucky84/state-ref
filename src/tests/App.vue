<script setup>
import { ref, watchEffect, watch, onMounted, onUnmounted } from 'vue';
import lenshelf from '@/index';

const subscribe = lenshelf({
  name: 'brown',
  age: 13,
});

// @ts-ignore
window.p = subscribe();

const useShelf = callback => {
  const abortController = new AbortController();
  const vueRefs = [];
  let shelves = [];

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

  vueRefs.push(
    ...shelves.map(shelfItem => {
      return ref(shelfItem.value);
    })
  );

  watch(vueRefs, (newValues) => {
    newValues.forEach((newValueItem, index) => {
      if (shelves[index].value !== newValueItem) {
        shelves[index].value = newValueItem;
      }
    });
  });

  return [...vueRefs];
};

const [name, age] = useShelf(({ name, age }) => {
  return [name, age];
});

console.log(name, age);

const increment = () => {
  age.value += 1;
};
</script>

<template>
  <button @click="increment">Count is: {{ name }} {{ age }}</button>
</template>
