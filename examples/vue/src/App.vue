<script setup lang="ts">
import { computed } from 'vue';
import { connectVue } from '@stateref/connect-vue';
import {
  AUTO_REFETCH,
  OPERATION_GROUPS,
  requestPanel,
} from 'stateref-example-shared';
import type { OperationId } from 'stateref-example-shared';
import { model } from './demo-model';
import DraftCard from './DraftCard.vue';
import ResourceCard from './ResourceCard.vue';
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
const policy = `staleTime ${AUTO_REFETCH.staleTime}ms · focus ${AUTO_REFETCH.refetchOnFocus} · reconnect ${AUTO_REFETCH.refetchOnReconnect} · interval ${AUTO_REFETCH.refetchInterval}`;

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

      <section class="card">
        <h2>서버 상태와 요청 기록</h2>
        <div class="row">
          <span>서버 도시 / revision</span>
          <b>{{ requests.serverCity }} / {{ requests.serverRevision }}</b>
        </div>
        <div class="row">
          <span>READ / WRITE 횟수</span>
          <b>{{ requests.readCount }} / {{ requests.writeCount }}</b>
        </div>
        <div class="row">
          <span>진행 중</span><b>{{ requests.inFlight }}</b>
        </div>
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
            <tr v-for="row in requests.rows" :key="row.id">
              <td>{{ row.id }}</td>
              <td>{{ row.key }}</td>
              <td>{{ row.revision }}</td>
              <td :class="row.outcome === 'in-flight' ? 'flag-on' : ''">
                {{ row.outcome }}
              </td>
              <td>{{ time(row.startedAt) }}</td>
              <td>{{ time(row.settledAt) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="card">
        <h2>작업과 정책</h2>
        <div class="row">
          <span>마지막 조작</span><b>{{ ui.value.lastOperation }}</b>
        </div>
        <div class="row">
          <span>결과</span><b>{{ ui.value.lastResult }}</b>
        </div>
        <div class="row">
          <span>고정한 제출</span><b>{{ ui.value.captured ?? '(없음)' }}</b>
        </div>
        <div class="row">
          <span>mutation phase</span><b>{{ mutation.value.phase }}</b>
        </div>
        <div class="row">
          <span>진행 중 WRITE</span><b>{{ mutation.value.pending }}</b>
        </div>
        <div class="row">
          <span>readonly 조회 status</span>
          <b>{{ readonlyStatus.value.status }}</b>
        </div>
        <div class="row">
          <span>focused</span>
          <b :class="ui.value.focused ? 'flag-on' : 'flag-off'">
            {{ ui.value.focused }}
          </b>
        </div>
        <div class="row">
          <span>online</span>
          <b :class="ui.value.online ? 'flag-on' : 'flag-off'">
            {{ ui.value.online }}
          </b>
        </div>
        <div class="row">
          <span>자동 조회 정책</span><b>{{ policy }}</b>
        </div>
        <p class="note">
          staleTime과 interval은 실제 시간으로 흐른다. fixture가 제어하는 것은
          환경 사건과 요청 완료 시점이다.
        </p>
      </section>

      <ResourceCard title="resource 패널 A (key: profile)" which="a" />
      <ResourceCard title="resource 패널 B (같은 key)" which="b" />

      <section v-if="!drafts.a && !drafts.b" class="card">
        <h2>draft 값과 변경</h2>
        <p class="note">아직 분기하지 않았다. 원본을 먼저 편집해 보라.</p>
      </section>
      <DraftCard
        v-if="drafts.a"
        :key="`a-${drafts.generation}`"
        title="draft A"
        :draft="drafts.a"
      />
      <DraftCard
        v-if="drafts.b"
        :key="`b-${drafts.generation}`"
        title="draft B"
        :draft="drafts.b"
      />

      <section class="card">
        <h2>computed 읽기 결과</h2>
        <div class="row">
          <span>현재 값</span><b>{{ ui.value.computedValue }}</b>
        </div>
        <div class="row">
          <span>계산 실행 횟수</span><b>{{ ui.value.computedCalculations }}</b>
        </div>
        <div class="row">
          <span>직전 읽기와 같은 객체</span>
          <b :class="ui.value.computedIdentityStable ? 'flag-on' : 'flag-off'">
            {{ ui.value.computedIdentityStable }}
          </b>
        </div>
        <div class="row">
          <span>구독 콜백이 본 값</span><b>{{ ui.value.computedSubscribed }}</b>
        </div>
        <p class="note">
          구독 없는 읽기는 sync() 전에도 최신 값을 본다. 구독 콜백은 sync()에서
          알림을 받는다.
        </p>
      </section>
    </div>
  </main>
</template>
