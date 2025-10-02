<script lang="ts">
import { useCombindRef } from '../store/store';

const profile = useCombindRef(store => store[0]);
const num = useCombindRef(store => store[1]);

</script>

<div data-testid="combined-name">name: {$profile.name}</div>
<div data-testid="combined-age">age: {$profile.age}</div>
<div data-testid="combined-num">num: {$num}</div>
