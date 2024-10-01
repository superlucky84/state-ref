<script setup lang="ts">
import lenshelf from '@/index';
import { connectShelfWithVue } from '@/connectSnippetExamples/vue/vue-v3';

const subscribe = lenshelf<{ name: string; age: number }>({
  name: 'brown',
  age: 13,
});
const useProfileShelf = connectShelfWithVue(subscribe);

// @ts-ignore
window.p = subscribe();

const age = useProfileShelf<number>(store => store.age);
const name = useProfileShelf<string>(store => store.name);

const increment = () => {
  age.value += 1;
};
</script>

<template>
  <button @click="increment">{{ name }} Count is: {{ age }}</button>
</template>
