<script lang="ts">
import Age from './Age.svelte';
import AgeWithoutExtractingValue from './AgeWithoutExtractingValue.svelte';
export let mockFn;

</script>

<div>
  <Age />
  <AgeWithoutExtractingValue mockFn={mockFn} />
</div>

