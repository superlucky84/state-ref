<script lang="ts">
  import { label, show } from 'stateref-example-shared';
  import type { FieldId } from 'stateref-example-shared';

  /**
   * One label/value row.
   *
   * The label comes from the shared table and the row carries its field id, so
   * the browser runner addresses it by that id rather than by Korean text
   * (DC8-8-04). The default slot is the value, which a caller replaces when
   * the field is editable.
   */
  export let field: FieldId;
  export let value: unknown = undefined;
</script>

<div class="row" data-field={field}>
  <span>{label(field)}</span>
  <slot><b>{show(value)}</b></slot>
</div>
