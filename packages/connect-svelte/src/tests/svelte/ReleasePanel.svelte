<script lang="ts">
  import type { Watch } from 'state-ref';
  import { connectSvelte } from '@/index';

  type Address = { city: string; zip: string };

  export let sourceWatch: Watch<Address>;
  export let onMirror: (mirror: unknown) => void;

  const city = connectSvelte(sourceWatch)(store => store.city);
  onMirror(city);
</script>

<span data-testid="city">{$city}</span>
