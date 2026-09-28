<script lang="ts">
  import type { QueryHandle } from '@stateref/sync';
  import { connectSvelteView } from '@/index';

  export let live: QueryHandle<{ name: string }, string>;
  export let onSelect: () => void;
  const display = connectSvelteView(live.watchDisplay)(ref => {
    onSelect();
    return `${ref.queryKey.value?.[1]}:${ref.data.value}`;
  });
</script>

<span data-testid="live-view">{$display}</span>
