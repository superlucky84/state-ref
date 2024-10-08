<script setup lang="ts">
import { createStore } from 'state-ref';
import { connectVue } from '@/index';

type Profile = { name: { a: string; b: string }; age: number };
const watch = createStore<Profile>({
  name: { a: 'brown', b: 'jain' },
  age: 13,
});
const useProfileRef = connectVue(watch);

// @ts-ignore
window.p = watch();

const profile = useProfileRef<Profile>(store => store);

const incrementFromProfile = () => {
  profile.value.age += 1;
};
</script>

<template>
  <button @click="incrementFromProfile">
    {{ profile.value.name.a }} Count is: {{ profile.value.age }}
  </button>
</template>
