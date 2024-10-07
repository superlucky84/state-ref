<script lang="ts">
import { useProfileRef } from '../store/store';
const age = useProfileRef(store => store.age);

function handleClick() {
  // profile.update(n => ({ ...n, age: n.age + 1 }));
  age.update(n => n + 1);
}
</script>

<div data-testid="age-display">age: {$age}</div>
<button data-testid="age-increase" on:click={handleClick}>
  increase
</button>

