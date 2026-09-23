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
        <tr>
          <td>{row.id}</td>
          <td>{row.path}</td>
          <td>{row.before}</td>
          <td>{row.after}</td>
          <td class={row.conflict ? 'bad' : ''}>
            {row.conflict ? 'conflict' : '-'}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
