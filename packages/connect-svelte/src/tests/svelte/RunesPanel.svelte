<svelte:options runes={true} />

<script lang="ts">
  type Selection<V> = { value: V };
  let {
    use,
  }: {
    use: <V>(select: (s: any) => any) => Selection<V>;
  } = $props();

  const city = use<string>(s => s.address.city);
  const address = use<{ city: string; zip: string }>(s => s.address);
  let renders = $state(0);

  export function writeCity(value: string) {
    city.value = value;
  }
  export function writeNested(value: string) {
    address.value.city = value;
  }
  export function replaceAddress(value: string) {
    address.value = { ...address.value, city: value };
  }
</script>

<div data-testid="city">{city.value}</div>
<div data-testid="zip">{address.value.zip}</div>
