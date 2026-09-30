<script setup lang="ts">
import type { Watch } from 'state-ref';
import { connectVue } from '@/index';

type Address = { city: string; zip: string };
type Status = {
  dirty: boolean;
  pending: number;
  unconfirmed: boolean;
};
type Phase = { phase: string };

const props = defineProps<{
  sourceWatch: Watch<Address>;
  statusWatch: Watch<Status>;
  phaseWatch: Watch<Phase>;
}>();

const city = connectVue(props.sourceWatch)(store => store.city);
const zip = connectVue(props.sourceWatch)(store => store.zip);
const dirty = connectVue(props.statusWatch)(store => store.dirty);
const pending = connectVue(props.statusWatch)(store => store.pending);
const unconfirmed = connectVue(props.statusWatch)(store => store.unconfirmed);
const phase = connectVue(props.phaseWatch)(store => store.phase);
</script>

<template>
  <div>
    <span data-testid="city">{{ city.value }}</span>
    <span data-testid="zip">{{ zip.value }}</span>
    <span data-testid="dirty">{{ String(dirty.value) }}</span>
    <span data-testid="pending">{{ pending.value }}</span>
    <span data-testid="unconfirmed">{{ String(unconfirmed.value) }}</span>
    <span data-testid="phase">{{ phase.value }}</span>
  </div>
</template>
