<script>
  import lenshelf from '@/index';

  const subscribe = lenshelf({
    name: 'brown',
    age: 13,
  });

  let age = 0;
  const { age: ageUpdater } = subscribe(store => {
    age = store.age.value;
  });
  window.p = ageUpdater;

  function handleClick() {
    ageUpdater.value += 1;
  }
</script>

<button on:click={handleClick}>
  Clicked  = {age}
</button>
