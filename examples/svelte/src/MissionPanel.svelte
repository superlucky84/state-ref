<script lang="ts">
  import { writable } from 'svelte/store';
  import { createSyncQuery } from '@stateref/connect-svelte/sync';
  import { shipScreen, type Mission } from 'stateref-example-shared/mission';
  export let model: Mission;
  export let id: number;
  export let poll: boolean;
  export let slot: string;
  export let saving: boolean;
  const options = writable(model.options(id, poll));
  const [select, q] = createSyncQuery(model.client, options);
  const screen = select(ref => shipScreen(ref));
  $: options.set(model.options(id, poll));
</script>

<article
  class="ship-card"
  data-testid={`${slot}-panel`}
  data-ship-id={$screen.id}
  data-phase={$screen.phase}
>
  <div class="card-heading">
    <span class="eyebrow"
      >{slot === 'a' ? 'MAIN BRIDGE' : 'CO-PILOT DISPLAY'}</span
    ><span class="pill" data-testid={`${slot}-status`}
      >{$screen.fetch === 'paused'
        ? '무선 대기'
        : $screen.fetch === 'fetching'
        ? '통신 중'
        : $screen.loaded
        ? '준비 완료'
        : '대기'}</span
    >
  </div>
  <h3 data-testid={`${slot}-title`}>
    {$screen.loaded
      ? $screen.name
      : $screen.phase === 'error'
      ? '통신을 다시 시도해 주세요'
      : '우주선을 만나러 가는 중…'}
  </h3>
  {#if $screen.error}<p role="alert" data-testid={`${slot}-error`}>
      {$screen.error}
    </p>{/if}
  <label
    >우주선 이름<input
      value={$screen.name}
      disabled={!$screen.loaded}
      data-testid={`${slot}-name`}
      on:input={event => model.edit(q, event.currentTarget.value)}
    /></label
  >
  <div class="ship-facts">
    <span>목적지 <b>{$screen.destination || '—'}</b></span><span
      >연료 <b data-testid={`${slot}-fuel`}>{$screen.fuel}</b></span
    >{#if $screen.id === 2}<span
        >산소 <b data-testid={`${slot}-oxygen`}>{$screen.oxygen ?? 0}</b></span
      >{/if}
  </div>
  <p class="cargo">{$screen.cargo || '화물 정보를 확인하고 있어요.'}</p>
  <div class="tool-buttons">
    <button data-testid={`${slot}-refresh`} on:click={() => model.refresh(q)}
      >새로고침</button
    ><button
      data-testid={`${slot}-invalidate`}
      on:click={() => model.invalidate(q)}>다시 확인</button
    ><button
      class="primary"
      data-testid={`${slot}-save`}
      disabled={!$screen.loaded || saving}
      on:click={() => model.save(q)}
      >{saving ? '저장 중…' : '정비소에 저장'}</button
    >
  </div>
  <p class="hint" data-testid={`${slot}-dirty`}>
    {$screen.dirty
      ? '아직 저장하지 않은 편집이 있어요.'
      : '정비소와 같은 정보예요.'}
  </p>
</article>
