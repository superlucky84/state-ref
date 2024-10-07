<script lang="ts">
import { useProfileRef } from '../store/store';
import { afterUpdate } from 'svelte';
export let mockFn;
const age = useProfileRef(store => store.age);

afterUpdate(() => {
  mockFn();
});

</script>

<button>
  age: {$age}
</button>

