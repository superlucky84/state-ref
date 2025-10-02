<script lang="ts">
  import { createStoreManualSync } from 'state-ref';
  import { connectSvelte } from '@/index';

  const { watch, updateRef, sync } = createStoreManualSync({
    name: 'With Action',
    age: 13,
  });

  const changeAge = (newAge: number) => {
    updateRef.age.value = newAge;
    sync();
  };

  // @ts-ignore
  window.p = watch();

  const useProfileShelf = connectSvelte(watch);
  const age = useProfileShelf(store => store.age);

  function handleClick() {
    changeAge($age + 1);
  }
</script>

<button on:click={handleClick}>
  with Action Clicked  = {$age}
</button>
