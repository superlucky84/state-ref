<script setup lang="ts">
import type { Watch } from 'state-ref';
import type { DraftStatus } from 'state-ref/draft';
import { connectVue } from '@/index';

type Address = { city: string; zip: string };

const props = defineProps<{
  sourceWatch: Watch<Address>;
  sharedWatch: Watch<Address>;
  leftWatch: Watch<Address>;
  rightWatch: Watch<Address>;
  rightStatusWatch: Watch<DraftStatus>;
}>();

const source = connectVue(props.sourceWatch)(store => store.city);
const shared = connectVue(props.sharedWatch)(store => store.city);
const left = connectVue(props.leftWatch)(store => store.city);
const right = connectVue(props.rightWatch)(store => store.city);
const rightConflicts = connectVue(props.rightStatusWatch)(
  store => store.conflicts
);
</script>

<template>
  <div>
    <span data-testid="source">{{ source.value }}</span>
    <span data-testid="shared">{{ shared.value }}</span>
    <span data-testid="left">{{ left.value }}</span>
    <span data-testid="right">{{ right.value }}</span>
    <span data-testid="right-conflicts">{{ rightConflicts.value }}</span>
    <button data-testid="edit-left" @click="left.value = '대전'" />
    <button data-testid="edit-right" @click="right.value = '광주'" />
  </div>
</template>
