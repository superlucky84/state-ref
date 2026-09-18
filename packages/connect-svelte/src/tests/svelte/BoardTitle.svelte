<script lang="ts">
import { useBoardRef, renders } from '../store/boardStore';
const title = useBoardRef(store => store.title);
$: {
  $title;
  renders.title += 1;
}
</script>

<div data-testid="board-title">{$title}</div>
