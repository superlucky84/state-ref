<script setup lang="ts">
import { fromState } from 'state-ref';
import { connectWithVueA } from '@/index';

type Profile = { name: { a: string; b: string }; age: number };
const capture = fromState<Profile>({
  name: { a: 'brown', b: 'jain' },
  age: 13,
});
const useProfileRef = connectWithVueA(capture);

// @ts-ignore
window.p = capture();

const profile = useProfileRef<Profile>(store => store);

console.log('PROFILE', profile.current);

const incrementFromProfile = () => {
  profile.current.age += 1;
};
</script>

<template>
  <button @click="incrementFromProfile">
    {{ profile.current.name.a }} Count is: {{ profile.current.age }}
  </button>
</template>
