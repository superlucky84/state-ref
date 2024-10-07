<script setup lang="ts">
import { useProfileRef } from '../store/store';
import { onUpdated, defineProps } from 'vue';

const props = defineProps({ mockFn: Function });

const nameRef = useProfileRef<string>(stateRef => stateRef.name);

onUpdated(() => {
  if (props.mockFn) {
    props.mockFn();
  }
});

const changeName = () => {
  nameRef.value += ' james';
};
</script>

<template>
  <button @click="changeName" data-testid="name-display">
    name: {{ nameRef.value }}
  </button>
</template>
