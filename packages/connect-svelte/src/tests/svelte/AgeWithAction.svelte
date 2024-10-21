<script lang="ts">
import { useProfileRef, changeAge } from '../store/manualStore';
const age = useProfileRef(store => store.age);

function handleClick() {
  changeAge(99);
}
</script>

<div data-testid="age-display">age: {$age}</div>
<button data-testid="age-increase" on:click={handleClick}>
  increase
</button>

