<script setup lang="ts">
import { fromState } from '@/index';
import { connectWithVueA } from '@/connectSnippetExamples/vue/vue-latest';

type Profile = { name: { a: string; b: string }; age: number };
const capture = fromState<Profile>({
  name: { a: 'brown', b: 'jain' },
  age: 13,
});
const useProfileRef = connectWithVueA(capture);

// @ts-ignore
window.p = capture();

const profile = useProfileRef<Profile>(store => store);

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
