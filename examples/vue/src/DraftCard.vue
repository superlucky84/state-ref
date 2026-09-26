<script setup lang="ts">
import { computed } from 'vue';
import { connectVue } from '@stateref/connect-vue';
import { CARD_TITLE, draftPanel } from 'stateref-example-shared';
import type { CardId, Profile } from 'stateref-example-shared';
import type { Draft } from 'state-ref/draft';
import ChangesTable from './ChangesTable.vue';
import Flag from './Flag.vue';
import Row from './Row.vue';

const props = defineProps<{
  card: Extract<CardId, 'draft-a' | 'draft-b'>;
  draft: Draft<Profile>;
}>();
const value = connectVue(props.draft.watch);
const city = value(store => store.city);
const zip = value(store => store.zip);
const status = connectVue(props.draft.watchStatus)(store => store);
const panel = computed(() => draftPanel(status.value, props.draft.changes()));
</script>

<template>
  <section class="card" :data-card="props.card">
    <h2>{{ CARD_TITLE[props.card] }}</h2>
    <Row field="city">
      <input v-model="city.value" />
    </Row>
    <Row field="zip" :value="zip.value" />
    <Flag field="draftDirty" :on="panel.dirty" />
    <Row field="version" :value="`${panel.version} / ${panel.conflicts}`" />
    <ChangesTable :rows="panel.changes" />
  </section>
</template>
