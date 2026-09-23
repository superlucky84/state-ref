<script setup lang="ts">
import { connectVue } from '@stateref/connect-vue';
import { model } from './demo-model';

/**
 * Mounted only after `status.loaded`, because `query.watch` throws before the
 * first load. Unlike React/Preact the Vue connector selects a leaf, so each
 * field gets its own reactive value.
 */
const props = defineProps<{ which: 'a' | 'b' }>();
const source = connectVue(
  props.which === 'a' ? model.panelA.watch : model.panelB.watch
);
const city = source(store => store.city);
const zip = source(store => store.zip);
const memo = source(store => store.memo);
const contacts = source(store => store.contacts);
const office = source(store => store.office);
</script>

<template>
  <div class="row">
    <span>도시</span>
    <input v-model="city.value" />
  </div>
  <div class="row">
    <span>우편번호</span><b>{{ zip.value }}</b>
  </div>
  <div class="row">
    <span>메모</span><b>{{ memo.value }}</b>
  </div>
  <div class="row">
    <span>연락처</span>
    <b>{{ contacts.value.map(contact => contact.name).join(',') }}</b>
  </div>
  <div class="row">
    <span>사무실</span>
    <b>{{ office.value ?? '(없음)' }}</b>
  </div>
</template>
