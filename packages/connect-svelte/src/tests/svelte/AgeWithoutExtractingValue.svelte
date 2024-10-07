<script lang="ts">
import { useProfileRef } from '../store/store';
import { afterUpdate } from 'svelte';
export let mockFn;
const name = useProfileRef(store => store.name);

function changeName() {
  // profile.update(n => ({ ...n, age: n.age + 1 }));
  name.update(n => n + '@@');
}

afterUpdate(() => {
  mockFn();
});

</script>

<button on:click={changeName} data-testid="name-display">
  name: {$name}
</button>

