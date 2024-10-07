<script lang="ts">
import { useProfileRef } from '../store/store';
const age = useProfileRef(store => store.age);
</script>

<div data-testid="age-display1">age: {$age}</div>
