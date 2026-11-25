<script lang="ts">
  export let use: any;
  const val = use((s: any) => s.val);
  export const setVal = (next: any) => {
    $val = next;
  };
  export const getVal = () => $val;
</script>

<div data-testid="box">{String($val)}</div>
