<script setup lang="ts">
import { useBoardRef, boardRef } from '@/tests/store/boardStore';

const titleRef = useBoardRef<string>(stateRef => stateRef.title);

/** A store write in the same turn as this component's own mount. */
boardRef.title.value = 'written at mount';
</script>

<template>
  <div data-testid="mount-title">{{ titleRef.value }}</div>
</template>
