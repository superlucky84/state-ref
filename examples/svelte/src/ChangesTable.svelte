<script lang="ts">
  import type { ChangeLine } from 'stateref-example-shared';

  export let rows: readonly ChangeLine[];

  // A draft's rows carry what the source holds now; a resource's do not. The
  // column appears only where there is a third value to show (B8-7-16).
  $: hasSource = rows.some(row => row.source !== undefined);
</script>

{#if rows.length === 0}
  <p class="note">변경 없음</p>
{:else}
  <table>
    <thead>
      <tr
        ><th>id</th><th>경로</th><th>before</th><th>after</th>{#if hasSource}<th
            >원본</th
          >{/if}<th>충돌</th></tr
      >
    </thead>
    <tbody>
      {#each rows as row (row.id)}
        <tr data-change={row.id}>
          <td>{row.id}</td>
          <td data-cell="path">{row.path}</td>
          <td data-cell="before">{row.before}</td>
          <td data-cell="after">{row.after}</td>
          {#if hasSource}<td data-cell="source">{row.source}</td>{/if}
          <td data-cell="conflict" class={row.conflict ? 'bad' : ''}>
            {row.conflict ? 'conflict' : '-'}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
