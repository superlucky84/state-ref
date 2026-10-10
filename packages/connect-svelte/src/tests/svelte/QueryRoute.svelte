<script lang="ts">
  import type { ObserveOptions, SyncClient } from '@stateref/sync';
  import QueryPanel from './QueryPanel.svelte';

  type Account = { name: string; age: number };
  export let client: SyncClient;
  export let options: ObserveOptions<Account>;
  export let swap: 'branch' | 'key';
  export let route: 'first' | 'second' = 'first';
</script>

<span data-testid="route">{route}</span>
{#if swap === 'branch'}
  {#if route === 'first'}
    <QueryPanel {client} {options} />
  {:else}
    <QueryPanel {client} {options} />
  {/if}
{:else}
  {#key route}
    <QueryPanel {client} {options} />
  {/key}
{/if}
