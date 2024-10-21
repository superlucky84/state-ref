<script setup lang="ts">
import { useProfileRef, changeAge } from '../store/manualStore';

const ageRef = useProfileRef<number>(stateRef => stateRef.age);

const incrementFromage = () => {
  // ageRef.value += 1;
  changeAge(99);
};
</script>

<template>
  <div>
    <div data-testid="age-display">age1: {{ ageRef.value }}</div>
    <button data-testid="age-increase" @click="incrementFromage">
      increase at action
    </button>
  </div>
</template>
