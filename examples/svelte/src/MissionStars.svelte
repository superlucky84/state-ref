<script lang="ts">
  import { connectSvelte } from '@stateref/connect-svelte';
  import type { Mission } from 'stateref-example-shared/mission';
  export let model: Mission;
  const stars = connectSvelte(model.counter)(ref => ref);
</script>

<button
  class="star-counter"
  data-testid="star-counter"
  on:click={() => ($stars += 1)}
  >✦ 탐험 별 모으기 <b data-testid="stars">{$stars}</b></button
>
