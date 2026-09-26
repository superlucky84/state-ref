<script setup lang="ts">
import { label, show } from 'stateref-example-shared';
import type { FieldId } from 'stateref-example-shared';

/**
 * One label/value row.
 *
 * The label comes from the shared table and the row carries its field id, so
 * the browser runner addresses it by that id rather than by Korean text
 * (DC8-8-04). The default slot is the value, which a caller replaces when the
 * field is editable.
 */
const props = defineProps<{ field: FieldId; value?: unknown }>();
</script>

<template>
  <div class="row" :data-field="props.field">
    <span>{{ label(props.field) }}</span>
    <slot
      ><b>{{ show(props.value) }}</b></slot
    >
  </div>
</template>
