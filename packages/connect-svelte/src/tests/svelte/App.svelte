<script lang="ts">
  import { createStore, copyable } from 'state-ref';
  import { connectWithSvelteA } from '@/index';

  const watch = createStore({
    name: 'brown',
    age: 13,
  });
  window.p = watch();

  const useProfileShelf = connectWithSvelteA(watch);
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
