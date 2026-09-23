<script setup lang="ts">
import { computed } from 'vue';
import { connectVue } from '@stateref/connect-vue';
import { resourcePanel } from 'stateref-example-shared';
import { model } from './demo-model';
import ChangesTable from './ChangesTable.vue';
import ResourceValues from './ResourceValues.vue';

const props = defineProps<{ title: string; which: 'a' | 'b' }>();
const handle = props.which === 'a' ? model.panelA : model.panelB;
const status = connectVue(handle.watchStatus)(store => store);
const panel = computed(() =>
  resourcePanel(status.value, status.value.loaded ? handle.changes() : [])
);
</script>

<template>
  <section class="card">
    <h2>{{ props.title }}</h2>
    <p v-if="!panel.loaded" class="note">
      {{
        panel.status === 'error'
          ? `오류: ${panel.errorText}`
          : '아직 로드되지 않았다. 여기에 가짜 성공 값을 보이지 않는다.'
      }}
    </p>
    <ResourceValues v-else :which="props.which" />
    <div class="row">
      <span>status / fetch</span>
      <b>{{ panel.status }} / {{ panel.fetchStatus }}</b>
    </div>
    <div class="row">
      <span>dirty (로컬 차이)</span>
      <b :class="panel.dirty ? 'flag-on' : 'flag-off'">{{ panel.dirty }}</b>
    </div>
    <div class="row">
      <span>serverBusy (진행 중 WRITE)</span>
      <b :class="panel.serverBusy ? 'flag-on' : 'flag-off'">
        {{ panel.serverBusy }}
      </b>
    </div>
    <div class="row">
      <span>unconfirmed (미확정)</span>
      <b :class="panel.unconfirmed ? 'flag-on' : 'flag-off'">
        {{ panel.unconfirmed }}
      </b>
    </div>
    <div class="row">
      <span>invalidated</span>
      <b :class="panel.invalidated ? 'flag-on' : 'flag-off'">
        {{ panel.invalidated }}
      </b>
    </div>
    <div class="row">
      <span>version / conflicts</span>
      <b>{{ panel.version }} / {{ panel.conflicts }}</b>
    </div>
    <ChangesTable :rows="panel.changes" />
  </section>
</template>
