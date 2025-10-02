<script setup lang="ts">
import { useCombindRef } from '../store/store';

const ageRef = useCombindRef(store => store[0].age);
const numRef = useCombindRef(store => store[1]);

</script>

<template>
  <div>
    <div data-testid="age-display">age: {{ ageRef.value }}</div>
    <div data-testid="num-display">num: {{ numRef.value }}</div>
  </div>
</template>
