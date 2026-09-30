<script setup lang="ts">
import { connectVue } from '@stateref/connect-vue';
import { model } from './demo-model';
import Row from './Row.vue';

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
  <Row field="city">
    <input v-model="city.value" />
  </Row>
  <Row field="zip" :value="zip.value" />
  <Row field="memo" :value="memo.value" />
  <Row
    field="contacts"
    :value="contacts.value.map(contact => contact.name).join(',')"
  />
  <Row field="office" :value="office.value ?? '(없음)'" />
</template>
