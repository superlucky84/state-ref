<script lang="ts">
import { useBoardRef, renders } from '../store/boardStore';
const tag = useBoardRef(store => store.meta.tag);
$: {
  $tag;
  renders.tag += 1;
}
</script>

<div data-testid="board-tag">{$tag}</div>
