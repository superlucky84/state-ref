<script lang="ts">
  import { connectSvelte } from '@stateref/connect-svelte';
  import { model } from './demo-model';

  /**
   * Mounted only after `status.loaded`: `query.watch` throws before the first
   * load. The Svelte connector hands back a writable per selected leaf, so
   * `bind:value` writes straight through to the resource.
   */
  export let which: 'a' | 'b';

  const source = connectSvelte(
    which === 'a' ? model.panelA.watch : model.panelB.watch
  );
  const city = source(store => store.city);
  const zip = source(store => store.zip);
  const memo = source(store => store.memo);
  const contacts = source(store => store.contacts);
  const office = source(store => store.office);
</script>

<div class="row"><span>도시</span><input bind:value={$city} /></div>
<div class="row"><span>우편번호</span><b>{$zip}</b></div>
<div class="row"><span>메모</span><b>{$memo}</b></div>
<div class="row">
  <span>연락처</span>
  <b>{$contacts.map(contact => contact.name).join(',')}</b>
</div>
<div class="row"><span>사무실</span><b>{$office ?? '(없음)'}</b></div>
