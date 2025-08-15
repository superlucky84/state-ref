<script lang="ts">
import { useProfileRef, useComputedRef } from '../store/store';
const age = useProfileRef(store => store.age);
const computedValue = useComputedRef(store => store);

function handleClick() {
  // profile.update(n => ({ ...n, age: n.age + 1 }));
  age.update(n => n + 1);
}
</script>

<div data-testid="age-display">age: {$age}</div>
<div data-testid="computed-display">age: {$computedValue}</div>
<button data-testid="age-increase" on:click={handleClick}>
  increase
</button>

