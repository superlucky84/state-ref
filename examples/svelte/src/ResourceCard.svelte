<script lang="ts">
  import { connectSvelte } from '@stateref/connect-svelte';
  import { CARD_TITLE, resourcePanel } from 'stateref-example-shared';
  import type { CardId } from 'stateref-example-shared';
  import { model } from './demo-model';
  import ChangesTable from './ChangesTable.svelte';
  import Flag from './Flag.svelte';
  import ResourceValues from './ResourceValues.svelte';
  import Row from './Row.svelte';

  export let card: Extract<CardId, 'resource-a' | 'resource-b'>;
  export let which: 'a' | 'b';

  const handle = which === 'a' ? model.panelA : model.panelB;
  const status = connectSvelte(handle.watchStatus)(store => store);

  $: panel = resourcePanel($status, $status.loaded ? handle.changes() : []);
</script>

<section class="card" data-card={card}>
  <h2>{CARD_TITLE[card]}</h2>
  {#if !panel.loaded}
    <p class="note">
      {panel.status === 'error'
        ? `오류: ${panel.errorText}`
        : '아직 로드되지 않았다. 여기에 가짜 성공 값을 보이지 않는다.'}
    </p>
  {:else}
    <ResourceValues {which} />
  {/if}
  <Row field="status" value={`${panel.status} / ${panel.fetchStatus}`} />
  <Flag field="dirty" on={panel.dirty} />
  <Flag field="serverBusy" on={panel.serverBusy} />
  <Flag field="unconfirmed" on={panel.unconfirmed} />
  <Flag field="invalidated" on={panel.invalidated} />
  <Row field="version" value={`${panel.version} / ${panel.conflicts}`} />
  <ChangesTable rows={panel.changes} />
</section>
