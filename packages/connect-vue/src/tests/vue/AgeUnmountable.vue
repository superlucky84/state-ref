<script setup lang="ts">
import { useProfileRef } from '../store/store';
import { onUpdated, defineProps } from 'vue';

const props = defineProps({ mockFn: Function });

const ageRef = useProfileRef<number>(stateRef => stateRef.age);

onUpdated(() => {
  if (props.mockFn) {
    props.mockFn();
  }
});
</script>

<template>
  <button>
    age: {{ ageRef.value }}
  </button>
</template>
