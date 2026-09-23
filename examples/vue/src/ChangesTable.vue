<script setup lang="ts">
import type { ChangeLine } from 'stateref-example-shared';

defineProps<{ rows: readonly ChangeLine[] }>();
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
        <th>충돌</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.id">
        <td>{{ row.id }}</td>
        <td>{{ row.path }}</td>
        <td>{{ row.before }}</td>
        <td>{{ row.after }}</td>
        <td :class="row.conflict ? 'bad' : ''">
          {{ row.conflict ? 'conflict' : '-' }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
