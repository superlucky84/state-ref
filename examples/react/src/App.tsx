import { useMemo } from 'react';
import { connectReact, connectReactView } from '@stateref/connect-react';
import type { StateRefStore } from 'state-ref';
import type { QueryStatus, ResourceChange } from '@stateref/sync';
import type { Draft } from 'state-ref/draft';
import {
  CARD_TITLE,
  OPERATION_GROUPS,
  POLICY_TEXT,
  createDemoModel,
  keyText,
  draftPanel,
  inspectPanel,
  label as fieldLabel,
  requestPanel,
  resourcePanel,
  show,
  displayPhaseOf,
} from 'stateref-example-shared';
import type {
  CardId,
  ChangeLine,
  FieldId,
  OperationId,
  Profile,
} from 'stateref-example-shared';
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
const useLiveView = connectReactView(model.liveView.watchDisplay);
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

// The label comes from the shared table and the row carries its field id, so
// the browser runner addresses it by that id rather than by Korean text
// (DC8-8-04).
function Row({ field, value }: { field: FieldId; value: unknown }) {
  return (
    <div className="row" data-field={field}>
      <span>{fieldLabel(field)}</span>
      <b>{show(value)}</b>
    </div>
  );
}

function Flag({ field, on }: { field: FieldId; on: boolean }) {
  return (
    <div className="row" data-field={field}>
      <span>{fieldLabel(field)}</span>
      <b className={on ? 'flag-on' : 'flag-off'}>{on ? 'true' : 'false'}</b>
    </div>
  );
}

function Changes({ rows }: { rows: readonly ChangeLine[] }) {
  if (rows.length === 0) return <p className="note">변경 없음</p>;
  // A draft's rows carry what the source holds now; a resource's do not. The
  // column appears only where there is a third value to show (B8-7-16).
  const hasSource = rows.some(row => row.source !== undefined);
  return (
    <table>
      <thead>
        <tr>
          <th>id</th>
          <th>경로</th>
          <th>before</th>
          <th>after</th>
          {hasSource && <th>원본</th>}
          <th>충돌</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.id} data-change={row.id}>
            <td>{row.id}</td>
            <td data-cell="path">{row.path}</td>
            <td data-cell="before">{row.before}</td>
            <td data-cell="after">{row.after}</td>
            {hasSource && <td data-cell="source">{row.source}</td>}
            <td data-cell="conflict" className={row.conflict ? 'bad' : ''}>
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
      <div className="row" data-field="city">
        <span>{fieldLabel('city')}</span>
        <input
          value={source.city.value}
          onChange={event => {
            source.city.value = event.target.value;
          }}
        />
      </div>
      <Row field="zip" value={source.zip.value} />
      <Row field="memo" value={source.memo.value} />
      <Row
        field="contacts"
        value={source.contacts.value.map(contact => contact.name).join(',')}
      />
      <Row field="office" value={source.office.value ?? '(없음)'} />
    </>
  );
}

function ResourceCard({
  card,
  slot,
  useStatus,
  changes,
}: {
  card: Extract<CardId, 'resource-a' | 'resource-b'>;
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
    <section className="card" data-card={card}>
      <h2>{CARD_TITLE[card]}</h2>
      {!panel.loaded ? (
        <p className="note">
          {panel.status === 'error'
            ? `오류: ${panel.errorText}`
            : '아직 로드되지 않았다. 여기에 가짜 성공 값을 보이지 않는다.'}
        </p>
      ) : (
        <ResourceValues slot={slot} />
      )}
      <Row field="status" value={`${panel.status} / ${panel.fetchStatus}`} />
      <Flag field="dirty" on={panel.dirty} />
      <Flag field="serverBusy" on={panel.serverBusy} />
      <Flag field="unconfirmed" on={panel.unconfirmed} />
      <Flag field="invalidated" on={panel.invalidated} />
      <Row field="version" value={`${panel.version} / ${panel.conflicts}`} />
      <Changes rows={panel.changes} />
    </section>
  );
}

/** One draft branched off the resource. Its input never reaches the source. */
function DraftCard({
  card,
  draft,
}: {
  card: Extract<CardId, 'draft-a' | 'draft-b'>;
  draft: Draft<Profile>;
}) {
  const useValue = useMemo(() => connectReact(draft.watch), [draft]);
  const useStatus = useMemo(() => connectReact(draft.watchStatus), [draft]);
  const value = useValue();
  const status = useStatus();
  const panel = draftPanel(status.value, draft.changes());

  return (
    <section className="card" data-card={card}>
      <h2>{CARD_TITLE[card]}</h2>
      <div className="row" data-field="city">
        <span>{fieldLabel('city')}</span>
        <input
          value={value.city.value}
          onChange={event => {
            value.city.value = event.target.value;
          }}
        />
      </div>
      <Row field="zip" value={value.zip.value} />
      {/* A field the draft never edits: an update to it on the source has to
          show up here, which is the first thing M2-13 asks (B8-7-17). */}
      <Row field="memo" value={value.memo.value} />
      <Flag field="draftDirty" on={panel.dirty} />
      <Row field="version" value={`${panel.version} / ${panel.conflicts}`} />
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
        <DraftCard key={`a-${generation}`} card="draft-a" draft={drafts.a} />
      )}
      {drafts.b && (
        <DraftCard key={`b-${generation}`} card="draft-b" draft={drafts.b} />
      )}
    </>
  );
}

function ServerCard() {
  const ui = useUi();
  ui.tick.value; // Subscribe: the mock server itself is not reactive.
  const panel = requestPanel(model.server);

  return (
    <section className="card" data-card="requests">
      <h2>{CARD_TITLE.requests}</h2>
      <Row
        field="server"
        value={`${panel.serverCity} / ${panel.serverRevision}`}
      />
      <Row field="counts" value={`${panel.readCount} / ${panel.writeCount}`} />
      <Row field="inFlight" value={panel.inFlight} />
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
          {panel.rows.map(row => (
            <tr key={row.id} data-request={row.id}>
              <td>{row.id}</td>
              <td data-cell="key">{row.key}</td>
              <td data-cell="revision">{row.revision}</td>
              <td
                data-cell="outcome"
                className={row.outcome === 'in-flight' ? 'flag-on' : ''}
              >
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
    <section className="card" data-card="operations">
      <h2>{CARD_TITLE.operations}</h2>
      <Row field="lastOperation" value={ui.lastOperation.value} />
      <Row field="lastResult" value={ui.lastResult.value} />
      <Row field="captured" value={ui.captured.value ?? '(없음)'} />
      <Row field="mutationPhase" value={mutation.phase.value} />
      <Row field="mutationPending" value={mutation.pending.value} />
      <Row field="readonlyStatus" value={readonlyStatus.status.value} />
      {/* Beside the parents' own `dirty`, never instead of it (M2-16 항목 2). */}
      <Flag field="unsaved" on={model.unsaved()} />
      <Flag field="focused" on={ui.focused.value} />
      <Flag field="online" on={ui.online.value} />
      <Row field="policy" value={POLICY_TEXT} />
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
    <section className="card" data-card="computed">
      <h2>{CARD_TITLE.computed}</h2>
      <Row field="computedValue" value={ui.computedValue.value} />
      <Row field="computedCalculations" value={ui.computedCalculations.value} />
      <Flag field="computedIdentity" on={ui.computedIdentityStable.value} />
      <Row field="computedSubscribed" value={ui.computedSubscribed.value} />
      <p className="note">
        구독 없는 읽기는 sync() 전에도 최신 값을 본다. 구독 콜백은 sync()에서
        알림을 받는다.
      </p>
    </section>
  );
}

/**
 * The live view card.
 *
 * A disposed view refuses every access, so the rows that read it mount only
 * while it is alive - the same shape as the value rows of a resource panel,
 * which mount only once the query has loaded.
 */
function LiveGone() {
  return (
    <>
      <Row field="liveKey" value="(해제됨)" />
      <Row field="liveEnabled" value="(해제됨)" />
      <Row field="livePhase" value="(해제됨)" />
      <Row field="liveCity" value="(해제됨)" />
    </>
  );
}

function LiveRows() {
  const view = useLiveView();
  const key = view.queryKey.value;
  return (
    <>
      <Row
        field="liveKey"
        value={key === null ? '(없음)' : keyText(key as string[])}
      />
      <Row field="liveEnabled" value={String(view.enabled.value)} />
      <Row
        field="livePhase"
        value={`${displayPhaseOf(view)} / ${view.fetchStatus.value}`}
      />
      <Row field="liveCity" value={view.data.value?.city ?? '(없음)'} />
    </>
  );
}

function LiveCard() {
  const ui = useUi();
  return (
    <section className="card" data-card="live">
      <h2>{CARD_TITLE.live}</h2>
      {ui.liveDisposed.value ? <LiveGone /> : <LiveRows />}
      <p className="note">
        원본이 key를 가리키지 않으면 비활성이고 조회 핸들이 없다. key를 바꾸면
        이전 key의 조회는 마지막 소유자였을 때 취소된다.
      </p>
    </section>
  );
}

/**
 * The second display of the same key.
 *
 * Unlike the probe card this one *is* about the connector (DC8-8-33): the rows
 * hold a second, independent subscription on a shared view, and closing the
 * screen unmounts them without releasing that view. The hook is built here
 * rather than at module scope because the view does not exist until the card
 * is opened - and the component mounts only while it does.
 */
function ShareRows({
  watch,
}: {
  watch: NonNullable<ReturnType<typeof model.shareWatch>>;
}) {
  const view = connectReactView(watch)();
  return (
    <>
      <Row
        field="livePhase"
        value={`${displayPhaseOf(view)} / ${view.fetchStatus.value}`}
      />
      <Row field="liveCity" value={view.data.value?.city ?? '(없음)'} />
    </>
  );
}

function ShareCard() {
  const ui = useUi();
  const mounted = ui.shareMounted.value;
  ui.tick.value; // Subscribe: the closed and released rows are snapshots.
  const share = model.share();
  if (!share) return null;
  const watch = model.shareWatch();

  return (
    <section className="card" data-card="share">
      <h2>{CARD_TITLE.share}</h2>
      <Row field="shareState" value={share.state} />
      {mounted && watch ? (
        <ShareRows watch={watch} />
      ) : (
        <>
          <Row field="livePhase" value={share.phase} />
          <Row field="liveCity" value={share.city} />
        </>
      )}
      <p className="note">
        화면을 닫으면 이 컴포넌트의 구독만 끝나고 공유 view는 남는다. 소유자가
        줄어드는 것은 view를 해제했을 때뿐이다.
      </p>
    </section>
  );
}

/**
 * The observation card.
 *
 * `inspectCache()` and `inspectMutations()` are snapshots, so the tick is what
 * repaints this - the arrangement `ServerCard` uses for the mock server
 * (DC8-8-12). `owners` is the first number on screen that says two panels share
 * one key rather than leaving it to be inferred from two cards agreeing.
 */
function InspectCard() {
  const ui = useUi();
  ui.tick.value; // Subscribe: the client's observation surface is a snapshot.
  const panel = inspectPanel(
    model.client.inspectCache(),
    model.client.inspectMutations()
  );

  return (
    <section className="card" data-card="inspect">
      <h2>{CARD_TITLE.inspect}</h2>
      <Row field="cacheSize" value={panel.cacheSize} />
      <Row field="cacheOwners" value={panel.cacheOwners} />
      <Row field="openMutations" value={panel.openMutations} />
      <Flag field="inspectSubscribed" on={ui.inspectSubscribed.value} />
      <Row
        field="observedEvents"
        value={`${ui.cacheEventsSeen.value} / ${ui.mutationEventsSeen.value}`}
      />
      <Row field="cacheEventFields" value={ui.cacheEventFields.value} />
      <Row field="mutationEventFields" value={ui.mutationEventFields.value} />
      <Row field="envListeners" value={model.environment.listenerCount()} />
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
          {panel.cache.map(row => (
            <tr key={row.key} data-cache={row.key}>
              <td data-cell="key">{row.key}</td>
              <td data-cell="kind">{row.kind}</td>
              <td data-cell="owners">{row.owners}</td>
              <td data-cell="status">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {panel.mutations.length === 0 ? (
        <p className="note">미종료 WRITE 없음</p>
      ) : (
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
            {panel.mutations.map(row => (
              <tr key={row.id} data-mutation={row.id}>
                <td data-cell="id">{row.id}</td>
                <td data-cell="phase">{row.phase}</td>
                <td data-cell="scope">{row.scope}</td>
                <td data-cell="attempt">{row.attempt}</td>
                <td data-cell="idempotent">{String(row.idempotent)}</td>
                <td data-cell="linked">{row.linked}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="note">
        모두 client의 공개 관측 표면이다. 이벤트에는 조회 값과 입력 DTO가 없고,
        구독을 해제하면 이후 이벤트가 오지 않는다.
      </p>
    </section>
  );
}

/**
 * The second client's card.
 *
 * Same key as the panels, different client - so the two cache tables stand side
 * by side holding a `profile` row each, which is how `client별` reads
 * (DC8-8-18). The model builds the strings because a disposed handle refuses
 * every access, and the card is read through the tick rather than a connector
 * (DC8-8-19): the binding a per-handle hook would exercise is what the two
 * resource panels already cover, and this card is about isolation.
 */
function ProbeCard() {
  const ui = useUi();
  ui.tick.value; // Subscribe: the probe's status is read as a snapshot.
  const probe = model.probe();
  if (!probe) return null;

  return (
    <section className="card" data-card="probe">
      <h2>{CARD_TITLE.probe}</h2>
      <Row field="probeState" value={probe.state} />
      <Row field="status" value={probe.status} />
      <Row field="dirty" value={probe.dirty} />
      <Row field="version" value={probe.version} />
      {probe.city !== null && <Row field="city" value={probe.city} />}
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
          {probe.cache.map(row => (
            <tr key={row.key} data-cache={row.key}>
              <td data-cell="key">{row.key}</td>
              <td data-cell="kind">{row.kind}</td>
              <td data-cell="owners">{row.owners}</td>
              <td data-cell="status">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">
        같은 key를 보지만 캐시가 다르다. 이 client의 편집·기준·요청은 패널 두
        장과 공유되지 않고, 해제하면 이 client의 환경 listener만 사라진다.
      </p>
    </section>
  );
}

/**
 * The boundary card.
 *
 * One draft slot over a source the ordinary draft cards cannot hold: a child
 * ref under `office`, whose parent an edit can remove from under it, or the
 * readonly query, which refuses every write. Read through the tick like the
 * probe card (DC8-8-19) - the binding a per-framework draft component would
 * exercise is what draft A and draft B already cover, and the value here is a
 * leaf string for one source and a record for the other.
 */
function BoundaryCard() {
  const ui = useUi();
  ui.tick.value; // Subscribe: the draft's status is read as a snapshot.
  const boundary = model.boundary();
  if (!boundary) return null;

  return (
    <section className="card" data-card="boundary">
      <h2>{CARD_TITLE.boundary}</h2>
      <Row field="boundarySource" value={boundary.source} />
      <Row field="boundaryValue" value={boundary.value} />
      <Row field="draftDirty" value={boundary.dirty} />
      <Row field="version" value={boundary.version} />
      <Changes rows={boundary.changes} />
      <p className="note">
        분기도 편집도 어느 원본에서나 된다. 갈리는 것은 적용이다 — 부모가 사라진
        원본은 missing-source, 타입이 바뀐 원본은 conflict, readonly 원본은
        readonly로 거절하고, 어느 쪽도 원본을 바꾸지 않으며 draft의 입력도
        남는다.
      </p>
    </section>
  );
}

/**
 * The readonly query's own card.
 *
 * A readonly query does have `changes()` and a `version` - they are just
 * permanently empty and zero, and the empty table is how that is told apart
 * from having no review surface at all. What it cannot do is `capture()`,
 * which is a button rather than a row.
 */
function ReadonlyCard() {
  const status = useReadonlyStatus();
  const panel = resourcePanel(status.value, model.readonlyQuery.changes());

  return (
    <section className="card" data-card="readonly">
      <h2>{CARD_TITLE.readonly}</h2>
      <Row field="status" value={`${panel.status} / ${panel.fetchStatus}`} />
      <Flag field="dirty" on={panel.dirty} />
      <Row field="version" value={`${panel.version} / ${panel.conflicts}`} />
      <Changes rows={panel.changes} />
      <p className="note">
        검토 목록과 version은 있고 영원히 비어 있다. 쓰기도 제출 고정도
        거절하므로 여기에 쌓일 것이 없다 — 다른 조회의 항목을 여기로 가져올 수도
        없다.
      </p>
    </section>
  );
}

/**
 * What is still held, and what has been let go.
 *
 * Read through the tick like the probe card (DC8-8-19): every number comes
 * from the demo's own bookkeeping or from the client's public surface, and
 * none of it is a connector binding the resource panels do not already cover.
 */
function LifetimeCard() {
  const ui = useUi();
  ui.tick.value; // Subscribe: these are snapshots, not reactive values.
  const lifetime = model.lifetime();

  return (
    <section className="card" data-card="lifetime">
      <h2>{CARD_TITLE.lifetime}</h2>
      <Row field="draftCycles" value={lifetime.cycles} />
      <Row field="draftLive" value={lifetime.live} />
      <Row field="draftNotices" value={lifetime.notices} />
      <Row field="retainedBy" value={lifetime.retainedBy} />
      <Row field="heldRef" value={lifetime.heldRef} />
      <Row field="serverless" value={lifetime.serverless} />
      <p className="note">
        반복이 남긴 것이 없으면 원본을 고쳐도 깨어나는 draft가 0이다. 살려 둔
        draft가 있으면 그 수만큼 깨어난다 — 0과 2를 가르는 것이 이 행의
        내용이다.
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
          card="resource-a"
          slot="a"
          useStatus={useStatusA}
          changes={() => model.panelA.changes()}
        />
        <ResourceCard
          card="resource-b"
          slot="b"
          useStatus={useStatusB}
          changes={() => model.panelB.changes()}
        />
        <DraftSection />
        <LiveCard />
        <ComputedCard />
        <InspectCard />
        <ProbeCard />
        <ShareCard />
        <ReadonlyCard />
        <LifetimeCard />
        <BoundaryCard />
      </div>
    </main>
  );
}
