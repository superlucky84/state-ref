import { useMemo } from 'react';
import { connectReact } from '@stateref/connect-react';
import type { StateRefStore } from 'state-ref';
import type { QueryStatus, ResourceChange } from '@stateref/sync';
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
 * The React reference demo for the server-sync manual checklist
 * (docs/server-sync/PHASE8_5.md, step 3).
 *
 * Everything the screen does lives in `createDemoModel()`; this file only
 * connects watches and renders. The editable `connectReact` drives a server
 * resource and a branched draft alike, because `query.watch` and
 * `draft.watch` are both plain `Watch<T>` (DC8-06 in PHASE8.md).
 */
const model = createDemoModel();

// Status watches are safe from the start. `query.watch` is NOT: touching it
// before the first load throws, so the hooks that read values are built on
// demand and only used by components that mount once `status.loaded` is true.
const useUi = connectReact(model.watchUi);
const useStatusA = connectReact(model.panelA.watchStatus);
const useStatusB = connectReact(model.panelB.watchStatus);
const useReadonlyStatus = connectReact(model.readonlyQuery.watchStatus);
const useMutationStatus = connectReact(model.mutation.watchStatus);

const lazyHooks = new Map<string, () => StateRefStore<Profile>>();
const sourceHook = (name: 'a' | 'b') => {
  const existing = lazyHooks.get(name);
  if (existing) return existing;
  const hook = connectReact(
    name === 'a' ? model.panelA.watch : model.panelB.watch
  );
  lazyHooks.set(name, hook);
  return hook;
};

function Row({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="row">
      <span>{label}</span>
      <b>{typeof value === 'string' ? value : JSON.stringify(value)}</b>
    </div>
  );
}

function Flag({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="row">
      <span>{label}</span>
      <b className={on ? 'flag-on' : 'flag-off'}>{on ? 'true' : 'false'}</b>
    </div>
  );
}

function Changes({ rows }: { rows: readonly ChangeLine[] }) {
  if (rows.length === 0) return <p className="note">변경 없음</p>;
  return (
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
        {rows.map(row => (
          <tr key={row.id}>
            <td>{row.id}</td>
            <td>{row.path}</td>
            <td>{row.before}</td>
            <td>{row.after}</td>
            <td className={row.conflict ? 'bad' : ''}>
              {row.conflict ? 'conflict' : '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * One resource panel. Two of these run on the same query key, so the shared
 * baseline and the shared edits are visible side by side (M2-03).
 */
/** Mounted only once the query has loaded; it is the only reader of `ref`. */
function ResourceValues({ slot }: { slot: 'a' | 'b' }) {
  const useSource = sourceHook(slot);
  const source = useSource();
  return (
    <>
      <div className="row">
        <span>도시</span>
        <input
          value={source.city.value}
          onChange={event => {
            source.city.value = event.target.value;
          }}
        />
      </div>
      <Row label="우편번호" value={source.zip.value} />
      <Row label="메모" value={source.memo.value} />
      <Row
        label="연락처"
        value={source.contacts.value.map(contact => contact.name).join(',')}
      />
      <Row label="사무실" value={source.office.value ?? '(없음)'} />
    </>
  );
}

function ResourceCard({
  title,
  slot,
  useStatus,
  changes,
}: {
  title: string;
  slot: 'a' | 'b';
  useStatus: () => StateRefStore<QueryStatus>;
  changes: () => readonly ResourceChange[];
}) {
  const status = useStatus();
  const panel = resourcePanel(
    status.value,
    status.loaded.value ? changes() : []
  );

  return (
    <section className="card">
      <h2>{title}</h2>
      {!panel.loaded ? (
        <p className="note">
          {panel.status === 'error'
            ? `오류: ${panel.errorText}`
            : '아직 로드되지 않았다. 여기에 가짜 성공 값을 보이지 않는다.'}
        </p>
      ) : (
        <ResourceValues slot={slot} />
      )}
      <Row
        label="status / fetch"
        value={`${panel.status} / ${panel.fetchStatus}`}
      />
      <Flag label="dirty (로컬 차이)" on={panel.dirty} />
      <Flag label="serverBusy (진행 중 WRITE)" on={panel.serverBusy} />
      <Flag label="unconfirmed (미확정)" on={panel.unconfirmed} />
      <Flag label="invalidated" on={panel.invalidated} />
      <Row
        label="version / conflicts"
        value={`${panel.version} / ${panel.conflicts}`}
      />
      <Changes rows={panel.changes} />
    </section>
  );
}

/** One draft branched off the resource. Its input never reaches the source. */
function DraftCard({ title, draft }: { title: string; draft: Draft<Profile> }) {
  const useValue = useMemo(() => connectReact(draft.watch), [draft]);
  const useStatus = useMemo(() => connectReact(draft.watchStatus), [draft]);
  const value = useValue();
  const status = useStatus();
  const panel = draftPanel(status.value, draft.changes());

  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="row">
        <span>도시</span>
        <input
          value={value.city.value}
          onChange={event => {
            value.city.value = event.target.value;
          }}
        />
      </div>
      <Row label="우편번호" value={value.zip.value} />
      <Flag label="dirty" on={panel.dirty} />
      <Row
        label="version / conflicts"
        value={`${panel.version} / ${panel.conflicts}`}
      />
      <Changes rows={panel.changes} />
    </section>
  );
}

function DraftSection() {
  const ui = useUi();
  // Reading the generation is what re-runs this section when the drafts are
  // branched again or discarded.
  const generation = ui.draftGeneration.value;
  const drafts = model.drafts();

  if (!drafts.a && !drafts.b) {
    return (
      <section className="card">
        <h2>draft 값과 변경</h2>
        <p className="note">아직 분기하지 않았다. 원본을 먼저 편집해 보라.</p>
      </section>
    );
  }
  return (
    <>
      {drafts.a && (
        <DraftCard key={`a-${generation}`} title="draft A" draft={drafts.a} />
      )}
      {drafts.b && (
        <DraftCard key={`b-${generation}`} title="draft B" draft={drafts.b} />
      )}
    </>
  );
}

function ServerCard() {
  const ui = useUi();
  ui.tick.value; // Subscribe: the mock server itself is not reactive.
  const panel = requestPanel(model.server);

  return (
    <section className="card">
      <h2>서버 상태와 요청 기록</h2>
      <Row
        label="서버 도시 / revision"
        value={`${panel.serverCity} / ${panel.serverRevision}`}
      />
      <Row
        label="READ / WRITE 횟수"
        value={`${panel.readCount} / ${panel.writeCount}`}
      />
      <Row label="진행 중" value={panel.inFlight} />
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
          {panel.rows.map(row => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.revision}</td>
              <td className={row.outcome === 'in-flight' ? 'flag-on' : ''}>
                {row.outcome}
              </td>
              <td>{new Date(row.startedAt).toLocaleTimeString()}</td>
              <td>
                {row.settledAt
                  ? new Date(row.settledAt).toLocaleTimeString()
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function StateCard() {
  const ui = useUi();
  const mutation = useMutationStatus();
  const readonlyStatus = useReadonlyStatus();

  return (
    <section className="card">
      <h2>작업과 정책</h2>
      <Row label="마지막 조작" value={ui.lastOperation.value} />
      <Row label="결과" value={ui.lastResult.value} />
      <Row label="고정한 제출" value={ui.captured.value ?? '(없음)'} />
      <Row label="mutation phase" value={mutation.phase.value} />
      <Row label="진행 중 WRITE" value={mutation.pending.value} />
      <Row label="readonly 조회 status" value={readonlyStatus.status.value} />
      <Flag label="focused" on={ui.focused.value} />
      <Flag label="online" on={ui.online.value} />
      <Row
        label="자동 조회 정책"
        value={`staleTime ${AUTO_REFETCH.staleTime}ms · focus ${AUTO_REFETCH.refetchOnFocus} · reconnect ${AUTO_REFETCH.refetchOnReconnect} · interval ${AUTO_REFETCH.refetchInterval}`}
      />
      <p className="note">
        staleTime과 interval은 실제 시간으로 흐른다. fixture가 제어하는 것은
        환경 사건과 요청 완료 시점이다.
      </p>
    </section>
  );
}

function ComputedCard() {
  const ui = useUi();
  return (
    <section className="card">
      <h2>computed 읽기 결과</h2>
      <Row label="현재 값" value={ui.computedValue.value} />
      <Row label="계산 실행 횟수" value={ui.computedCalculations.value} />
      <Flag
        label="직전 읽기와 같은 객체"
        on={ui.computedIdentityStable.value}
      />
      <Row label="구독 콜백이 본 값" value={ui.computedSubscribed.value} />
      <p className="note">
        구독 없는 읽기는 sync() 전에도 최신 값을 본다. 구독 콜백은 sync()에서
        알림을 받는다.
      </p>
    </section>
  );
}

function Controls() {
  return (
    <>
      {OPERATION_GROUPS.map(group => (
        <section className="card" key={group.id}>
          <h2>{group.title}</h2>
          {group.operations.map(([id, label]) => (
            <button
              key={id}
              data-operation={id}
              onClick={() => model.run(id as OperationId)}
            >
              {label}
            </button>
          ))}
        </section>
      ))}
    </>
  );
}

export default function App() {
  return (
    <main>
      <h1>state-ref — React 서버 동기화 데모</h1>
      <p className="note">
        수동 체크리스트 1절의 fixture를 그대로 쓴다. 실제 서버는 없다.
      </p>
      <div className="grid">
        <Controls />
        <ServerCard />
        <StateCard />
        <ResourceCard
          title="resource 패널 A (key: profile)"
          slot="a"
          useStatus={useStatusA}
          changes={() => model.panelA.changes()}
        />
        <ResourceCard
          title="resource 패널 B (같은 key)"
          slot="b"
          useStatus={useStatusB}
          changes={() => model.panelB.changes()}
        />
        <DraftSection />
        <ComputedCard />
      </div>
    </main>
  );
}
