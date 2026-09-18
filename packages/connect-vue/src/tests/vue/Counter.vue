<script setup lang="ts">
import { useCounterRef, counterRef } from '@/tests/store/boardStore';

const countRef = useCounterRef<number>(stateRef => stateRef.count);

const bumpFromStore = () => (counterRef.count.value = counterRef.count.value + 1);
</script>

<template>
  <div>
    <div data-testid="counter-value">{{ countRef.value }}</div>
    <button data-testid="counter-bump" @click="bumpFromStore">bump</button>
  </div>
</template>
