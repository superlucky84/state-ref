<script setup lang="ts">
import { useProfileRef, useComputedRef } from '../store/store';

const ageRef = useProfileRef<number>(stateRef => stateRef.age);
const computedRef = useComputedRef(storeRef => storeRef);

const incrementFromage = () => {
  ageRef.value += 1;
  
};
</script>

<template>
  <div>
    <div data-testid="age-display">age: {{ ageRef.value }}</div>
    <div data-testid="computed-display">age: {{ computedRef.value }}</div>
    <button data-testid="age-increase" @click="incrementFromage">
      increase
    </button>
  </div>
</template>
