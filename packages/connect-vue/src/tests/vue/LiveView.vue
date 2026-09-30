<script setup lang="ts">
import type { QueryDisplayState, QueryDisplayWatch } from '@stateref/sync';
import { connectVueView } from '@/index';

const props = defineProps<{
  viewWatch: QueryDisplayWatch<QueryDisplayState<string>>;
  onSelect: () => void;
}>();
const display = connectVueView(props.viewWatch)(ref => {
  props.onSelect();
  return `${ref.queryKey.value?.[1]}:${ref.data.value}`;
});
</script>

<template>
  <span data-testid="live-view">{{ display }}</span>
</template>
