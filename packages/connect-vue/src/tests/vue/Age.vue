<script setup lang="ts">
import { useProfileRef } from '../store/store';

const ageRef = useProfileRef<number>(stateRef => stateRef.age);

const incrementFromage = () => {
  ageRef.value += 1;
};
</script>

<template>
  <div>
    <div data-testid="age-display">age: {{ ageRef.value }}</div>
    <button data-testid="age-increase" @click="incrementFromage">
      increase
    </button>
  </div>
</template>
