<script lang="ts">
  import { connectSvelte } from '@stateref/connect-svelte';
  import {
    CARD_TITLE,
    OPERATION_GROUPS,
    POLICY_TEXT,
    inspectPanel,
    requestPanel,
    resourcePanel,
  } from 'stateref-example-shared';
  import type { QueryStatus } from '@stateref/sync';
  import type { OperationId } from 'stateref-example-shared';
  import { model } from './demo-model';
  import ChangesTable from './ChangesTable.svelte';
  import DraftCard from './DraftCard.svelte';
  import Flag from './Flag.svelte';
  import LiveCard from './LiveCard.svelte';
  import ShareCard from './ShareCard.svelte';
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
  const shareMounted = ui(store => store.shareMounted);
  const inspectSubscribed = ui(store => store.inspectSubscribed);
  const cacheEventsSeen = ui(store => store.cacheEventsSeen);
  const mutationEventsSeen = ui(store => store.mutationEventsSeen);
  const cacheEventFields = ui(store => store.cacheEventFields);
  const mutationEventFields = ui(store => store.mutationEventFields);

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
  // The client's observation surface and the environment's listener count are
  // snapshots too, so the tick names them the same way (DC8-8-12).
  const readInspect = (_tick: number) =>
    inspectPanel(model.client.inspectCache(), model.client.inspectMutations());
  const readEnvListeners = (_tick: number) => model.environment.listenerCount();
  $: requests = readRequests($tick);
  $: drafts = readDrafts($draftGeneration);
  $: inspect = readInspect($tick);
  $: envListeners = readEnvListeners($tick);
  // The second client's card. Same key, different client (DC8-8-18); read
  // through the tick rather than a connector (DC8-8-19).
  const readProbe = (_tick: number) => model.probe();
  $: probe = readProbe($tick);
  // The second display's card. Its `state` row and its closed/released value
  // rows are snapshots; the open rows come from the connector (DC8-8-33).
  const readShare = (_tick: number, _mounted: boolean) => model.share();
  const readShareWatch = (_tick: number, _mounted: boolean) =>
    model.shareWatch();
  $: share = readShare($tick, $shareMounted);
  $: shareWatch = readShareWatch($tick, $shareMounted);
  // The boundary card. One draft slot over a child ref or the readonly query;
  // read through the tick for the same reason the probe card is (DC8-8-19).
  const readBoundary = (_tick: number) => model.boundary();
  $: boundary = readBoundary($tick);
  // The screen-wide unsaved sum, and the readonly query's own review surface.
  // Both are non-reactive calls, so they follow the tick like the tables do.
  const readUnsaved = (_tick: number) => model.unsaved();
  $: unsaved = readUnsaved($tick);
  const readLifetime = (_tick: number) => model.lifetime();
  $: lifetime = readLifetime($tick);
  const readReadonlyPanel = (_tick: number, status: QueryStatus) =>
    resourcePanel(status, model.readonlyQuery.changes());
  $: readonlyPanel = readReadonlyPanel($tick, $readonlyStatus);
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
      <!-- Beside the parents' own `dirty`, never instead of it (M2-16 항목 2). -->
      <Flag field="unsaved" on={unsaved} />
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

    <section class="card" data-card="inspect">
      <h2>{CARD_TITLE.inspect}</h2>
      <Row field="cacheSize" value={inspect.cacheSize} />
      <Row field="cacheOwners" value={inspect.cacheOwners} />
      <Row field="openMutations" value={inspect.openMutations} />
      <Flag field="inspectSubscribed" on={$inspectSubscribed} />
      <Row
        field="observedEvents"
        value={`${$cacheEventsSeen} / ${$mutationEventsSeen}`}
      />
      <Row field="cacheEventFields" value={$cacheEventFields} />
      <Row field="mutationEventFields" value={$mutationEventFields} />
      <Row field="envListeners" value={envListeners} />
      <table>
        <thead>
          <tr>
            <th>key</th>
            <th>kind</th>
            <th>소유자</th>
            <th>status / fetch</th>
          </tr>
        </thead>
        <tbody>
          {#each inspect.cache as row (row.key)}
            <tr data-cache={row.key}>
              <td data-cell="key">{row.key}</td>
              <td data-cell="kind">{row.kind}</td>
              <td data-cell="owners">{row.owners}</td>
              <td data-cell="status">{row.status}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      {#if inspect.mutations.length === 0}
        <p class="note">미종료 WRITE 없음</p>
      {:else}
        <table>
          <thead>
            <tr>
              <th>작업</th>
              <th>phase</th>
              <th>scope</th>
              <th>시도</th>
              <th>idempotent</th>
              <th>연결된 key</th>
            </tr>
          </thead>
          <tbody>
            {#each inspect.mutations as row (row.id)}
              <tr data-mutation={row.id}>
                <td data-cell="id">{row.id}</td>
                <td data-cell="phase">{row.phase}</td>
                <td data-cell="scope">{row.scope}</td>
                <td data-cell="attempt">{row.attempt}</td>
                <td data-cell="idempotent">{String(row.idempotent)}</td>
                <td data-cell="linked">{row.linked}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
      <p class="note">
        모두 client의 공개 관측 표면이다. 이벤트에는 조회 값과 입력 DTO가 없고,
        구독을 해제하면 이후 이벤트가 오지 않는다.
      </p>
    </section>

    {#if probe}
      <section class="card" data-card="probe">
        <h2>{CARD_TITLE.probe}</h2>
        <Row field="probeState" value={probe.state} />
        <Row field="status" value={probe.status} />
        <Row field="dirty" value={probe.dirty} />
        <Row field="version" value={probe.version} />
        {#if probe.city !== null}
          <Row field="city" value={probe.city} />
        {/if}
        <Row field="cacheSize" value={probe.cacheSize} />
        <Row field="cacheOwners" value={probe.cacheOwners} />
        <Row field="observedEvents" value={probe.events} />
        <table>
          <thead>
            <tr>
              <th>key</th>
              <th>kind</th>
              <th>소유자</th>
              <th>status / fetch</th>
            </tr>
          </thead>
          <tbody>
            {#each probe.cache as row (row.key)}
              <tr data-cache={row.key}>
                <td data-cell="key">{row.key}</td>
                <td data-cell="kind">{row.kind}</td>
                <td data-cell="owners">{row.owners}</td>
                <td data-cell="status">{row.status}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        <p class="note">
          같은 key를 보지만 캐시가 다르다. 이 client의 편집·기준·요청은 패널 두
          장과 공유되지 않고, 해제하면 이 client의 환경 listener만 사라진다.
        </p>
      </section>
    {/if}

    {#if share}
      <section class="card" data-card="share">
        <h2>{CARD_TITLE.share}</h2>
        <Row field="shareState" value={share.state} />
        {#if $shareMounted && shareWatch}
          <ShareCard watch={shareWatch} />
        {:else}
          <Row field="livePhase" value={share.phase} />
          <Row field="liveCity" value={share.city} />
        {/if}
        <p class="note">
          화면을 닫으면 이 컴포넌트의 구독만 끝나고 공유 view는 남는다. 소유자가
          줄어드는 것은 view를 해제했을 때뿐이다.
        </p>
      </section>
    {/if}

    <section class="card" data-card="lifetime">
      <h2>{CARD_TITLE.lifetime}</h2>
      <Row field="draftCycles" value={lifetime.cycles} />
      <Row field="draftLive" value={lifetime.live} />
      <Row field="draftNotices" value={lifetime.notices} />
      <Row field="retainedBy" value={lifetime.retainedBy} />
      <Row field="heldRef" value={lifetime.heldRef} />
      <Row field="serverless" value={lifetime.serverless} />
      <p class="note">
        반복이 남긴 것이 없으면 원본을 고쳐도 깨어나는 draft가 0이다. 살려 둔
        draft가 있으면 그 수만큼 깨어난다 — 0과 2를 가르는 것이 이 행의 내용이다.
      </p>
    </section>

    <section class="card" data-card="readonly">
      <h2>{CARD_TITLE.readonly}</h2>
      <Row
        field="status"
        value={`${readonlyPanel.status} / ${readonlyPanel.fetchStatus}`}
      />
      <Flag field="dirty" on={readonlyPanel.dirty} />
      <Row
        field="version"
        value={`${readonlyPanel.version} / ${readonlyPanel.conflicts}`}
      />
      <ChangesTable rows={readonlyPanel.changes} />
      <p class="note">
        검토 목록과 version은 있고 영원히 비어 있다. 쓰기도 제출 고정도 거절하므로
        여기에 쌓일 것이 없다 — 다른 조회의 항목을 여기로 가져올 수도 없다.
      </p>
    </section>

    {#if boundary}
      <section class="card" data-card="boundary">
        <h2>{CARD_TITLE.boundary}</h2>
        <Row field="boundarySource" value={boundary.source} />
        <Row field="boundaryValue" value={boundary.value} />
        <Row field="draftDirty" value={boundary.dirty} />
        <Row field="version" value={boundary.version} />
        <ChangesTable rows={boundary.changes} />
        <p class="note">
          분기도 편집도 어느 원본에서나 된다. 갈리는 것은 적용이다 — 부모가
          사라진 원본은 missing-source, 타입이 바뀐 원본은 conflict, readonly
          원본은 readonly로 거절하고, 어느 쪽도 원본을 바꾸지 않으며 draft의
          입력도 남는다.
        </p>
      </section>
    {/if}
  </div>
</main>
