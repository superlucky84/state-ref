<script lang="ts">
  import type { ChangeLine } from 'stateref-example-shared';

  export let rows: readonly ChangeLine[];
</script>

{#if rows.length === 0}
  <p class="note">변경 없음</p>
{:else}
  <table>
    <thead>
      <tr><th>id</th><th>경로</th><th>before</th><th>after</th><th>충돌</th></tr>
    </thead>
    <tbody>
      {#each rows as row (row.id)}
        <tr data-change={row.id}>
          <td>{row.id}</td>
          <td data-cell="path">{row.path}</td>
          <td data-cell="before">{row.before}</td>
          <td data-cell="after">{row.after}</td>
          <td data-cell="conflict" class={row.conflict ? 'bad' : ''}>
            {row.conflict ? 'conflict' : '-'}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
