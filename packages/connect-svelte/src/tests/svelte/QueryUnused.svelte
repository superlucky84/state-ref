<script lang="ts">
  import type { Readable } from 'svelte/store';
  import type { ObserveOptions, QueryObserverControls, SyncClient } from '@stateref/sync';
  import { createSyncQuery } from '@/sync';

  type Account = { name: string; age: number };
  export let client: SyncClient;
  export let options: ObserveOptions<Account> | Readable<ObserveOptions<Account>>;
  export let onReady: (q: QueryObserverControls<Account>) => void = () => {};
  const [, q] = createSyncQuery(client, options);
  onReady(q);
</script>

<p>unused</p>
