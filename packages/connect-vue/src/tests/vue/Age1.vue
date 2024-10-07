<script setup lang="ts">
import { useProfileRef } from '../store/store';

const ageRef = useProfileRef<number>(stateRef => stateRef.age);
</script>

<template>
  <div>
    <div data-testid="age-display1">age: {{ ageRef.value }}</div>
  </div>
</template>
