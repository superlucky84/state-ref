<script setup lang="ts">
import { lenshelf } from '@/index';
import { connectShelfWithVue } from '@/connectSnippetExamples/vue/vue-v3';

type Profile = { name: string; age: number };
const subscribe = lenshelf<Profile>({
  name: 'brown',
  age: 13,
});
const useProfileShelf = connectShelfWithVue(subscribe);

// @ts-ignore
window.p = subscribe();

const profile = useProfileShelf(store => store);

console.log('PROFILE', profile.value);

const incrementFromProfile = () => {
  profile.value.age += 1;
};
</script>

<template>
  <button @click="incrementFromProfile">
    {{ profile.value.name }} Count is: {{ profile.value.age }}
  </button>
</template>
