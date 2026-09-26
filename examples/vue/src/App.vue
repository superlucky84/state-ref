<script setup lang="ts">
import { computed } from 'vue';
import { connectVue } from '@stateref/connect-vue';
import {
  CARD_TITLE,
  OPERATION_GROUPS,
  POLICY_TEXT,
  requestPanel,
} from 'stateref-example-shared';
import type { OperationId } from 'stateref-example-shared';
import { model } from './demo-model';
import DraftCard from './DraftCard.vue';
import Flag from './Flag.vue';
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
    </div>
  </main>
</template>
