<script setup>
import { ref, watchEffect, onMounted } from 'vue';
import lenshelf from '@/index';

const subscribe = lenshelf({
  name: 'brown',
  age: 13,
});

// @ts-ignore
window.p = subscribe();

function useForceUpdate() {
  const update = ref(0);

  const forceUpdate = (state, isFirst) => {
    console.log('jjj', isFirst);
    update.value += 1;
  };

  return [update, forceUpdate];
}

const useNumberShelf = () => {
  const [update, forceUpdate] = useForceUpdate();
  const shelf = subscribe(forceUpdate);
  
  // watchEffect로 상태 변화를 감지하여 업데이트합니다.
  watchEffect(() => {
    console.log('Shelf name or age changed:', shelf.name.value, shelf.age.value);
    forceUpdate();
  });

  return [shelf, update];
};
const [shelf, update] = useNumberShelf();

// reactive state
const count = ref(0);

// functions that mutate state and trigger updates
function increment() {
  count.value++;
}

// lifecycle hooks
onMounted(() => {
  console.log(`The initial count is ${count.value}.`);
});
</script>

<template>
  <button @click="increment">Count is: {{ count }} = {{ shelf.name.value }}</button>
</template>
