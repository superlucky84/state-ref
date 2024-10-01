<script lang="ts">
  import { onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import lenshelf from '@/index';
  import type { ShelfStore, Subscribe } from '@/index';

  const subscribe = lenshelf({
    name: 'brown',
    age: 13,
  });

  function connectShelfWithSvelte<T>(subscribe: Subscribe<T>) {
    return <V,>(callback: (store: ShelfStore<T>) => ShelfStore<V>) => {
      const abortController = new AbortController();
      let signalValue!: Writable<V>;
      let shelf!: ShelfStore<V>;

      onDestroy(() => {
        abortController.abort();
      });

      subscribe(shelfStore => {
        shelf = callback(shelfStore);
        if (signalValue) {
          signalValue.set(shelf.value as V)
        } else {
          signalValue = writable(shelf.value as V);
        }

        return abortController.signal;
      });

      signalValue.subscribe(newValue => {
        shelf.value = newValue;
      });

      return signalValue;
    };
  }
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
