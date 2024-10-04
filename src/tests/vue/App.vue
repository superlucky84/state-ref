<script setup lang="ts">
import { lenshelf } from '@/index';
import { connectShelfWithVue } from '@/connectSnippetExamples/vue/vue-latest';

type Profile = { name: { a: string; b: string }; age: number };
const take = lenshelf<Profile>({
  name: { a: 'brown', b: 'jain' },
  age: 13,
});
const useProfileShelf = connectShelfWithVue(take);

// @ts-ignore
window.p = take();

const profile = useProfileShelf(store => store);

console.log('PROFILE', profile.value);

const incrementFromProfile = () => {
  profile.value.age += 1;
};
</script>

<template>
  <button @click="incrementFromProfile">
    {{ profile.value.name.a }} Count is: {{ profile.value.age }}
  </button>
</template>
