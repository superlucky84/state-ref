<script lang="ts">
  import lenshelf from '@/index';
  import { connectShelfWithSvelte } from '@/connectSnippetExamples/svelte/svelte-v4';

  const subscribe = lenshelf({
    name: 'brown',
    age: 13,
  });

  const useProfileShelf = connectShelfWithSvelte(subscribe);
  const age = useProfileShelf(store => store.age);
  const name = useProfileShelf(store => store.name);

  function handleClick() {
    age.update((v) => v + 1);
  }
</script>

<div>{$name}</div>
<button on:click={handleClick}>
  Clicked  = {$age}
</button>
