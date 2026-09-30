<script lang="ts">
  import { connectSvelte } from '@stateref/connect-svelte';
  import { model } from './demo-model';
  import Row from './Row.svelte';

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

<Row field="city"><input bind:value={$city} /></Row>
<Row field="zip" value={$zip} />
<Row field="memo" value={$memo} />
<Row field="contacts" value={$contacts.map(contact => contact.name).join(',')} />
<Row field="office" value={$office ?? '(없음)'} />
