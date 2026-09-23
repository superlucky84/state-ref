<script lang="ts">
  import type { Watch } from 'state-ref';
  import type { DraftStatus } from 'state-ref/draft';
  import { connectSvelte } from '@/index';

  type Address = { city: string; zip: string };

  export let sourceWatch: Watch<Address>;
  export let branchWatch: Watch<Address>;
  export let statusWatch: Watch<DraftStatus>;
  export let onSelect: () => void = () => {};

  const source = connectSvelte(sourceWatch)(store => {
    onSelect();
    return store.city;
  });
  const branch = connectSvelte(branchWatch)(store => store.city);
  const conflicts = connectSvelte(statusWatch)(store => store.conflicts);
</script>

<div>
  <span data-testid="source">{$source}</span>
  <span data-testid="branch">{$branch}</span>
  <span data-testid="conflicts">{$conflicts}</span>
  <button data-testid="edit-branch" on:click={() => ($branch = '대전')} />
  <button data-testid="edit-source" on:click={() => ($source = '광주')} />
</div>
