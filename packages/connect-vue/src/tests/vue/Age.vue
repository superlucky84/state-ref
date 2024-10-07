<script setup lang="ts">
import { useProfileRef } from '../store/store';

const ageRef = useProfileRef<number>(stateRef => stateRef.age);

const incrementFromage = () => {
  ageRef.value += 1;
};
</script>

<template>
  <button @click="incrementFromage">
    age: {{ ageRef.value }}
  </button>
</template>
