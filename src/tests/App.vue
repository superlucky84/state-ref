<script setup>
import { ref, watchEffect, onMounted, onUnmounted } from 'vue';
import lenshelf from '@/index';

const subscribe = lenshelf({
  name: 'brown',
  age: 13,
});

// @ts-ignore
window.p = subscribe();

// reactive state
const name = ref('');
const age = ref('');


const useShelf = (callback) => {
  const abortController = new AbortController();

  subscribe(shelf => {
    callback(shelf);

    return abortController.signal;
  });

  onUnmounted(() => {
    abortController.abort();
  });
};

useShelf(({ name: n, age: a }) => {
  name.value = n.value;
  age.value = a.value;
});


</script>

<template>
  <button @click="increment">Count is: {{ name }} {{ age }}</button>
</template>
