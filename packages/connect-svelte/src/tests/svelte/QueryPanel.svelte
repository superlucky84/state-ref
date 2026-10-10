<script lang="ts">
  import type { Readable } from 'svelte/store';
  import type { ObserveOptions, QueryObserverControls, SyncClient } from '@stateref/sync';
  import { createSyncQuery } from '@/sync';

  type Account = { name: string; age: number };
  export let client: SyncClient;
  export let options: ObserveOptions<Account> | Readable<ObserveOptions<Account>>;
  export let onReady: (q: QueryObserverControls<Account>) => void = () => {};
  export let onSelect: () => void = () => {};
  const [account, q] = createSyncQuery(client, options);
  const label = account(display => {
    onSelect();
    return display.queryKey.value?.[1] === 2 ? display.data.age.value : display.data.name.value;
  });
  const state = account(display => `${display.status.value}:${display.fetchStatus.value}:${display.errorSource.value}`);
  const key = account(display => display.queryKey.value?.[1]);
  onReady(q);
</script>

<span data-testid="label">{$label ?? 'waiting'}</span>
<span data-testid="state">{$state}</span>
<span data-testid="key">{$key}</span>
