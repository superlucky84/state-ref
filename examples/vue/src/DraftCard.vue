<script setup lang="ts">
import { computed } from 'vue';
import { connectVue } from '@stateref/connect-vue';
import { draftPanel } from 'stateref-example-shared';
import type { Profile } from 'stateref-example-shared';
import type { Draft } from 'state-ref/draft';
import ChangesTable from './ChangesTable.vue';

const props = defineProps<{ title: string; draft: Draft<Profile> }>();
const value = connectVue(props.draft.watch);
const city = value(store => store.city);
const zip = value(store => store.zip);
const status = connectVue(props.draft.watchStatus)(store => store);
const panel = computed(() => draftPanel(status.value, props.draft.changes()));
</script>

<template>
  <section class="card">
    <h2>{{ props.title }}</h2>
    <div class="row">
      <span>도시</span>
      <input v-model="city.value" />
    </div>
    <div class="row">
      <span>우편번호</span><b>{{ zip.value }}</b>
    </div>
    <div class="row">
      <span>dirty</span>
      <b :class="panel.dirty ? 'flag-on' : 'flag-off'">{{ panel.dirty }}</b>
    </div>
    <div class="row">
      <span>version / conflicts</span>
      <b>{{ panel.version }} / {{ panel.conflicts }}</b>
    </div>
    <ChangesTable :rows="panel.changes" />
  </section>
</template>
