<script lang="ts">
  import { lenshelf } from '@/index';
  import { connectShelfWithSvelte } from '@/connectSnippetExamples/svelte/svelte-v4';

  const subscribe = lenshelf({
    name: 'brown',
    age: 13,
  });
  window.p = subscribe();

  const useProfileShelf = connectShelfWithSvelte(subscribe);
  const profile = useProfileShelf(store => store);

  function handleClick() {
    profile.update(n => ({ ...n, age: n.age + 1 }));
  }
</script>

<div>{$profile.name}</div>
<button on:click={handleClick}>
  Clicked  = {$profile.age}
</button>
