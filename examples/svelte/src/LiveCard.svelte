<script lang="ts">
  import { connectSvelteView } from '@stateref/connect-svelte';
  import { keyText } from 'stateref-example-shared';
  import { model } from './demo-model';
  import Row from './Row.svelte';

  /**
   * Mounted only while the live view is alive: a disposed view refuses every
   * access, the same way `query.watch` refuses before a first load. The parent
   * decides which of the two halves to show.
   */
  const view = connectSvelteView(model.liveView.watch);
  const key = view(ref => ref.queryKey.value);
  const enabled = view(ref => ref.enabled.value);
  const phase = view(ref => ref.phase.value);
  const fetchStatus = view(ref => ref.fetchStatus.value);
  const city = view(ref => ref.data.value?.city);

  // The cast belongs in the script: Svelte's markup does not parse `as`.
  $: keyLabel = $key === null ? '(없음)' : keyText($key as string[]);
</script>

<Row field="liveKey" value={keyLabel} />
<Row field="liveEnabled" value={String($enabled)} />
<Row field="livePhase" value={`${$phase} / ${$fetchStatus}`} />
<Row field="liveCity" value={$city ?? '(없음)'} />
