<script lang="ts">
  import { createStore, copyable } from 'state-ref';
  import { connectSvelte } from '@/index';

  const watch = createStore({
    name: 'brown',
    age: 13,
  });

  // @ts-ignore
  window.p = watch();

  const useProfileShelf = connectSvelte(watch);
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
