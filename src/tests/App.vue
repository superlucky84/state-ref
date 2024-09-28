<script setup>
import { ref, watchEffect, onMounted, onUnmounted } from 'vue';
import lenshelf from '@/index';

const subscribe = lenshelf({
  name: 'brown',
  age: 13,
});

// @ts-ignore
window.p = subscribe();


const useShelf = (callback, watcher) => {
  const abortController = new AbortController();

  onUnmounted(() => {
    abortController.abort();
  });

  return subscribe(shelf => {
    callback(shelf);

    return abortController.signal;
  });
};

const name = ref('');
const age = ref('');

const { name: n, age: a } = useShelf(({ name: n, age: a }) => {
  name.value = n.value;
  age.value = a.value;
});

const increment = () => {
  a.value += 1;
};


</script>

<template>
  <button @click="increment">Count is: {{ name }} {{ age }}</button>
</template>
