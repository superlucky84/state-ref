<script lang="ts">
  import { lenshelf, copyable } from '@/index';
  import { connectShelfWithSvelte } from '@/connectSnippetExamples/svelte/svelte-latest';

  const take = lenshelf({
    name: 'brown',
    age: 13,
  });
  window.p = take();

  const useProfileShelf = connectShelfWithSvelte(take);
  const profile = useProfileShelf(store => store);

  function handleClick() {
    // profile.update(n => ({ ...n, age: n.age + 1 }));
    profile.update(n => copyable(n).age.writeCopy(n.age + 1));
  }
</script>

<div>{$profile.name}</div>
<button on:click={handleClick}>
  Clicked  = {$profile.age}
</button>
