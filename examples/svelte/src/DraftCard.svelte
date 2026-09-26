<script lang="ts">
  import { connectSvelte } from '@stateref/connect-svelte';
  import { CARD_TITLE, draftPanel } from 'stateref-example-shared';
  import type { CardId, Profile } from 'stateref-example-shared';
  import type { Draft } from 'state-ref/draft';
  import ChangesTable from './ChangesTable.svelte';
  import Flag from './Flag.svelte';
  import Row from './Row.svelte';

  export let card: Extract<CardId, 'draft-a' | 'draft-b'>;
  export let draft: Draft<Profile>;

  const value = connectSvelte(draft.watch);
  const city = value(store => store.city);
  const zip = value(store => store.zip);
  /** Never edited here: M2-13 asks that a source update to it shows up. */
  const memo = value(store => store.memo);
  const status = connectSvelte(draft.watchStatus)(store => store);

  $: panel = draftPanel($status, draft.changes());
</script>

<section class="card" data-card={card}>
  <h2>{CARD_TITLE[card]}</h2>
  <Row field="city"><input bind:value={$city} /></Row>
  <Row field="zip" value={$zip} />
  <Row field="memo" value={$memo} />
  <Flag field="draftDirty" on={panel.dirty} />
  <Row field="version" value={`${panel.version} / ${panel.conflicts}`} />
  <ChangesTable rows={panel.changes} />
</section>
