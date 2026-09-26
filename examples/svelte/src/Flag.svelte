<script lang="ts">
  import { label } from 'stateref-example-shared';
  import type { FieldId } from 'stateref-example-shared';

  /** A boolean row. Same contract as Row, with the on/off class. */
  export let field: FieldId;
  export let on: boolean;
</script>

<div class="row" data-field={field}>
  <span>{label(field)}</span>
  <b class={on ? 'flag-on' : 'flag-off'}>{on}</b>
</div>
