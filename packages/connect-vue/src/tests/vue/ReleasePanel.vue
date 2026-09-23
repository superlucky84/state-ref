<script setup lang="ts">
import type { Watch } from 'state-ref';
import { connectVue } from '@/index';

type Address = { city: string; zip: string };

const props = defineProps<{
  sourceWatch: Watch<Address>;
  onMirror: (mirror: unknown) => void;
}>();

const city = connectVue(props.sourceWatch)(store => store.city);
props.onMirror(city);
</script>

<template>
  <span data-testid="city">{{ city.value }}</span>
</template>
