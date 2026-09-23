<script lang="ts">
  import { connectSvelte } from '@stateref/connect-svelte';
  import { resourcePanel } from 'stateref-example-shared';
  import { model } from './demo-model';
  import ChangesTable from './ChangesTable.svelte';
  import ResourceValues from './ResourceValues.svelte';

  export let title: string;
  export let which: 'a' | 'b';

  const handle = which === 'a' ? model.panelA : model.panelB;
  const status = connectSvelte(handle.watchStatus)(store => store);

  $: panel = resourcePanel($status, $status.loaded ? handle.changes() : []);
</script>

<section class="card">
  <h2>{title}</h2>
  {#if !panel.loaded}
    <p class="note">
      {panel.status === 'error'
        ? `오류: ${panel.errorText}`
        : '아직 로드되지 않았다. 여기에 가짜 성공 값을 보이지 않는다.'}
    </p>
  {:else}
    <ResourceValues {which} />
  {/if}
  <div class="row">
    <span>status / fetch</span><b>{panel.status} / {panel.fetchStatus}</b>
  </div>
  <div class="row">
    <span>dirty (로컬 차이)</span>
    <b class={panel.dirty ? 'flag-on' : 'flag-off'}>{panel.dirty}</b>
  </div>
  <div class="row">
    <span>serverBusy (진행 중 WRITE)</span>
    <b class={panel.serverBusy ? 'flag-on' : 'flag-off'}>{panel.serverBusy}</b>
  </div>
  <div class="row">
    <span>unconfirmed (미확정)</span>
    <b class={panel.unconfirmed ? 'flag-on' : 'flag-off'}>{panel.unconfirmed}</b>
  </div>
  <div class="row">
    <span>invalidated</span>
    <b class={panel.invalidated ? 'flag-on' : 'flag-off'}>{panel.invalidated}</b>
  </div>
  <div class="row">
    <span>version / conflicts</span><b>{panel.version} / {panel.conflicts}</b>
  </div>
  <ChangesTable rows={panel.changes} />
</section>
