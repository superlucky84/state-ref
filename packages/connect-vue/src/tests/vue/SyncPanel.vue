<script setup lang="ts">
import type { Watch } from 'state-ref';
import type { DraftStatus } from 'state-ref/draft';
import { connectVue } from '@/index';

type Address = { city: string; zip: string };

const props = defineProps<{
  sourceWatch: Watch<Address>;
  branchWatch: Watch<Address>;
  statusWatch: Watch<DraftStatus>;
  onSelect?: () => void;
}>();

const source = connectVue(props.sourceWatch)(store => {
  props.onSelect?.();
  return store.city;
});
const branch = connectVue(props.branchWatch)(store => store.city);
const conflicts = connectVue(props.statusWatch)(store => store.conflicts);
</script>

<template>
  <div>
    <span data-testid="source">{{ source.value }}</span>
    <span data-testid="branch">{{ branch.value }}</span>
    <span data-testid="conflicts">{{ conflicts.value }}</span>
    <button data-testid="edit-branch" @click="branch.value = '대전'" />
    <button data-testid="edit-source" @click="source.value = '광주'" />
  </div>
</template>
