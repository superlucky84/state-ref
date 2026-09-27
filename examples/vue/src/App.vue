<script setup lang="ts">
import { computed } from 'vue';
import { connectVue } from '@stateref/connect-vue';
import {
  CARD_TITLE,
  OPERATION_GROUPS,
  POLICY_TEXT,
  inspectPanel,
  requestPanel,
  resourcePanel,
} from 'stateref-example-shared';
import type { OperationId } from 'stateref-example-shared';
import { model } from './demo-model';
import ChangesTable from './ChangesTable.vue';
import DraftCard from './DraftCard.vue';
import Flag from './Flag.vue';
import LiveCard from './LiveCard.vue';
import ResourceCard from './ResourceCard.vue';
import Row from './Row.vue';
import 'stateref-example-shared/demo.css';

/**
 * The Vue demo (step 4 of docs/server-sync/PHASE8_5.md).
 *
 * Same model and operations as the React demo. The difference on screen
 * should come from `connectVue` selecting a leaf per binding, which is what
 * M2-20 compares across the five connectors.
 */
const ui = connectVue(model.watchUi)(store => store);
const mutation = connectVue(model.mutation.watchStatus)(store => store);
const readonlyStatus = connectVue(model.readonlyQuery.watchStatus)(
  store => store
);

// The mock server is not reactive: reading the tick is what repaints this.
const requests = computed(() => {
  void ui.value.tick;
  return requestPanel(model.server);
});
const drafts = computed(() => {
  void ui.value.draftGeneration;
  return model.drafts();
});
// The client's observation surface is a snapshot as well, and so is the
// environment's listener count: the tick repaints both (DC8-8-12).
const inspect = computed(() => {
  void ui.value.tick;
  return inspectPanel(
    model.client.inspectCache(),
    model.client.inspectMutations()
  );
});
const envListeners = computed(() => {
  void ui.value.tick;
  return model.environment.listenerCount();
});
// The second client's card. Same key, different client (DC8-8-18); read through
// the tick rather than a connector (DC8-8-19).
const probe = computed(() => {
  void ui.value.tick;
  return model.probe();
});
// The screen-wide unsaved sum, and the readonly query's own review surface.
// Both are non-reactive calls, so they follow the tick like the tables do.
const unsaved = computed(() => {
  void ui.value.tick;
  return model.unsaved();
});
const lifetime = computed(() => {
  void ui.value.tick;
  return model.lifetime();
});
const readonlyPanel = computed(() => {
  void ui.value.tick;
  return resourcePanel(readonlyStatus.value, model.readonlyQuery.changes());
});

// The boundary card. One draft slot over a child ref or the readonly query;
// read through the tick for the same reason the probe card is (DC8-8-19).
const boundary = computed(() => {
  void ui.value.tick;
  return model.boundary();
});

const run = (id: string) => model.run(id as OperationId);
const time = (at: number | null) =>
  at ? new Date(at).toLocaleTimeString() : '-';
</script>

<template>
  <main>
    <h1>state-ref — Vue 서버 동기화 데모</h1>
    <p class="note">
      수동 체크리스트 1절의 fixture를 그대로 쓴다. 실제 서버는 없다.
    </p>
    <div class="grid">
      <section v-for="group in OPERATION_GROUPS" :key="group.id" class="card">
        <h2>{{ group.title }}</h2>
        <button
          v-for="[id, label] in group.operations"
          :key="id"
          :data-operation="id"
          @click="run(id)"
        >
          {{ label }}
        </button>
      </section>

      <section class="card" data-card="requests">
        <h2>{{ CARD_TITLE.requests }}</h2>
        <Row
          field="server"
          :value="`${requests.serverCity} / ${requests.serverRevision}`"
        />
        <Row
          field="counts"
          :value="`${requests.readCount} / ${requests.writeCount}`"
        />
        <Row field="inFlight" :value="requests.inFlight" />
        <table>
          <thead>
            <tr>
              <th>요청 ID</th>
              <th>key</th>
              <th>revision</th>
              <th>결과</th>
              <th>시작</th>
              <th>종료</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in requests.rows"
              :key="row.id"
              :data-request="row.id"
            >
              <td>{{ row.id }}</td>
              <td data-cell="key">{{ row.key }}</td>
              <td data-cell="revision">{{ row.revision }}</td>
              <td
                data-cell="outcome"
                :class="row.outcome === 'in-flight' ? 'flag-on' : ''"
              >
                {{ row.outcome }}
              </td>
              <td>{{ time(row.startedAt) }}</td>
              <td>{{ time(row.settledAt) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="card" data-card="operations">
        <h2>{{ CARD_TITLE.operations }}</h2>
        <Row field="lastOperation" :value="ui.value.lastOperation" />
        <Row field="lastResult" :value="ui.value.lastResult" />
        <Row field="captured" :value="ui.value.captured ?? '(없음)'" />
        <Row field="mutationPhase" :value="mutation.value.phase" />
        <Row field="mutationPending" :value="mutation.value.pending" />
        <Row field="readonlyStatus" :value="readonlyStatus.value.status" />
        <!-- Beside the parents' own `dirty`, never instead of it (M2-16 항목 2). -->
        <Flag field="unsaved" :on="unsaved" />
        <Flag field="focused" :on="ui.value.focused" />
        <Flag field="online" :on="ui.value.online" />
        <Row field="policy" :value="POLICY_TEXT" />
        <p class="note">
          staleTime과 interval은 실제 시간으로 흐른다. fixture가 제어하는 것은
          환경 사건과 요청 완료 시점이다.
        </p>
      </section>

      <ResourceCard card="resource-a" which="a" />
      <ResourceCard card="resource-b" which="b" />

      <section v-if="!drafts.a && !drafts.b" class="card">
        <h2>draft 값과 변경</h2>
        <p class="note">아직 분기하지 않았다. 원본을 먼저 편집해 보라.</p>
      </section>
      <DraftCard
        v-if="drafts.a"
        :key="`a-${drafts.generation}`"
        card="draft-a"
        :draft="drafts.a"
      />
      <DraftCard
        v-if="drafts.b"
        :key="`b-${drafts.generation}`"
        card="draft-b"
        :draft="drafts.b"
      />

      <section class="card" data-card="live">
        <h2>{{ CARD_TITLE.live }}</h2>
        <LiveCard v-if="!ui.value.liveDisposed" />
        <template v-else>
          <Row field="liveKey" value="(해제됨)" />
          <Row field="liveEnabled" value="(해제됨)" />
          <Row field="livePhase" value="(해제됨)" />
          <Row field="liveCity" value="(해제됨)" />
        </template>
        <p class="note">
          원본이 key를 가리키지 않으면 비활성이고 조회 핸들이 없다. key를 바꾸면
          이전 key의 조회는 마지막 소유자였을 때 취소된다.
        </p>
      </section>

      <section class="card" data-card="computed">
        <h2>{{ CARD_TITLE.computed }}</h2>
        <Row field="computedValue" :value="ui.value.computedValue" />
        <Row
          field="computedCalculations"
          :value="ui.value.computedCalculations"
        />
        <Flag field="computedIdentity" :on="ui.value.computedIdentityStable" />
        <Row field="computedSubscribed" :value="ui.value.computedSubscribed" />
        <p class="note">
          구독 없는 읽기는 sync() 전에도 최신 값을 본다. 구독 콜백은 sync()에서
          알림을 받는다.
        </p>
      </section>

      <section class="card" data-card="inspect">
        <h2>{{ CARD_TITLE.inspect }}</h2>
        <Row field="cacheSize" :value="inspect.cacheSize" />
        <Row field="cacheOwners" :value="inspect.cacheOwners" />
        <Row field="openMutations" :value="inspect.openMutations" />
        <Flag field="inspectSubscribed" :on="ui.value.inspectSubscribed" />
        <Row
          field="observedEvents"
          :value="`${ui.value.cacheEventsSeen} / ${ui.value.mutationEventsSeen}`"
        />
        <Row field="cacheEventFields" :value="ui.value.cacheEventFields" />
        <Row
          field="mutationEventFields"
          :value="ui.value.mutationEventFields"
        />
        <Row field="envListeners" :value="envListeners" />
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
            <tr
              v-for="row in inspect.cache"
              :key="row.key"
              :data-cache="row.key"
            >
              <td data-cell="key">{{ row.key }}</td>
              <td data-cell="kind">{{ row.kind }}</td>
              <td data-cell="owners">{{ row.owners }}</td>
              <td data-cell="status">{{ row.status }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="inspect.mutations.length === 0" class="note">
          미종료 WRITE 없음
        </p>
        <table v-else>
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
            <tr
              v-for="row in inspect.mutations"
              :key="row.id"
              :data-mutation="row.id"
            >
              <td data-cell="id">{{ row.id }}</td>
              <td data-cell="phase">{{ row.phase }}</td>
              <td data-cell="scope">{{ row.scope }}</td>
              <td data-cell="attempt">{{ row.attempt }}</td>
              <td data-cell="idempotent">{{ String(row.idempotent) }}</td>
              <td data-cell="linked">{{ row.linked }}</td>
            </tr>
          </tbody>
        </table>
        <p class="note">
          모두 client의 공개 관측 표면이다. 이벤트에는 조회 값과 입력 DTO가
          없고, 구독을 해제하면 이후 이벤트가 오지 않는다.
        </p>
      </section>

      <section v-if="probe" class="card" data-card="probe">
        <h2>{{ CARD_TITLE.probe }}</h2>
        <Row field="probeState" :value="probe.state" />
        <Row field="status" :value="probe.status" />
        <Row field="dirty" :value="probe.dirty" />
        <Row field="version" :value="probe.version" />
        <Row v-if="probe.city !== null" field="city" :value="probe.city" />
        <Row field="cacheSize" :value="probe.cacheSize" />
        <Row field="cacheOwners" :value="probe.cacheOwners" />
        <Row field="observedEvents" :value="probe.events" />
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
            <tr v-for="row in probe.cache" :key="row.key" :data-cache="row.key">
              <td data-cell="key">{{ row.key }}</td>
              <td data-cell="kind">{{ row.kind }}</td>
              <td data-cell="owners">{{ row.owners }}</td>
              <td data-cell="status">{{ row.status }}</td>
            </tr>
          </tbody>
        </table>
        <p class="note">
          같은 key를 보지만 캐시가 다르다. 이 client의 편집·기준·요청은 패널 두
          장과 공유되지 않고, 해제하면 이 client의 환경 listener만 사라진다.
        </p>
      </section>

      <section class="card" data-card="lifetime">
        <h2>{{ CARD_TITLE.lifetime }}</h2>
        <Row field="draftCycles" :value="lifetime.cycles" />
        <Row field="draftLive" :value="lifetime.live" />
        <Row field="draftNotices" :value="lifetime.notices" />
        <Row field="retainedBy" :value="lifetime.retainedBy" />
        <Row field="heldRef" :value="lifetime.heldRef" />
        <Row field="serverless" :value="lifetime.serverless" />
        <p class="note">
          반복이 남긴 것이 없으면 원본을 고쳐도 깨어나는 draft가 0이다. 살려 둔
          draft가 있으면 그 수만큼 깨어난다 — 0과 2를 가르는 것이 이 행의
          내용이다.
        </p>
      </section>

      <section class="card" data-card="readonly">
        <h2>{{ CARD_TITLE.readonly }}</h2>
        <Row
          field="status"
          :value="`${readonlyPanel.status} / ${readonlyPanel.fetchStatus}`"
        />
        <Flag field="dirty" :on="readonlyPanel.dirty" />
        <Row
          field="version"
          :value="`${readonlyPanel.version} / ${readonlyPanel.conflicts}`"
        />
        <ChangesTable :rows="readonlyPanel.changes" />
        <p class="note">
          검토 목록과 version은 있고 영원히 비어 있다. 쓰기도 제출 고정도
          거절하므로 여기에 쌓일 것이 없다 — 다른 조회의 항목을 여기로 가져올
          수도 없다.
        </p>
      </section>

      <section v-if="boundary" class="card" data-card="boundary">
        <h2>{{ CARD_TITLE.boundary }}</h2>
        <Row field="boundarySource" :value="boundary.source" />
        <Row field="boundaryValue" :value="boundary.value" />
        <Row field="draftDirty" :value="boundary.dirty" />
        <Row field="version" :value="boundary.version" />
        <ChangesTable :rows="boundary.changes" />
        <p class="note">
          분기도 편집도 어느 원본에서나 된다. 갈리는 것은 적용이다 — 부모가
          사라진 원본은 missing-source, 타입이 바뀐 원본은 conflict, readonly
          원본은 readonly로 거절하고, 어느 쪽도 원본을 바꾸지 않으며 draft의
          입력도 남는다.
        </p>
      </section>
    </div>
  </main>
</template>
