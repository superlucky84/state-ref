<script lang="ts">
  import Age from './Age.svelte';
  import AgeUnmountable from './AgeUnmountable.svelte';

  // props 정의
  export let mockFn;

  let mounted = true; // mountedRef와 동일

  const changeUnmount = () => {
    mounted = false;
  };
</script>

<!-- 템플릿 -->
<div>
  <button data-testid="unmount" on:click={changeUnmount}>Unmount</button>
  <Age />
  {#if mounted}
    <AgeUnmountable {mockFn} />
  {/if}
</div>
