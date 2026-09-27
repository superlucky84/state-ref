<script lang="ts">
  import { connectSvelteView } from '@stateref/connect-svelte';
  import { model } from './demo-model';
  import Row from './Row.svelte';

  /**
   * The second display's rows, mounted only while the screen is open.
   *
   * Unlike the probe card this one *is* about the connector (DC8-8-33): it
   * holds a second, independent subscription on a shared view, and unmounting
   * it must end that subscription and nothing else. The parent decides when to
   * mount it; the handle behind it outlives the unmount.
   */
  export let watch: NonNullable<ReturnType<typeof model.shareWatch>>;

  const view = connectSvelteView(watch);
  const phase = view(ref => ref.phase.value);
  const fetchStatus = view(ref => ref.fetchStatus.value);
  const city = view(ref => ref.data.value?.city);
</script>

<Row field="livePhase" value={`${$phase} / ${$fetchStatus}`} />
<Row field="liveCity" value={$city ?? '(없음)'} />
