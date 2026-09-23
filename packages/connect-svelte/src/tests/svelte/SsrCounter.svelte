<script lang="ts">
  import type { Watch } from 'state-ref';
  import { connectSvelte } from '@/index';

  type Counter = { n: number };

  export let watchRef: Watch<Counter>;

  const n = connectSvelte(watchRef)(store => store.n);
</script>

<div>{$n}</div>
