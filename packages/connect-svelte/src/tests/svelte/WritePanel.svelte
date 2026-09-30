<script lang="ts">
  import type { Watch } from 'state-ref';
  import { connectSvelte } from '@/index';

  type Address = { city: string; zip: string };
  type Status = { dirty: boolean; pending: number; unconfirmed: boolean };
  type Phase = { phase: string };

  export let sourceWatch: Watch<Address>;
  export let statusWatch: Watch<Status>;
  export let phaseWatch: Watch<Phase>;

  const city = connectSvelte(sourceWatch)(store => store.city);
  const zip = connectSvelte(sourceWatch)(store => store.zip);
  const dirty = connectSvelte(statusWatch)(store => store.dirty);
  const pending = connectSvelte(statusWatch)(store => store.pending);
  const unconfirmed = connectSvelte(statusWatch)(store => store.unconfirmed);
  const phase = connectSvelte(phaseWatch)(store => store.phase);
</script>

<div>
  <span data-testid="city">{$city}</span>
  <span data-testid="zip">{$zip}</span>
  <span data-testid="dirty">{String($dirty)}</span>
  <span data-testid="pending">{$pending}</span>
  <span data-testid="unconfirmed">{String($unconfirmed)}</span>
  <span data-testid="phase">{$phase}</span>
</div>
