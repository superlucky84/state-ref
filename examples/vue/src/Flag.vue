<script setup lang="ts">
import { label } from 'stateref-example-shared';
import type { FieldId } from 'stateref-example-shared';

/** A boolean row. Same contract as Row, with the on/off class. */
const props = defineProps<{ field: FieldId; on: boolean }>();
</script>

<template>
  <div class="row" :data-field="props.field">
    <span>{{ label(props.field) }}</span>
    <b :class="props.on ? 'flag-on' : 'flag-off'">{{ props.on }}</b>
  </div>
</template>
