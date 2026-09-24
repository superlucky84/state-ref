<script lang="ts">
  import { connectSvelte } from '@stateref/connect-svelte';
  import {
    AUTO_REFETCH,
    OPERATION_GROUPS,
    requestPanel,
  } from 'stateref-example-shared';
  import type { OperationId } from 'stateref-example-shared';
  import { model } from './demo-model';
  import DraftCard from './DraftCard.svelte';
  import ResourceCard from './ResourceCard.svelte';
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

  const mutation = connectSvelte(model.mutation.watchStatus)(store => store);
  const readonlyStatus = connectSvelte(model.readonlyQuery.watchStatus)(
    store => store
  );

  // The cast lives here: Svelte markup expressions are not TypeScript.
  const run = (id: string) => model.run(id as OperationId);
  const policy = `staleTime ${AUTO_REFETCH.staleTime}ms · focus ${AUTO_REFETCH.refetchOnFocus} · reconnect ${AUTO_REFETCH.refetchOnReconnect} · interval ${AUTO_REFETCH.refetchInterval}`;
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

    <section class="card">
      <h2>서버 상태와 요청 기록</h2>
      <div class="row">
        <span>서버 도시 / revision</span>
        <b>{requests.serverCity} / {requests.serverRevision}</b>
      </div>
      <div class="row">
        <span>READ / WRITE 횟수</span>
        <b>{requests.readCount} / {requests.writeCount}</b>
      </div>
      <div class="row"><span>진행 중</span><b>{requests.inFlight}</b></div>
      <table>
        <thead>
          <tr>
            <th>요청 ID</th><th>revision</th><th>결과</th><th>시작</th><th>종료</th>
          </tr>
        </thead>
        <tbody>
          {#each requests.rows as row (row.id)}
            <tr>
              <td>{row.id}</td>
              <td>{row.revision}</td>
              <td class={row.outcome === 'in-flight' ? 'flag-on' : ''}>
                {row.outcome}
              </td>
              <td>{time(row.startedAt)}</td>
              <td>{time(row.settledAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>작업과 정책</h2>
      <div class="row"><span>마지막 조작</span><b>{$lastOperation}</b></div>
      <div class="row"><span>결과</span><b>{$lastResult}</b></div>
      <div class="row">
        <span>고정한 제출</span><b>{$captured ?? '(없음)'}</b>
      </div>
      <div class="row">
        <span>mutation phase</span><b>{$mutation.phase}</b>
      </div>
      <div class="row">
        <span>진행 중 WRITE</span><b>{$mutation.pending}</b>
      </div>
      <div class="row">
        <span>readonly 조회 status</span><b>{$readonlyStatus.status}</b>
      </div>
      <div class="row">
        <span>focused</span>
        <b class={$focused ? 'flag-on' : 'flag-off'}>{$focused}</b>
      </div>
      <div class="row">
        <span>online</span>
        <b class={$online ? 'flag-on' : 'flag-off'}>{$online}</b>
      </div>
      <div class="row"><span>자동 조회 정책</span><b>{policy}</b></div>
      <p class="note">
        staleTime과 interval은 실제 시간으로 흐른다. fixture가 제어하는 것은
        환경 사건과 요청 완료 시점이다.
      </p>
    </section>

    <ResourceCard title="resource 패널 A (key: profile)" which="a" />
    <ResourceCard title="resource 패널 B (같은 key)" which="b" />

    {#if !drafts.a && !drafts.b}
      <section class="card">
        <h2>draft 값과 변경</h2>
        <p class="note">아직 분기하지 않았다. 원본을 먼저 편집해 보라.</p>
      </section>
    {/if}
    {#if drafts.a}
      {#key `a-${drafts.generation}`}
        <DraftCard title="draft A" draft={drafts.a} />
      {/key}
    {/if}
    {#if drafts.b}
      {#key `b-${drafts.generation}`}
        <DraftCard title="draft B" draft={drafts.b} />
      {/key}
    {/if}

    <section class="card">
      <h2>computed 읽기 결과</h2>
      <div class="row"><span>현재 값</span><b>{$computedValue}</b></div>
      <div class="row">
        <span>계산 실행 횟수</span><b>{$computedCalculations}</b>
      </div>
      <div class="row">
        <span>직전 읽기와 같은 객체</span>
        <b class={$computedIdentityStable ? 'flag-on' : 'flag-off'}>
          {$computedIdentityStable}
        </b>
      </div>
      <div class="row">
        <span>구독 콜백이 본 값</span><b>{$computedSubscribed}</b>
      </div>
      <p class="note">
        구독 없는 읽기는 sync() 전에도 최신 값을 본다. 구독 콜백은 sync()에서
        알림을 받는다.
      </p>
    </section>
  </div>
</main>
