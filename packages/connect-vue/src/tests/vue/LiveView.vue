<script setup lang="ts">
import type { LiveQueryViewState, QueryViewWatch } from '@stateref/sync';
import { connectVueView } from '@/index';

const props = defineProps<{
  viewWatch: QueryViewWatch<LiveQueryViewState<string>>;
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
