import { For, Show, createMemo } from 'solid-js';
import { connectSolid } from '@stateref/connect-solid';
import type { Draft } from 'state-ref/draft';
import {
  AUTO_REFETCH,
  OPERATION_GROUPS,
  createDemoModel,
  draftPanel,
  requestPanel,
  resourcePanel,
} from 'stateref-example-shared';
import type { ChangeLine, OperationId, Profile } from 'stateref-example-shared';
import 'stateref-example-shared/demo.css';

/**
 * The Solid demo (step 4 of docs/server-sync/PHASE8_5.md).
 *
 * Same model and operations as the React demo; `connectSolid` hands back a
 * signal per selected leaf, so the bindings are getter/setter pairs.
 */
const model = createDemoModel();

function Row(props: { label: string; value: unknown }) {
  return (
    <div class="row">
      <span>{props.label}</span>
      <b>
        {typeof props.value === 'string'
          ? props.value
          : JSON.stringify(props.value)}
      </b>
    </div>
  );
}

function Flag(props: { label: string; on: boolean }) {
  return (
    <div class="row">
      <span>{props.label}</span>
      <b class={props.on ? 'flag-on' : 'flag-off'}>
        {props.on ? 'true' : 'false'}
      </b>
    </div>
  );
}

function Changes(props: { rows: readonly ChangeLine[] }) {
  return (
    <Show when={props.rows.length > 0} fallback={<p class="note">변경 없음</p>}>
      <table>
        <thead>
          <tr>
            <th>id</th>
            <th>경로</th>
            <th>before</th>
            <th>after</th>
            <th>충돌</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.rows}>
            {row => (
              <tr>
                <td>{row.id}</td>
                <td>{row.path}</td>
                <td>{row.before}</td>
                <td>{row.after}</td>
                <td class={row.conflict ? 'bad' : ''}>
                  {row.conflict ? 'conflict' : '-'}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </Show>
  );
}

/** Created only once the query has loaded: `query.watch` throws before that. */
function ResourceValues(props: { which: 'a' | 'b' }) {
  const source = connectSolid(
    props.which === 'a' ? model.panelA.watch : model.panelB.watch
  );
  const [city, setCity] = source(store => store.city);
  const [zip] = source(store => store.zip);
  const [memo] = source(store => store.memo);
  const [contacts] = source(store => store.contacts);
  const [office] = source(store => store.office);

  return (
    <>
      <div class="row">
        <span>도시</span>
        <input
          value={city()}
          onInput={event => setCity(event.currentTarget.value)}
        />
      </div>
      <Row label="우편번호" value={zip()} />
      <Row label="메모" value={memo()} />
      <Row
        label="연락처"
        value={contacts()
          .map(c => c.name)
          .join(',')}
      />
      <Row label="사무실" value={office() ?? '(없음)'} />
    </>
  );
}

function ResourceCard(props: { title: string; which: 'a' | 'b' }) {
  const handle = props.which === 'a' ? model.panelA : model.panelB;
  const [status] = connectSolid(handle.watchStatus)(store => store);
  const panel = createMemo(() =>
    resourcePanel(status(), status().loaded ? handle.changes() : [])
  );

  return (
    <section class="card">
      <h2>{props.title}</h2>
      <Show
        when={panel().loaded}
        fallback={
          <p class="note">
            {panel().status === 'error'
              ? `오류: ${panel().errorText}`
              : '아직 로드되지 않았다. 여기에 가짜 성공 값을 보이지 않는다.'}
          </p>
        }
      >
        <ResourceValues which={props.which} />
      </Show>
      <Row
        label="status / fetch"
        value={`${panel().status} / ${panel().fetchStatus}`}
      />
      <Flag label="dirty (로컬 차이)" on={panel().dirty} />
      <Flag label="serverBusy (진행 중 WRITE)" on={panel().serverBusy} />
      <Flag label="unconfirmed (미확정)" on={panel().unconfirmed} />
      <Flag label="invalidated" on={panel().invalidated} />
      <Row
        label="version / conflicts"
        value={`${panel().version} / ${panel().conflicts}`}
      />
      <Changes rows={panel().changes} />
    </section>
  );
}

function DraftCard(props: { title: string; draft: Draft<Profile> }) {
  const value = connectSolid(props.draft.watch);
  const [city, setCity] = value(store => store.city);
  const [zip] = value(store => store.zip);
  const [status] = connectSolid(props.draft.watchStatus)(store => store);
  const panel = createMemo(() => draftPanel(status(), props.draft.changes()));

  return (
    <section class="card">
      <h2>{props.title}</h2>
      <div class="row">
        <span>도시</span>
        <input
          value={city()}
          onInput={event => setCity(event.currentTarget.value)}
        />
      </div>
      <Row label="우편번호" value={zip()} />
      <Flag label="dirty" on={panel().dirty} />
      <Row
        label="version / conflicts"
        value={`${panel().version} / ${panel().conflicts}`}
      />
      <Changes rows={panel().changes} />
    </section>
  );
}

export default function App() {
  const ui = connectSolid(model.watchUi);
  const [tick] = ui(store => store.tick);
  const [draftGeneration] = ui(store => store.draftGeneration);
  const [lastOperation] = ui(store => store.lastOperation);
  const [lastResult] = ui(store => store.lastResult);
  const [captured] = ui(store => store.captured);
  const [focused] = ui(store => store.focused);
  const [online] = ui(store => store.online);
  const [computedValue] = ui(store => store.computedValue);
  const [computedCalculations] = ui(store => store.computedCalculations);
  const [computedIdentityStable] = ui(store => store.computedIdentityStable);
  const [computedSubscribed] = ui(store => store.computedSubscribed);
  const [mutation] = connectSolid(model.mutation.watchStatus)(store => store);
  const [readonlyStatus] = connectSolid(model.readonlyQuery.watchStatus)(
    store => store
  );

  // The mock server is not reactive: reading the tick is what repaints these.
  const requests = createMemo(() => {
    void tick();
    return requestPanel(model.server);
  });
  const drafts = createMemo(() => {
    void draftGeneration();
    return model.drafts();
  });
  const time = (at: number | null) =>
    at ? new Date(at).toLocaleTimeString() : '-';

  return (
    <main>
      <h1>state-ref — Solid 서버 동기화 데모</h1>
      <p class="note">
        수동 체크리스트 1절의 fixture를 그대로 쓴다. 실제 서버는 없다.
      </p>
      <div class="grid">
        <For each={OPERATION_GROUPS}>
          {group => (
            <section class="card">
              <h2>{group.title}</h2>
              <For each={group.operations}>
                {([id, label]) => (
                  <button
                    data-operation={id}
                    onClick={() => model.run(id as OperationId)}
                  >
                    {label}
                  </button>
                )}
              </For>
            </section>
          )}
        </For>

        <section class="card">
          <h2>서버 상태와 요청 기록</h2>
          <Row
            label="서버 도시 / revision"
            value={`${requests().serverCity} / ${requests().serverRevision}`}
          />
          <Row
            label="READ / WRITE 횟수"
            value={`${requests().readCount} / ${requests().writeCount}`}
          />
          <Row label="진행 중" value={requests().inFlight} />
          <table>
            <thead>
              <tr>
                <th>요청 ID</th>
                <th>revision</th>
                <th>결과</th>
                <th>시작</th>
                <th>종료</th>
              </tr>
            </thead>
            <tbody>
              <For each={requests().rows}>
                {row => (
                  <tr>
                    <td>{row.id}</td>
                    <td>{row.revision}</td>
                    <td class={row.outcome === 'in-flight' ? 'flag-on' : ''}>
                      {row.outcome}
                    </td>
                    <td>{time(row.startedAt)}</td>
                    <td>{time(row.settledAt)}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </section>

        <section class="card">
          <h2>작업과 정책</h2>
          <Row label="마지막 조작" value={lastOperation()} />
          <Row label="결과" value={lastResult()} />
          <Row label="고정한 제출" value={captured() ?? '(없음)'} />
          <Row label="mutation phase" value={mutation().phase} />
          <Row label="진행 중 WRITE" value={mutation().pending} />
          <Row label="readonly 조회 status" value={readonlyStatus().status} />
          <Flag label="focused" on={focused()} />
          <Flag label="online" on={online()} />
          <Row
            label="자동 조회 정책"
            value={`staleTime ${AUTO_REFETCH.staleTime}ms · focus ${AUTO_REFETCH.refetchOnFocus} · reconnect ${AUTO_REFETCH.refetchOnReconnect} · interval ${AUTO_REFETCH.refetchInterval}`}
          />
          <p class="note">
            staleTime과 interval은 실제 시간으로 흐른다. fixture가 제어하는 것은
            환경 사건과 요청 완료 시점이다.
          </p>
        </section>

        <ResourceCard title="resource 패널 A (key: profile)" which="a" />
        <ResourceCard title="resource 패널 B (같은 key)" which="b" />

        <Show when={!drafts().a && !drafts().b}>
          <section class="card">
            <h2>draft 값과 변경</h2>
            <p class="note">아직 분기하지 않았다. 원본을 먼저 편집해 보라.</p>
          </section>
        </Show>
        <Show when={drafts().a} keyed>
          {draft => <DraftCard title="draft A" draft={draft} />}
        </Show>
        <Show when={drafts().b} keyed>
          {draft => <DraftCard title="draft B" draft={draft} />}
        </Show>

        <section class="card">
          <h2>computed 읽기 결과</h2>
          <Row label="현재 값" value={computedValue()} />
          <Row label="계산 실행 횟수" value={computedCalculations()} />
          <Flag label="직전 읽기와 같은 객체" on={computedIdentityStable()} />
          <Row label="구독 콜백이 본 값" value={computedSubscribed()} />
          <p class="note">
            구독 없는 읽기는 sync() 전에도 최신 값을 본다. 구독 콜백은
            sync()에서 알림을 받는다.
          </p>
        </section>
      </div>
    </main>
  );
}
