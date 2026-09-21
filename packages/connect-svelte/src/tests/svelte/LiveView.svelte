<script lang="ts">
  import type { LiveQueryViewHandle } from '@stateref/sync';
  import { connectSvelteView } from '@/index';

  export let live: LiveQueryViewHandle<{ name: string }, string>;
  export let onSelect: () => void;
  const display = connectSvelteView(live.watch)(ref => {
    onSelect();
    return `${ref.queryKey.value?.[1]}:${ref.data.value}`;
  });
</script>

<span data-testid="live-view">{$display}</span>
