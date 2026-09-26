<script lang="ts">
  import { connectSvelte } from '@stateref/connect-svelte';
  import {
    CARD_TITLE,
    OPERATION_GROUPS,
    POLICY_TEXT,
    requestPanel,
  } from 'stateref-example-shared';
  import type { OperationId } from 'stateref-example-shared';
  import { model } from './demo-model';
  import DraftCard from './DraftCard.svelte';
  import Flag from './Flag.svelte';
  import LiveCard from './LiveCard.svelte';
  import ResourceCard from './ResourceCard.svelte';
  import Row from './Row.svelte';
  import 'stateref-example-shared/demo.css';

  /**
   * The Svelte demo (step 4 of docs/server-sync/PHASE8_5.md).
   *
   * Same model and operations as the React demo. Phase 8.2 fixed two
   * `connectSvelte` defects behind this: the write-back subscription is
   * released on destroy, and a throwing subscriber is reported rather than
   * left to strand Svelte's shared subscriber queue.
   */
  const ui = connectSvelte(model.watchUi);
  const tick = ui(store => store.tick);
  const draftGeneration = ui(store => store.draftGeneration);
  const lastOperation = ui(store => store.lastOperation);
  const lastResult = ui(store => store.lastResult);
  const captured = ui(store => store.captured);
  const focused = ui(store => store.focused);
  const online = ui(store => store.online);
  const computedValue = ui(store => store.computedValue);
  const computedCalculations = ui(store => store.computedCalculations);
  const computedIdentityStable = ui(store => store.computedIdentityStable);
  const computedSubscribed = ui(store => store.computedSubscribed);
  const liveDisposed = ui(store => store.liveDisposed);

  const mutation = connectSvelte(model.mutation.watchStatus)(store => store);
  const readonlyStatus = connectSvelte(model.readonlyQuery.watchStatus)(
    store => store
  );

  // The cast lives here: Svelte markup expressions are not TypeScript.
  const run = (id: string) => model.run(id as OperationId);

  const time = (at: number | null) =>
    at ? new Date(at).toLocaleTimeString() : '-';

  // The mock server is not reactive: naming the tick inside the statement is
  // what makes Svelte recompute these when an operation runs.
  const readRequests = (_tick: number) => requestPanel(model.server);
  const readDrafts = (_generation: number) => model.drafts();
  $: requests = readRequests($tick);
  $: drafts = readDrafts($draftGeneration);
</script>

<main>
  <h1>state-ref — Svelte 서버 동기화 데모</h1>
  <p class="note">
    수동 체크리스트 1절의 fixture를 그대로 쓴다. 실제 서버는 없다.
  </p>
  <div class="grid">
    {#each OPERATION_GROUPS as group (group.id)}
      <section class="card">
        <h2>{group.title}</h2>
        {#each group.operations as [id, label] (id)}
          <button data-operation={id} on:click={() => run(id)}>
            {label}
          </button>
        {/each}
      </section>
    {/each}

    <section class="card" data-card="requests">
      <h2>{CARD_TITLE.requests}</h2>
      <Row
        field="server"
        value={`${requests.serverCity} / ${requests.serverRevision}`}
      />
      <Row
        field="counts"
        value={`${requests.readCount} / ${requests.writeCount}`}
      />
      <Row field="inFlight" value={requests.inFlight} />
      <table>
        <thead>
          <tr>
            <th>요청 ID</th><th>key</th><th>revision</th><th>결과</th><th>시작</th><th>종료</th>
          </tr>
        </thead>
        <tbody>
          {#each requests.rows as row (row.id)}
            <tr data-request={row.id}>
              <td>{row.id}</td>
              <td data-cell="key">{row.key}</td>
              <td data-cell="revision">{row.revision}</td>
              <td
                data-cell="outcome"
                class={row.outcome === 'in-flight' ? 'flag-on' : ''}
              >
                {row.outcome}
              </td>
              <td>{time(row.startedAt)}</td>
              <td>{time(row.settledAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>

    <section class="card" data-card="operations">
      <h2>{CARD_TITLE.operations}</h2>
      <Row field="lastOperation" value={$lastOperation} />
      <Row field="lastResult" value={$lastResult} />
      <Row field="captured" value={$captured ?? '(없음)'} />
      <Row field="mutationPhase" value={$mutation.phase} />
      <Row field="mutationPending" value={$mutation.pending} />
      <Row field="readonlyStatus" value={$readonlyStatus.status} />
      <Flag field="focused" on={$focused} />
      <Flag field="online" on={$online} />
      <Row field="policy" value={POLICY_TEXT} />
      <p class="note">
        staleTime과 interval은 실제 시간으로 흐른다. fixture가 제어하는 것은
        환경 사건과 요청 완료 시점이다.
      </p>
    </section>

    <ResourceCard card="resource-a" which="a" />
    <ResourceCard card="resource-b" which="b" />

    {#if !drafts.a && !drafts.b}
      <section class="card">
        <h2>draft 값과 변경</h2>
        <p class="note">아직 분기하지 않았다. 원본을 먼저 편집해 보라.</p>
      </section>
    {/if}
    {#if drafts.a}
      {#key `a-${drafts.generation}`}
        <DraftCard card="draft-a" draft={drafts.a} />
      {/key}
    {/if}
    {#if drafts.b}
      {#key `b-${drafts.generation}`}
        <DraftCard card="draft-b" draft={drafts.b} />
      {/key}
    {/if}

    <section class="card" data-card="live">
      <h2>{CARD_TITLE.live}</h2>
      {#if !$liveDisposed}
        <LiveCard />
      {:else}
        <Row field="liveKey" value="(해제됨)" />
        <Row field="liveEnabled" value="(해제됨)" />
        <Row field="livePhase" value="(해제됨)" />
        <Row field="liveCity" value="(해제됨)" />
      {/if}
      <p class="note">
        원본이 key를 가리키지 않으면 비활성이고 조회 핸들이 없다. key를 바꾸면
        이전 key의 조회는 마지막 소유자였을 때 취소된다.
      </p>
    </section>

    <section class="card" data-card="computed">
      <h2>{CARD_TITLE.computed}</h2>
      <Row field="computedValue" value={$computedValue} />
      <Row field="computedCalculations" value={$computedCalculations} />
      <Flag field="computedIdentity" on={$computedIdentityStable} />
      <Row field="computedSubscribed" value={$computedSubscribed} />
      <p class="note">
        구독 없는 읽기는 sync() 전에도 최신 값을 본다. 구독 콜백은 sync()에서
        알림을 받는다.
      </p>
    </section>
  </div>
</main>
