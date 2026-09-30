<svelte:options runes={true} />

<script lang="ts">
  let {
    use,
  }: {
    use: (select: (s: any) => any) => { value: any };
  } = $props();

  const tags = use(s => s.tags);

  export function pushTag(value: string) {
    tags.value.push(value);
  }
</script>

<div data-testid="tags">{tags.value.join(',')}</div>
