<script setup lang="ts">
import { useProfileRef } from '../store/store';
import { defineProps, ref } from 'vue';

import Age from './Age.vue';
import AgeUnmountable from './AgeUnmountable.vue';

const mountedRef = ref(true);
const props = defineProps({ mockFn: Function });

const ageRef = useProfileRef<number>(stateRef => stateRef.age);

const incrementFromage = () => {
  ageRef.value += 1;
};
const changeUnmount = () => {
  mountedRef.value = false;
};
</script>

<template>
  <div>
    <button data-testid="unmount" @click="changeUnmount">unmount</button>
    <Age />
    <AgeUnmountable v-if="mountedRef" :mockFn="props.mockFn" />
  </div>
</template>
