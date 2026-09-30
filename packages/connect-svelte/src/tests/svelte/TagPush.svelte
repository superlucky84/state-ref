<script lang="ts">
  /** Svelte's push-then-reassign idiom on a store value. */
  export let use: any;
  const tags = use((s: any) => s.tags);
  export const pushTag = (value: string) => {
    $tags.push(value);
    $tags = $tags;
  };
</script>

<div data-testid="tags">{$tags.join(',')}</div>
