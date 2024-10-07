<script setup lang="ts">
import { useProfileRef } from '../store/store';

const ageRef = useProfileRef<number>(stateRef => stateRef.age);

/*
<div>
  <Age />
  <AgeWithoutExtractingValue />
</div>
*/

const incrementFromage = () => {
  ageRef.value += 1;
};
</script>

<template>
  <button @click="incrementFromage">
    age: {{ ageRef.value }}
  </button>
</template>
