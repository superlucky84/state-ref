<script setup lang="ts">
import { usePairRef, pairRef } from '@/tests/store/boardStore';
import type { Pair } from '@/tests/store/boardStore';

const pair = usePairRef<Pair>(stateRef => stateRef);

/** Two leaves, one turn - what an operation that reports what it did does. */
const writeBoth = () => {
  pairRef.first.value = 'changed';
  pairRef.second.value = 'changed too';
};
</script>

<template>
  <div>
    <div data-testid="pair-first">{{ pair.value.first }}</div>
    <div data-testid="pair-second">{{ pair.value.second }}</div>
    <button data-testid="pair-write" @click="writeBoth">write both</button>
  </div>
</template>
