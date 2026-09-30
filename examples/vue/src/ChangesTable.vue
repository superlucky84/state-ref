<script setup lang="ts">
import { computed } from 'vue';
import type { ChangeLine } from 'stateref-example-shared';

const props = defineProps<{ rows: readonly ChangeLine[] }>();

/**
 * A draft's rows carry what the source holds now; a resource's do not. The
 * column appears only where there is a third value to show (B8-7-16).
 */
const hasSource = computed(() =>
  props.rows.some(row => row.source !== undefined)
);
</script>

<template>
  <p v-if="rows.length === 0" class="note">변경 없음</p>
  <table v-else>
    <thead>
      <tr>
        <th>id</th>
        <th>경로</th>
        <th>before</th>
        <th>after</th>
        <th v-if="hasSource">원본</th>
        <th>충돌</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.id" :data-change="row.id">
        <td>{{ row.id }}</td>
        <td data-cell="path">{{ row.path }}</td>
        <td data-cell="before">{{ row.before }}</td>
        <td data-cell="after">{{ row.after }}</td>
        <td v-if="hasSource" data-cell="source">{{ row.source }}</td>
        <td data-cell="conflict" :class="row.conflict ? 'bad' : ''">
          {{ row.conflict ? 'conflict' : '-' }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
