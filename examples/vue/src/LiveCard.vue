<script setup lang="ts">
import { connectVueView } from '@stateref/connect-vue';
import { keyText } from 'stateref-example-shared';
import { model } from './demo-model';
import Row from './Row.vue';

/**
 * Mounted only while the live view is alive: a disposed view refuses every
 * access, the same way `query.watch` refuses before a first load. The parent
 * decides which of the two halves to show.
 */
const view = connectVueView(model.liveView.watch);
const key = view(ref => ref.queryKey.value);
const enabled = view(ref => ref.enabled.value);
const phase = view(ref => ref.phase.value);
const fetchStatus = view(ref => ref.fetchStatus.value);
const city = view(ref => ref.data.value?.city);
</script>

<template>
  <Row
    field="liveKey"
    :value="key === null ? '(없음)' : keyText(key as string[])"
  />
  <Row field="liveEnabled" :value="String(enabled)" />
  <Row field="livePhase" :value="`${phase} / ${fetchStatus}`" />
  <Row field="liveCity" :value="city ?? '(없음)'" />
</template>
