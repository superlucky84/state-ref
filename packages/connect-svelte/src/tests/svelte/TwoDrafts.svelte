<script lang="ts">
  import type { Watch } from 'state-ref';
  import type { DraftStatus } from 'state-ref/draft';
  import { connectSvelte } from '@/index';

  type Address = { city: string; zip: string };

  export let sourceWatch: Watch<Address>;
  export let sharedWatch: Watch<Address>;
  export let leftWatch: Watch<Address>;
  export let rightWatch: Watch<Address>;
  export let rightStatusWatch: Watch<DraftStatus>;

  const source = connectSvelte(sourceWatch)(store => store.city);
  const shared = connectSvelte(sharedWatch)(store => store.city);
  const left = connectSvelte(leftWatch)(store => store.city);
  const right = connectSvelte(rightWatch)(store => store.city);
  const rightConflicts = connectSvelte(rightStatusWatch)(
    store => store.conflicts
  );
</script>

<div>
  <span data-testid="source">{$source}</span>
  <span data-testid="shared">{$shared}</span>
  <span data-testid="left">{$left}</span>
  <span data-testid="right">{$right}</span>
  <span data-testid="right-conflicts">{$rightConflicts}</span>
  <button data-testid="edit-left" on:click={() => ($left = '대전')} />
  <button data-testid="edit-right" on:click={() => ($right = '광주')} />
</div>
