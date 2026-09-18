<script lang="ts">
import { useBoardRef, renders } from '../store/boardStore';
const items = useBoardRef(store => store.items);
const length = useBoardRef(store => store.items.length);
$: {
  $items;
  renders.list += 1;
}
$: {
  $length;
  renders.length += 1;
}
</script>

<ul data-testid="board-list">
  {#each $items as item}
    <li>{item}</li>
  {/each}
</ul>
<div data-testid="board-length">{$length}</div>
