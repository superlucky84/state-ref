<script lang="ts">
  import { fromState, copyable } from '@/index';
  import { connectWithSvelteA } from '@/connectSnippetExamples/svelte/svelte-latest';

  const capture = fromState({
    name: 'brown',
    age: 13,
  });
  window.p = capture();

  const useProfileShelf = connectShelfWithSvelte(capture);
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
