<script setup lang="ts">
import { computed } from 'vue';
import { connectVue } from '@stateref/connect-vue';
import { CARD_TITLE, resourcePanel } from 'stateref-example-shared';
import type { CardId } from 'stateref-example-shared';
import { model } from './demo-model';
import ChangesTable from './ChangesTable.vue';
import Flag from './Flag.vue';
import ResourceValues from './ResourceValues.vue';
import Row from './Row.vue';

const props = defineProps<{
  card: Extract<CardId, 'resource-a' | 'resource-b'>;
  which: 'a' | 'b';
}>();
const handle = props.which === 'a' ? model.panelA : model.panelB;
const status = connectVue(handle.watchStatus)(store => store);
const panel = computed(() =>
  resourcePanel(status.value, status.value.loaded ? handle.changes() : [])
);
</script>

<template>
  <section class="card" :data-card="props.card">
    <h2>{{ CARD_TITLE[props.card] }}</h2>
    <p v-if="!panel.loaded" class="note">
      {{
        panel.status === 'error'
          ? `오류: ${panel.errorText}`
          : '아직 로드되지 않았다. 여기에 가짜 성공 값을 보이지 않는다.'
      }}
    </p>
    <ResourceValues v-else :which="props.which" />
    <Row field="status" :value="`${panel.status} / ${panel.fetchStatus}`" />
    <Flag field="dirty" :on="panel.dirty" />
    <Flag field="serverBusy" :on="panel.serverBusy" />
    <Flag field="unconfirmed" :on="panel.unconfirmed" />
    <Flag field="invalidated" :on="panel.invalidated" />
    <Row field="version" :value="`${panel.version} / ${panel.conflicts}`" />
    <ChangesTable :rows="panel.changes" />
  </section>
</template>
