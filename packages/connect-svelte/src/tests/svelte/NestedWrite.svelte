<script lang="ts">
  import type { Readable } from 'svelte/store';

  /** Svelte's own store syntax: a nested assignment compiles to `set`. */
  export let use: (select: (s: any) => any) => Readable<any> & {
    set: (value: any) => void;
  };
  const address = use(s => s.address);
  const tags = use(s => s.tags);
  export const writeNested = () => {
    $address.city = 'Daegu';
  };
  export const pushTag = () => {
    $tags = [...$tags, 'b'];
  };
</script>

<div data-testid="city">{$address.city}</div>
<div data-testid="tags">{$tags.join(',')}</div>
