<script lang="ts">
  import { connectSvelte } from '@stateref/connect-svelte';
  import { draftPanel } from 'stateref-example-shared';
  import type { Profile } from 'stateref-example-shared';
  import type { Draft } from 'state-ref/draft';
  import ChangesTable from './ChangesTable.svelte';

  export let title: string;
  export let draft: Draft<Profile>;

  const value = connectSvelte(draft.watch);
  const city = value(store => store.city);
  const zip = value(store => store.zip);
  const status = connectSvelte(draft.watchStatus)(store => store);

  $: panel = draftPanel($status, draft.changes());
</script>

<section class="card">
  <h2>{title}</h2>
  <div class="row"><span>도시</span><input bind:value={$city} /></div>
  <div class="row"><span>우편번호</span><b>{$zip}</b></div>
  <div class="row">
    <span>dirty</span>
    <b class={panel.dirty ? 'flag-on' : 'flag-off'}>{panel.dirty}</b>
  </div>
  <div class="row">
    <span>version / conflicts</span><b>{panel.version} / {panel.conflicts}</b>
  </div>
  <ChangesTable rows={panel.changes} />
</section>
