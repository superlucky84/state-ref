import { createComputed, createStore, createStoreManualSync } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import { createDraft } from 'state-ref/draft';
import type { Draft, DraftChange } from 'state-ref/draft';
import { createSyncClient } from '@stateref/sync';
import type {
  LiveQueryViewHandle,
  MutationHandle,
  MutationLink,
  QueryHandle,
  ResourceSubmission,
  SyncClient,
} from '@stateref/sync';
import { createControlledEnvironment } from './environment';
import type { ControlledEnvironment } from './environment';
import { createMockServer } from './mock-server';
import type { MockServer } from './mock-server';
import {
  CITY,
  CONTACT_RENAME,
  INITIAL_PROFILE,
  removeOffice,
  ROOM_EDIT,
  reorderContacts,
  SAVED_PATHS,
  toSaveDto,
  withMemo,
} from './scenario';
import { draftChangeLines, inspectPanel } from './panels';
import type { CacheLine, ChangeLine } from './panels';
import { keyText, show } from './fields';
import { operationLabel } from './operations';
import type { OperationId } from './operations';
import type {
  Office,
  Profile,
  SaveAddressDto,
  SaveAddressResponse,
} from './types';

/**
 * The demo, minus the UI.
 *
 * Every framework demo drives this same model and only renders it, so the
 * five screens differ in connector code alone (DC8-5-01). Nothing here
 * imports a framework.
 */

/** The automatic refetch policy the demos run, shown on screen as-is. */
export const AUTO_REFETCH = {
  staleTime: 0,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  /**
   * Off by default. Polling would run on the real clock while a person reads
   * the panels, and the fixture cannot move sync's timers (DC8-5-12), so the
   * demo shows the policy rather than pretending to control it.
   */
  refetchInterval: false as const,
};

/**
 * The policy line every demo prints, built once.
 *
 * Five copies of this template literal drifted nowhere yet, but the model
 * reader has to produce the same text as the screens for a scenario's
 * expectation to mean anything in both places (DC8-8-02).
 */
export const POLICY_TEXT =
  `staleTime ${AUTO_REFETCH.staleTime}ms · focus ${AUTO_REFETCH.refetchOnFocus}` +
  ` · reconnect ${AUTO_REFETCH.refetchOnReconnect} · interval ${AUTO_REFETCH.refetchInterval}`;

/**
 * The retry budget the panel queries state for themselves (DC8-5-29).
 *
 * The count matches sync's own default, so the demo keeps exercising the real
 * default policy. The delay is flattened to 0 because the fixture cannot move
 * sync's clock (DC8-5-12) - with the default backoff a person running M2-04
 * would have to wait 1s, 2s and 4s between presses with nothing to press.
 */
export const QUERY_RETRY = 3;
/**
 * The scope the demo's ordered commands declare.
 *
 * sync guarantees start order only *within* a declared scope
 * (`packages/sync/src/index.ts:910`); unscoped operations are concurrent and
 * nothing invents an order for them. M2-11's third bullet asks for that
 * distinction, so the demo offers the same command both ways.
 */
export const COMMAND_SCOPE = 'address';
/**
 * How many queries share `server.read`: the panel key and the readonly key.
 *
 * `load` starts both, and they draw from one queued-outcome list, so a run of
 * failures has to cover every attempt of both or the panel quietly recovers on
 * a later attempt (DC8-5-30).
 */
export const READING_QUERIES = 2;
const RETRY_POLICY = {
  retry: QUERY_RETRY,
  retryDelay: () => 0,
};

/** The two keys the demo opens. The panels and the readonly view are apart. */
export const PANEL_KEY = ['profile'] as const;
export const READONLY_KEY = ['profile', 'readonly'] as const;

/**
 * How a key is printed in the request table.
 *
 * Derived from the key the query is actually opened with, so the column cannot
 * drift from `queryKey` (DC8-5-50).
 */

/**
 * The keys the live view follows, and the ids that select them.
 *
 * Two keys are the point: M2-11 asks that a late result from the *old* key stay
 * out of the new display, and that is only visible if the two keys answer with
 * different values (the same reason the mock snapshots at accept time,
 * DC8-5-48). The reader tags the record with the id it was read for.
 */
export const LIVE_IDS = ['a', 'b'] as const;
export type LiveId = (typeof LIVE_IDS)[number];
export const liveKey = (id: LiveId) => ['live', id];

export type DemoUi = Readonly<{
  /** Bumped after every operation so panels over non-reactive data repaint. */
  tick: number;
  lastOperation: string;
  lastResult: string;
  captured: string | null;
  mutationPhase: string;
  focused: boolean;
  online: boolean;
  /** Incremented whenever the drafts are branched again. */
  draftGeneration: number;
  /** The same, for the boundary card's one draft slot. */
  boundaryGeneration: number;
  computedCalculations: number;
  computedIdentityStable: boolean;
  computedValue: string;
  /** What the *subscribed* computed last saw; it waits for `sync()`. */
  computedSubscribed: string;
  /**
   * Whether the live view has been disposed.
   *
   * A disposed view refuses every access, so the card has to stop reading it
   * rather than catch a throw per row - the same shape as mounting the value
   * rows only once a query has loaded.
   */
  liveDisposed: boolean;
  /** Whether the demo currently holds the cache/WRITE observation handles. */
  inspectSubscribed: boolean;
  /**
   * Events seen since the last (re)subscribe - never a running total.
   *
   * A total moves with every unrelated operation and every server
   * notification, which is the `ui.tick` trap (`메모 N`, `zip 9NN`): pinning it
   * would fail the day an operation is added. Counted from the subscribe, the
   * `0` right after a release is a stable, meaningful reading (DC8-8-13).
   */
  cacheEventsSeen: number;
  mutationEventsSeen: number;
  /**
   * The keys observed events actually carried, accumulated and printed.
   *
   * M2-19 asks that no query payload and no mutation DTO reach an event. A
   * boolean would say "checked"; the key list *is* the evidence, and a leak
   * changes the string on screen (DC8-8-14).
   */
  cacheEventFields: string;
  mutationEventFields: string;
}>;

export type DraftPair = Readonly<{
  a: Draft<Profile> | null;
  b: Draft<Profile> | null;
  generation: number;
}>;

export type ComputedSource = Readonly<{ dep: number; unrelated: number }>;

/**
 * What the boundary card shows, as strings.
 *
 * One slot, two possible sources: a *child* ref under `office`, whose parent
 * an ordinary resource edit can remove from under it, and the readonly query,
 * which refuses every write. Both are things `createDraft` accepts and
 * `apply()` then refuses for different reasons, which is what M2-17's first
 * bullet asks to see.
 *
 * Strings, and read through `ui.tick` rather than through a connector, for
 * the reason the probe card is (DC8-8-19): the binding a per-framework draft
 * component would exercise is what draft A and draft B already cover, and the
 * value here is a leaf string for one source and a record for the other, so
 * there is no one typed component that fits both.
 */
export type BoundaryPanel = Readonly<{
  /** `원본 office.room` or `readonly 조회`. */
  source: string;
  value: string;
  dirty: string;
  version: string;
  changes: readonly ChangeLine[];
}>;

/**
 * What the second client's card shows, as strings.
 *
 * Strings all the way down because a disposed handle refuses every access and
 * the card then prints `(해제됨)` in every row - the live view card's shape.
 * The model builds this rather than handing the demos a handle that can throw
 * inside a template.
 *
 * It is read through `ui.tick`, not through a connector: the binding it would
 * exercise (`connectX(query.watchStatus)`) is what the two resource panels
 * already cover, and this card exists to show *client isolation* (DC8-8-19).
 */
export type ProbePanel = Readonly<{
  /** `(없음)` before it is opened; `열림`; `해제됨` afterwards. */
  state: string;
  status: string;
  dirty: string;
  version: string;
  /** null while there is no baseline, so the row is absent like a panel's. */
  city: string | null;
  cacheSize: string;
  cacheOwners: string;
  events: string;
  cache: readonly CacheLine[];
}>;

export type DemoModel = Readonly<{
  server: MockServer;
  environment: ControlledEnvironment;
  client: SyncClient;
  /** Two handles on the same key: one baseline, one set of edits. */
  panelA: QueryHandle<Profile>;
  panelB: QueryHandle<Profile>;
  /** A separate key opened with `editable: false`. */
  readonlyQuery: QueryHandle<Profile>;
  /** A display that follows `liveSource` across query keys. */
  liveView: LiveQueryViewHandle<Profile, Profile>;
  mutation: MutationHandle<SaveAddressDto, SaveAddressResponse>;
  drafts: () => DraftPair;
  /** The second client's card, or null before it has ever been opened. */
  probe: () => ProbePanel | null;
  /** The boundary card, or null before a boundary draft has been branched. */
  boundary: () => BoundaryPanel | null;
  /**
   * Whether anything on the screen holds unsaved input.
   *
   * The library has no such call - an app composes it from `isDirty()` on the
   * resource and on each open draft (`packages/sync/src/tests/draft-resource.test.ts`
   * spells out the same sum). `panelB` is deliberately not added: it is the
   * same resource as `panelA`, and summing it twice would make a shared
   * baseline look like two places holding input.
   */
  unsaved: () => boolean;
  watchUi: Watch<DemoUi>;
  run: (id: OperationId) => void;
  dispose: () => void;
}>;

export function createDemoModel(): DemoModel {
  // Late-bound on purpose: the store the panels subscribe to does not exist
  // until below, and the server has to be built first.
  let repaint = () => {};
  const server = createMockServer(INITIAL_PROFILE, () => repaint());
  const environment = createControlledEnvironment();
  const client = createSyncClient({ environment });

  const queryOptions = {
    queryKey: PANEL_KEY,
    // Bound to this key so the request table can say which query issued a
    // READ. Every row said `profile` before, the readonly query's included
    // (B8-7-14 / DC8-5-50), and M2-11 judges "not linked" by that column.
    queryFn: server.readFor(keyText(PANEL_KEY)),
    ...AUTO_REFETCH,
    ...RETRY_POLICY,
  };
  const panelA = client.query<Profile>(queryOptions);
  const panelB = client.query<Profile>(queryOptions);
  const readonlyQuery = client.query<Profile>({
    queryKey: READONLY_KEY,
    queryFn: server.readFor(keyText(READONLY_KEY)),
    editable: false,
    ...RETRY_POLICY,
  });

  /**
   * A display that follows a state-ref source across query keys.
   *
   * `resolve` returning null is how the view sits *disabled*: `live.query` is
   * then null and nothing is read. Pointing the source at an id activates it,
   * and pointing it at the other id switches the key under a live display -
   * which is what M2-11's fourth and fifth bullets are about.
   */
  const liveSource = createStore<{ id: LiveId | null }>({ id: null });
  const liveSourceRef = liveSource();
  const liveView = client.liveView<{ id: LiveId | null }, Profile, Profile>(
    liveSource,
    input =>
      input.id === null
        ? null
        : {
            queryKey: liveKey(input.id),
            // Through the mock, so settlement and the request row still work,
            // then tagged with the key it was read for.
            queryFn: async context => {
              const value = await server.readFor(keyText(liveKey(input.id!)))(
                context
              );
              return { ...value, city: `${value.city}-${input.id}` };
            },
            ...RETRY_POLICY,
          }
  );

  const mutation = client.mutation<SaveAddressDto, SaveAddressResponse>({
    mutationFn: input => server.write(input),
  });

  const watchUi = createStore<DemoUi>({
    tick: 0,
    lastOperation: '(없음)',
    lastResult: '아직 아무것도 하지 않았다.',
    captured: null,
    mutationPhase: 'idle',
    focused: true,
    online: true,
    draftGeneration: 0,
    boundaryGeneration: 0,
    computedCalculations: 0,
    computedIdentityStable: true,
    computedValue: '(읽지 않음)',
    computedSubscribed: '(알림 없음)',
    liveDisposed: false,
    inspectSubscribed: false,
    cacheEventsSeen: 0,
    mutationEventsSeen: 0,
    cacheEventFields: '(이벤트 없음)',
    mutationEventFields: '(이벤트 없음)',
  });
  // An unbound ref: it reads and writes the store without registering a
  // subscription of its own (Phase 8.4). The panels subscribe through
  // `watchUi` by way of their connector.
  const ui = watchUi();

  // The request panel reads the mock server directly and the server is not
  // reactive, so the tick is what repaints it. Operations bump it themselves;
  // this covers everything that happens *without* one - above all the READ a
  // retry issues, which otherwise left `진행 중` reading 0 while a request was
  // open (B8-7-13).
  repaint = () => {
    ui.tick.value = ui.tick.value + 1;
  };

  // --- The observation card (DC8-8-11~14) ---------------------------------
  // `inspectCache()` and `inspectMutations()` are snapshots, not reactive
  // sources, so the card reads them at render time and repaints on the tick -
  // the request card's arrangement. The events are what the tick needs, because
  // they are delivered on a *later* turn than the operation that caused them:
  // pressing `가능한 요청 모두 완료` bumps the tick before sync has moved the
  // status, so an operation's own bump is already spent.
  //
  // Two separate pairs of handles, and the split is the point (DC8-8-17). The
  // *repaint* pair exists for the whole model's lifetime and only bumps the
  // tick. The *observed* pair is the one `관측 구독 해제` releases and the one
  // the card counts. Wiring the table's freshness to the handles under test made
  // the table freeze the moment they were released - the browser runner caught
  // that in all five demos at once, which is the shape that says the fixture is
  // wrong rather than a connector (and it was).
  const offRepaintCache = client.subscribeCache(() => repaint());
  const offRepaintMutations = client.subscribeMutations(() => repaint());

  let offCache: (() => void) | null = null;
  let offMutations: (() => void) | null = null;
  const cacheFieldsSeen = new Set<string>();
  const mutationFieldsSeen = new Set<string>();
  const fieldText = (seen: Set<string>) =>
    seen.size === 0 ? '(이벤트 없음)' : [...seen].sort().join(',');

  const subscribeInspection = () => {
    if (offCache) return;
    ui.cacheEventsSeen.value = 0;
    ui.mutationEventsSeen.value = 0;
    offCache = client.subscribeCache(event => {
      // The event's own key set, printed rather than judged: this is what
      // "payload는 이벤트에 없다" looks like as a reading (DC8-8-14).
      for (const field of Object.keys(event.entry)) cacheFieldsSeen.add(field);
      ui.cacheEventFields.value = fieldText(cacheFieldsSeen);
      ui.cacheEventsSeen.value = ui.cacheEventsSeen.value + 1;
    });
    offMutations = client.subscribeMutations(event => {
      for (const field of Object.keys(event.entry))
        mutationFieldsSeen.add(field);
      ui.mutationEventFields.value = fieldText(mutationFieldsSeen);
      ui.mutationEventsSeen.value = ui.mutationEventsSeen.value + 1;
    });
    ui.inspectSubscribed.value = true;
  };

  const releaseInspection = () => {
    offCache?.();
    offMutations?.();
    offCache = null;
    offMutations = null;
    ui.inspectSubscribed.value = false;
  };

  subscribeInspection();
  // --- The second client (DC8-8-18~19) ------------------------------------
  // Same environment, and deliberately the *same key*. A different key would
  // prove nothing - that two caches do not mix is only a claim when both hold
  // an entry for `profile` (M2-03's sixth bullet, R2-07).
  type Probe = {
    client: SyncClient;
    query: QueryHandle<Profile>;
    off: () => void;
    events: number;
  };
  let probe: Probe | null = null;
  /** Kept after a dispose so the card can say `해제됨` instead of vanishing. */
  let probeEverOpened = false;

  const openProbe = () => {
    const second = createSyncClient({ environment });
    const query = second.query<Profile>({
      queryKey: PANEL_KEY,
      queryFn: server.readFor(keyText(PANEL_KEY)),
      ...AUTO_REFETCH,
      ...RETRY_POLICY,
    });
    const record: Probe = {
      client: second,
      query,
      events: 0,
      off: () => {},
    };
    // One handle that counts and *then* repaints, in that order: the card reads
    // the count through the tick, so repainting first would leave it a step
    // behind. The main client needs two handles because an operation releases
    // one of them (DC8-8-17); nothing releases this one but dispose.
    record.off = second.subscribeCache(() => {
      record.events += 1;
      repaint();
    });
    probe = record;
    probeEverOpened = true;
  };

  const disposeProbe = () => {
    if (!probe) return;
    probe.off();
    // Disposing the handle disposes its automatic-refetch observer
    // (`packages/sync/src/index.ts:1109`), and this client's last started
    // observer stopping is what releases its environment subscription. That is
    // the only way M2-18's fourth bullet can be tested: the panel queries live
    // as long as the screen does.
    probe.query.dispose();
    probe = null;
  };

  const probeOf = (): ProbePanel | null => {
    if (!probeEverOpened) return null;
    if (!probe) {
      return {
        state: '해제됨',
        status: '(해제됨)',
        dirty: '(해제됨)',
        version: '(해제됨)',
        city: null,
        cacheSize: '(해제됨)',
        cacheOwners: '(해제됨)',
        events: '(해제됨)',
        cache: [],
      };
    }
    const status = probe.query.status.value;
    const panel = inspectPanel(
      probe.client.inspectCache(),
      probe.client.inspectMutations()
    );
    return {
      state: '열림',
      status: `${status.status} / ${status.fetchStatus}`,
      dirty: String(status.dirty),
      version: `${status.version} / ${status.conflicts}`,
      // `ref` throws before a baseline exists, so the row waits for one - the
      // same condition the resource panels mount their value rows under.
      city: status.loaded ? probe.query.ref.city.value : null,
      cacheSize: String(panel.cacheSize),
      cacheOwners: String(panel.cacheOwners),
      events: String(probe.events),
      cache: panel.cache,
    };
  };

  // --- The callback-less computed demo (DC8-5-10) -------------------------
  // A manual-sync store, so "reads see current inputs before sync()" and
  // "subscribers wait for sync()" are two visibly different things.
  const manual = createStoreManualSync<ComputedSource>({
    dep: 1,
    unrelated: 1,
  });
  let calculations = 0;
  const doubled = createComputed([manual.watch], ([source]) => {
    calculations += 1;
    return { doubled: source.dep.value * 2 };
  });
  const unboundComputed = doubled();
  let lastComputedObject: { doubled: number } | null = null;
  // The subscribed form keeps its original timing: it is told at `sync()`.
  doubled(proxy => {
    ui.computedSubscribed.value = `doubled=${proxy.value.doubled}`;
  });

  let drafts: DraftPair = { a: null, b: null, generation: 0 };
  /** The last discarded draft A, kept so a dead ref can be touched on purpose. */
  let discarded: Draft<Profile> | null = null;

  /**
   * The boundary card's one draft, and which ref it came from.
   *
   * A discriminated pair rather than two slots: the card takes one at a time
   * and the same four buttons drive both, so the reading that matters is
   * which refusal the *same* sequence produces from each source.
   */
  type BoundaryDraft =
    | Readonly<{ origin: 'room'; draft: Draft<string> }>
    | Readonly<{ origin: 'readonly'; draft: Draft<Profile> }>;
  let boundary: BoundaryDraft | null = null;
  let boundaryAbort: AbortController | null = null;
  /**
   * The payloads the two data rules refuse.
   *
   * Values rather than literals at each call site so the resource row and the
   * draft row are refusing *the same thing* - that is the whole reading of
   * M2-17's third and fourth bullets, and two nearly-equal literals would
   * make it an argument rather than a comparison.
   */
  const RESERVED_KEY_PAYLOAD = { floor: 9, room: '901', toJSON: 'x' };
  /** No resource change ever carries this id; `capture` has to refuse it. */
  const UNKNOWN_CHANGE_ID = 9999;
  /** What the server holds at `office.room`, so a type swap keeps the text. */
  const SERVER_ROOM = INITIAL_PROFILE.office!.room;
  const unsupportedValue = () => new Map([['floor', 9]]);
  const BOUNDARY_SOURCE = {
    room: '원본 office.room',
    readonly: 'readonly 조회',
  } as const;
  /** The child ref the boundary draft branches from, under a nullable parent. */
  const roomRef = () =>
    (panelA.ref.office as unknown as StateRefStore<Office>).room;

  const releaseBoundary = () => {
    boundaryAbort?.abort();
    boundaryAbort = null;
    boundary?.draft.discard();
    boundary = null;
  };

  /**
   * Branch the boundary draft and give the card its own repaint.
   *
   * The card is read through `ui.tick`, and a draft settles its status on a
   * microtask, so an operation's own `bump` can run before the status the card
   * is about to print has moved. The repaint subscription is separate from
   * anything an operation switches off, which is what DC8-8-17 asks for.
   */
  const openBoundary = (next: BoundaryDraft) => {
    releaseBoundary();
    boundary = next;
    boundaryAbort = new AbortController();
    next.draft.watchStatus(() => {
      ui.tick.value = ui.tick.value + 1;
      return boundaryAbort!.signal;
    });
    ui.boundaryGeneration.value = ui.boundaryGeneration.value + 1;
  };

  const boundaryOf = (): BoundaryPanel | null => {
    if (!boundary) return null;
    const status = boundary.draft.status.value;
    return {
      source: BOUNDARY_SOURCE[boundary.origin],
      value: show(boundary.draft.ref.value),
      dirty: String(status.dirty),
      version: `${status.version} / ${status.conflicts}`,
      changes: draftChangeLines(boundary.draft.changes()),
    };
  };
  /** The live view refuses every access once disposed, so track it. */
  let liveAlive = true;
  let submission: ResourceSubmission<Profile> | null = null;

  const bump = (operation: string, result: string) => {
    ui.tick.value = ui.tick.value + 1;
    ui.lastOperation.value = operation;
    ui.lastResult.value = result;
  };

  const requireDraft = (slot: 'a' | 'b'): Draft<Profile> | null => drafts[slot];

  /** A review item kept past the edit that makes it stale (M2-16 항목 4). */
  let heldChange: DraftChange | null = null;

  const unsavedNow = () => {
    // `isDirty()` reaches the resource, which does not exist before the first
    // load - the same guard every value-reading operation takes (M2-04).
    const resource = panelA.status.loaded.value && panelA.isDirty();
    return Boolean(
      resource ||
        drafts.a?.isDirty() ||
        drafts.b?.isDirty() ||
        boundary?.draft.isDirty()
    );
  };

  /**
   * `query.ref` and `query.watch` both throw before the first load - not just
   * reading a field, but touching the handle at all. A demo that lets someone
   * press "도시 → 부산" first would blow up instead of showing what M2-04
   * asks for, so the model answers in words and the panels only mount a
   * value-reading component once `status.loaded` is true.
   */
  const notLoaded = (id: OperationId) =>
    bump(id, '아직 로드되지 않았다. 먼저 조회한다.');

  /**
   * What the recovery barrier refused, in words.
   *
   * A linked WRITE blocks a READ on the same query, and the demo used to
   * swallow that rejection and still answer '재조회를 시작했다' - on screen a
   * refusal and a normal start looked the same (B8-7-12). The library's own
   * message is quoted so the verifier records what sync said, not what the
   * demo thinks it said.
   */
  const barredText = (error: unknown, what: string) =>
    `${what} 연결 장벽에 막혀 거절됐다: ${String(
      error
    )} — 연결된 저장이 진행 중인 동안 이 조회는 시작하지 않는다. 저장을 완료한 뒤 다시 누른다.`;

  /**
   * Why a query's promise ended in a rejection.
   *
   * The barrier (DC8-5-45) is only one of the reasons. A READ already in
   * flight when a linked save starts is *aborted* by `beginLink()`
   * (`packages/sync/src/index.ts:651`), and that rejection used to be dropped
   * because there was no barrier at the moment the button was pressed - the
   * same swallowed-rejection defect as B8-7-12, at a different entrance
   * (DC8-5-51).
   */
  const refusedText = (error: unknown, what: string, barred: boolean) =>
    barred
      ? barredText(error, what)
      : `${what} 끝나지 못했다: ${String(
          error
        )} — 연결된 저장이 시작되면 진행 중이던 READ는 중단된다. 그 결과는 기준에 들어가지 않는다.`;
  const loaded = () => panelA.status.loaded.value;

  const readComputed = () => {
    const current = unboundComputed.value;
    const stable =
      lastComputedObject === null || lastComputedObject === current;
    lastComputedObject = current;
    ui.computedCalculations.value = calculations;
    ui.computedIdentityStable.value = stable;
    ui.computedValue.value = `doubled=${current.doubled}`;
    return `계산 ${calculations}회, 같은 객체=${stable}, doubled=${current.doubled}`;
  };

  /**
   * The shared body of the four save operations.
   *
   * They differ only in how the baseline is accepted and what a confirmed
   * rejection does to the submitted edits, so the guards belong in one place:
   * a missing submission, a second linked operation on the same query
   * (DC8-5-35), and - the one this fixed - a submission that went stale.
   *
   * `mutation.start` refuses a submission whose version no longer matches the
   * resource, and any local edit bumps that version. Pressing `제출 뒤 추가
   * 입력` between `고정` and `저장` therefore threw out of `run()` and broke
   * the screen instead of answering (B8-7-09). Every operation answers in
   * words (DC8-5-16), so the throw is caught and turned into the instruction
   * the verifier actually needs: capture again, or make the follow-up input
   * *after* the save has started.
   */
  const startSave = (
    id: OperationId,
    link: {
      accept: NonNullable<MutationLink<SaveAddressResponse>['accept']>;
      onReject: NonNullable<MutationLink<SaveAddressResponse>['onReject']>;
      started: string;
    }
  ) => {
    if (!submission) return bump(id, '먼저 제출할 변경을 고정한다.');
    if (panelA.status.pending.value > 0)
      return bump(
        id,
        '이 조회에 연결된 저장이 이미 진행 중이다. 먼저 완료한다.'
      );
    const fixed = submission;
    let operation: ReturnType<typeof mutation.start>;
    try {
      operation = mutation.start(toSaveDto(fixed.value, fixed.version), {
        links: [
          {
            query: panelA,
            submission: fixed,
            accept: link.accept,
            onReject: link.onReject,
          },
        ],
      });
    } catch (error) {
      return bump(
        id,
        `저장을 시작하지 못했다: ${String(
          error
        )} — 고정한 뒤에 입력이 더 들어왔다. 다시 고정하거나, 후속 입력은 저장을 시작한 뒤에 넣는다.`
      );
    }
    ui.mutationPhase.value = 'pending';
    void operation.result.then(result => {
      ui.mutationPhase.value = result.kind;
      bump(`${id} 결과`, `작업 ${result.operationId}: ${result.kind}`);
    });
    return bump(id, link.started);
  };

  const run = (id: OperationId) => {
    switch (id) {
      case 'settle-read':
        return bump(
          id,
          server.settle('READ') ? 'READ 하나 완료' : '완료할 READ 없음'
        );
      case 'settle-write':
        return bump(
          id,
          server.settle('WRITE') ? 'WRITE 하나 완료' : '완료할 WRITE 없음'
        );
      case 'settle-all':
        return bump(id, `${server.settleAll()}건 완료`);
      case 'next-read-error':
        server.nextRead('error');
        return bump(id, '다음 READ는 실패한다');
      case 'next-read-error-exhausted': {
        const total = (QUERY_RETRY + 1) * READING_QUERIES;
        server.nextRead('error', total);
        return bump(
          id,
          `다음 READ ${total}회를 실패로 예약했다. 조회 ${READING_QUERIES}개(패널·readonly)가 각각 재시도 예산 ${QUERY_RETRY}회를 소진해 오류 상태에 이른다. 요청은 완료 버튼으로 직접 끝낸다.`
        );
      }
      case 'next-read-ignore-signal':
        // The only path to sync's second line of defence: the epoch check
        // *after* `await queryFn` (DC8-5-49). A transport that honours the
        // signal is aborted by `beginLink()` and never answers at all.
        server.nextReadIgnoresSignal();
        return bump(
          id,
          `다음 READ는 abort를 듣지 않는다. '${operationLabel(
            'refetch'
          )}'로 시작하고 '${operationLabel(
            'save'
          )}'를 누르면, 연결이 시작돼도 그 READ는 중단되지 않고 진행 중으로 남는다 — 나중에 '${operationLabel(
            'settle-read'
          )}'로 완료시켜도 접수 시점 값이라 최신 기준을 덮지 않는다. 다음 READ 하나에만 적용되므로 '${operationLabel(
            'load'
          )}'(조회 2개를 시작함) 대신 재조회로 쓴다.`
        );

      case 'next-write-rejected':
        server.nextWrite('rejected');
        return bump(id, '다음 WRITE는 확정 거절된다');
      case 'next-write-unknown':
        server.nextWrite('unknown');
        return bump(id, '다음 WRITE는 끝나지 않는다 (결과 불명)');
      case 'next-write-corrected':
        server.nextWrite('success-corrected');
        return bump(
          id,
          '다음 WRITE는 성공하고 서버가 우편번호를 자기 형식(5자리)으로 보정한다'
        );

      case 'server-edit-memo': {
        // The only way to change the server behind the client's back. R2-11
        // asks whether a server update on an *unrelated* field survives a
        // failed submission, and every other operation here changes the
        // server only by writing to it (B8-7-07). The memo is the field no
        // draft and no DTO touches.
        server.setValue(
          withMemo(server.value(), `서버 메모 ${ui.tick.value + 1}`)
        );
        return bump(
          id,
          `서버가 메모를 "${
            server.value().memo
          }"로 바꿨다 (revision ${server.revision()}). 클라이언트는 아직 모른다 — 재조회해야 기준에 들어온다.`
        );
      }

      case 'next-write-sync-error': {
        // The recovery READ is an ordinary query load and retries like one, so
        // a single queued failure is absorbed and the operation reports a
        // plain `success` - the two results would be indistinguishable on
        // screen (B8-7-10). Reserve the whole chain instead of lowering the
        // retry budget: the demo has to keep exercising sync's real default
        // policy (DC8-5-29, DC8-5-43).
        //
        // Only `accept: { kind: 'refetch' }` reads the server again after the
        // WRITE, so it is the one save this reservation reaches; the others
        // never issue the READ that was queued to fail. The result says which
        // button to press, because a reservation nobody consumes looks exactly
        // like an ordinary success.
        const total = QUERY_RETRY + 1;
        server.nextWrite('success-then-read-failure', total);
        return bump(
          id,
          `다음 WRITE는 성공하고 그 뒤 복구 READ가 ${total}회(재시도 예산 ${QUERY_RETRY}회 소진) 실패한다. '${operationLabel(
            'save-with-refetch'
          )}'과 함께 눌러야 한다 — 나머지 수용 방식은 복구 READ 자체가 없어 예약한 실패를 아무도 쓰지 않는다. 완료는 WRITE 1회와 READ ${total}회를 끝내야 하고 재시도는 누른 뒤에 발행되므로, 진행 중 요청이 0이 될 때까지 반복해서 누른다. 서버 값은 이미 바뀌어 있다.`
        );
      }
      case 'next-write-transport-failure':
        // Not a confirmed rejection: sync classifies an untyped failure as
        // `unknown` and marks the baseline unconfirmed, because the server may
        // have stored the write anyway (DC8-5-44).
        server.nextWrite('transport-failure');
        return bump(
          id,
          '다음 WRITE는 전송이 실패한다. 서버가 저장했는지 알 수 없으므로 결과는 unknown이고 기준은 미확정으로 남는다 — 확정 거절과 달리 되돌리지 않는다.'
        );

      case 'load': {
        // `pending` counts linked operations on this query, which is exactly
        // when the recovery barrier refuses a READ (DC8-5-45).
        const barred = panelA.status.pending.value > 0;
        void panelA.load().then(
          () => undefined,
          error => bump(id, refusedText(error, '패널 조회만', barred))
        );
        // A different key, so the barrier does not apply to it - saying which
        // half was refused is the point.
        void readonlyQuery.load().catch(() => undefined);
        return bump(id, '조회를 시작했다. 서버 응답은 직접 완료한다.');
      }
      case 'refetch': {
        const barred = panelA.status.pending.value > 0;
        void panelA.refetch().then(
          () => undefined,
          error => bump(id, refusedText(error, '재조회가', barred))
        );
        return bump(id, '재조회를 시작했다.');
      }
      case 'invalidate':
        panelA.invalidate();
        return bump(id, '무효화했다. 진행 중 READ는 취소된다.');
      case 'accept-server':
        if (!loaded()) return notLoaded(id);
        panelA.acceptServer(server.value());
        return bump(id, 'WRITE 없이 현재 서버 값을 기준으로 받아들였다.');

      case 'edit-busan':
        if (!loaded()) return notLoaded(id);
        panelA.ref.city.value = CITY.resource;
        return bump(id, `공유 resource 도시를 ${CITY.resource}로 바꿨다.`);
      case 'edit-seoul':
        // The only way back to the server's own value without typing in the
        // input. M2-05's third bullet is "revert it and the changes table
        // empties", and a scenario cannot type (DC8-8-02 keeps both readers
        // pressing the same catalogue).
        if (!loaded()) return notLoaded(id);
        panelA.ref.city.value = CITY.server;
        return bump(
          id,
          `공유 resource 도시를 ${CITY.server}로 되돌렸다. 다른 변경이 없으면 changes가 비고 dirty도 내려간다 — 기준은 마지막으로 수용한 서버 값이다.`
        );
      case 'edit-memo':
        if (!loaded()) return notLoaded(id);
        panelA.ref.memo.value = `메모 ${ui.tick.value + 1}`;
        return bump(id, '어떤 draft와도 겹치지 않는 필드를 바꿨다.');
      case 'edit-gwangju':
        if (!loaded()) return notLoaded(id);
        panelA.ref.city.value = CITY.overlap;
        return bump(
          id,
          `원본 도시를 ${CITY.overlap}로 바꿨다. draft와 겹친다.`
        );
      case 'reorder-contacts':
        if (!loaded()) return notLoaded(id);
        panelA.ref.contacts.value = reorderContacts(panelA.ref.value).contacts;
        return bump(id, '같은 경로가 다른 연락처를 가리키게 했다.');
      case 'remove-office':
        if (!loaded()) return notLoaded(id);
        panelA.ref.office.value = removeOffice(panelA.ref.value).office;
        return bump(id, '사무실을 없앴다. 그 아래를 쥔 draft는 부모를 잃는다.');
      case 'swap-room-type': {
        if (!loaded()) return notLoaded(id);
        if (panelA.ref.office.value === null) {
          return bump(id, '사무실이 없다. 먼저 조회한다.');
        }
        // The cast is the point. `Office.room` is typed as a string, and
        // nothing in the type system stops a server, a migration or another
        // client from putting a different shape at that path; M2-17 is about
        // what the runtime does when one does.
        // The same text, a different type: a reader cannot mistake the
        // refusal for a value disagreement.
        roomRef().value = [SERVER_ROOM] as unknown as string;
        return bump(
          id,
          `방 번호를 문자열 ${SERVER_ROOM}에서 배열 ["${SERVER_ROOM}"]로 바꿨다. 글자는 같고 타입만 달라졌다 — 원본은 이 쓰기를 받는다.`
        );
      }
      case 'readonly-write': {
        if (!readonlyQuery.status.loaded.value) return notLoaded(id);
        const before = readonlyQuery.ref.city.value;
        try {
          readonlyQuery.ref.city.value = '시도';
        } catch (error) {
          return bump(id, `거절: ${String(error)}`);
        }
        const after = readonlyQuery.ref.city.value;
        return bump(
          id,
          after === before
            ? '예외 없이 무시됐다. 값은 그대로다.'
            : `쓰기가 통과했다: ${String(after)}`
        );
      }

      case 'branch-drafts': {
        if (!loaded()) {
          return bump(id, '아직 로드되지 않아 분기할 원본이 없다.');
        }
        drafts = {
          a: createDraft(panelA.ref),
          b: createDraft(panelA.ref),
          generation: drafts.generation + 1,
        };
        ui.draftGeneration.value = drafts.generation;
        return bump(id, '원본이 dirty여도 draft는 clean에서 시작한다.');
      }
      case 'draft-a-daejeon':
      case 'draft-b-daejeon': {
        const slot = id === 'draft-a-daejeon' ? 'a' : 'b';
        const draft = requireDraft(slot);
        if (!draft) return bump(id, '먼저 draft를 분기한다.');
        draft.ref.city.value = CITY.draft;
        return bump(
          id,
          `draft ${slot.toUpperCase()} 도시를 ${CITY.draft}로 바꿨다.`
        );
      }
      case 'draft-a-apply':
      case 'draft-b-apply': {
        const slot = id === 'draft-a-apply' ? 'a' : 'b';
        const draft = requireDraft(slot);
        if (!draft) return bump(id, '먼저 draft를 분기한다.');
        const result = draft.apply();
        return bump(
          id,
          result.ok
            ? `로컬 적용 ${result.applied}건. 네트워크 WRITE는 없다.`
            : `적용 거절: ${result.reason}`
        );
      }
      case 'draft-a-reset': {
        const draft = requireDraft('a');
        if (!draft) return bump(id, '먼저 draft를 분기한다.');
        draft.reset();
        return bump(id, 'draft A의 입력만 지웠다. 원본은 그대로다.');
      }
      case 'draft-a-discard': {
        const draft = requireDraft('a');
        if (!draft) return bump(id, '먼저 draft를 분기한다.');
        draft.discard();
        // Held on purpose so the next operation can touch a dead ref. The demo
        // otherwise empties the slot and its own guard answers first, which is
        // not the same thing as the ref refusing (M2-15's fourth bullet).
        discarded = draft;
        drafts = { ...drafts, a: null, generation: drafts.generation + 1 };
        ui.draftGeneration.value = drafts.generation;
        return bump(id, 'draft A를 폐기했다. 원본과 draft B는 살아 있다.');
      }
      case 'draft-a-write-after-discard': {
        if (!discarded) return bump(id, '먼저 draft A를 폐기한다.');
        try {
          discarded.ref.city.value = CITY.draft;
        } catch (error) {
          // The draft's own vocabulary. A reader has to be able to tell this
          // from a cancelled request or an aborted save, which is the half of
          // M2-15's fourth bullet that this operation exists for.
          return bump(
            id,
            `거절: ${String(
              error
            )} — 종료된 draft의 거절이고 네트워크 취소도 저장 취소도 아니다.`
          );
        }
        return bump(id, '쓰기가 통과했다 — 종료된 draft가 거절하지 않았다.');
      }
      case 'draft-a-resolve-source':
      case 'draft-a-resolve-draft': {
        const draft = requireDraft('a');
        if (!draft) return bump(id, '먼저 draft를 분기한다.');
        const conflict = draft.changes().find(change => change.conflict);
        if (!conflict) return bump(id, '해소할 충돌이 없다.');
        const choice = id === 'draft-a-resolve-source' ? 'source' : 'draft';
        const result = draft.resolve(conflict, choice);
        return bump(
          id,
          result.ok
            ? `${choice} 쪽으로 해소했다.`
            : `해소 실패: ${result.reason}`
        );
      }

      case 'draft-a-rename-contact': {
        const draft = requireDraft('a');
        if (!draft) return bump(id, '먼저 draft를 분기한다.');
        draft.ref.contacts[0].name.value = CONTACT_RENAME;
        return bump(
          id,
          `draft A 연락처 1의 이름을 ${CONTACT_RENAME}로 바꿨다. 배열 안의 한 칸을 고쳤지만 기록되는 변경 경로는 contacts다 — 배열 하나가 원자 단위이고, 인덱스는 entity ID가 아니다.`
        );
      }

      case 'readonly-capture': {
        if (!readonlyQuery.status.loaded.value) return notLoaded(id);
        try {
          readonlyQuery.capture();
        } catch (error) {
          return bump(
            id,
            `거절: ${String(
              error
            )} — readonly 조회는 검토 목록과 version을 가지지만 제출할 것은 가질 수 없다.`
          );
        }
        return bump(id, '고정이 통과했다 — readonly 조회가 거절하지 않았다.');
      }
      case 'capture-unknown-id': {
        if (!loaded()) return notLoaded(id);
        try {
          panelA.capture([UNKNOWN_CHANGE_ID]);
        } catch (error) {
          return bump(
            id,
            `거절: ${String(
              error
            )} — 이 resource의 항목이 아닌 ID로는 제출을 고정할 수 없다.`
          );
        }
        return bump(id, '고정이 통과했다 — 없는 ID가 거절되지 않았다.');
      }
      case 'draft-a-hold-change': {
        const draft = requireDraft('a');
        if (!draft) return bump(id, '먼저 draft를 분기한다.');
        const [change] = draft.changes();
        if (!change) return bump(id, 'draft A에 검토할 항목이 없다.');
        heldChange = change;
        return bump(
          id,
          `draft A의 항목 ${change.id}(경로 ${
            change.path.map(String).join('.') || '(root)'
          }, version ${
            change.version
          })을 손에 들었다. 이 뒤에 draft가 바뀌면 이 항목은 오래된 검토가 된다.`
        );
      }
      case 'draft-a-resolve-held': {
        const draft = requireDraft('a');
        if (!draft) return bump(id, '먼저 draft를 분기한다.');
        if (!heldChange) return bump(id, '먼저 항목을 손에 든다.');
        const result = draft.resolve(heldChange, 'source');
        return bump(
          id,
          result.ok
            ? `손에 든 항목으로 해소했다 — draft가 그 뒤로 바뀌지 않았다.`
            : `해소 거절: ${result.reason} — 손에 든 항목의 version은 ${
                heldChange.version
              }이고 draft는 ${draft.version()}이다. 오래된 검토로는 새 입력을 해소할 수 없다.`
        );
      }
      case 'draft-a-resolve-other-owner': {
        const draft = requireDraft('a');
        const other = requireDraft('b');
        if (!draft || !other) return bump(id, '먼저 draft를 분기한다.');
        const [change] = other.changes();
        if (!change) return bump(id, 'draft B에 넘길 항목이 없다.');
        const result = draft.resolve(change, 'source');
        return bump(
          id,
          result.ok
            ? 'draft B의 항목으로 draft A를 해소했다 — 거절되지 않았다.'
            : `해소 거절: ${result.reason} — 항목은 그것을 만든 draft의 것이고, 번호가 같아도 다른 draft의 항목으로는 해소할 수 없다.`
        );
      }

      case 'boundary-branch-room': {
        if (!loaded()) return notLoaded(id);
        if (panelA.ref.office.value === null) {
          return bump(id, '사무실이 없어 그 아래에서 분기할 수 없다.');
        }
        openBoundary({ origin: 'room', draft: createDraft(roomRef()) });
        return bump(
          id,
          'office.room에서 draft를 분기했다. 원본이 레코드가 아니라 그 안의 한 칸이므로, 원본의 부모가 그 아래에서 사라질 수 있다.'
        );
      }
      case 'boundary-branch-readonly': {
        if (!readonlyQuery.status.loaded.value) return notLoaded(id);
        openBoundary({
          origin: 'readonly',
          draft: createDraft(readonlyQuery.ref),
        });
        return bump(
          id,
          'readonly 조회에서 draft를 분기했다. 분기도 편집도 되고, 거절은 적용에서 난다.'
        );
      }
      case 'boundary-edit': {
        if (!boundary) return bump(id, '먼저 경계 draft를 분기한다.');
        if (boundary.origin === 'room') {
          boundary.draft.ref.value = ROOM_EDIT;
          return bump(id, `경계 draft의 방 번호를 ${ROOM_EDIT}로 바꿨다.`);
        }
        boundary.draft.ref.city.value = CITY.draft;
        return bump(id, `경계 draft의 도시를 ${CITY.draft}으로 바꿨다.`);
      }
      case 'boundary-apply': {
        if (!boundary) return bump(id, '먼저 경계 draft를 분기한다.');
        const result = boundary.draft.apply();
        return bump(
          id,
          result.ok
            ? `로컬 적용 ${result.applied}건.`
            : `적용 거절: ${result.reason} — 원본은 그대로이고 draft의 입력도 남는다.`
        );
      }

      case 'draft-a-reserved-key': {
        const draft = requireDraft('a');
        if (!draft) return bump(id, '먼저 draft를 분기한다.');
        try {
          draft.ref.office.value = {
            ...RESERVED_KEY_PAYLOAD,
          } as unknown as Office;
        } catch (error) {
          return bump(id, `draft 거절: ${String(error)}`);
        }
        return bump(id, 'draft가 예약 키를 받았다 — 거절되지 않았다.');
      }
      case 'draft-a-unsupported-value': {
        const draft = requireDraft('a');
        if (!draft) return bump(id, '먼저 draft를 분기한다.');
        try {
          draft.ref.office.value = unsupportedValue() as unknown as Office;
        } catch (error) {
          return bump(id, `draft 거절: ${String(error)}`);
        }
        return bump(id, 'draft가 미지원 값을 받았다 — 거절되지 않았다.');
      }
      case 'draft-a-mutate-snapshot': {
        const draft = requireDraft('a');
        if (!draft) return bump(id, '먼저 draft를 분기한다.');
        const office = draft.ref.office.value;
        if (office === null) return bump(id, '사무실이 없어 변형할 값이 없다.');
        try {
          (office as { room: string }).room = ROOM_EDIT;
        } catch (error) {
          return bump(id, `draft 거절: ${String(error)}`);
        }
        return bump(
          id,
          `draft가 읽은 값을 직접 고쳤다 — 거절되지 않았다. 지금 값: ${show(
            draft.ref.office.value
          )}`
        );
      }
      case 'resource-reserved-key': {
        if (!loaded()) return notLoaded(id);
        try {
          panelA.ref.office.value = {
            ...RESERVED_KEY_PAYLOAD,
          } as unknown as Office;
        } catch (error) {
          return bump(id, `원본 거절: ${String(error)}`);
        }
        return bump(id, '원본이 예약 키를 받았다 — 거절되지 않았다.');
      }
      case 'resource-unsupported-value': {
        if (!loaded()) return notLoaded(id);
        try {
          panelA.ref.office.value = unsupportedValue() as unknown as Office;
        } catch (error) {
          return bump(id, `원본 거절: ${String(error)}`);
        }
        return bump(id, '원본이 미지원 값을 받았다 — 거절되지 않았다.');
      }
      case 'resource-mutate-snapshot': {
        if (!loaded()) return notLoaded(id);
        const office = panelA.ref.office.value;
        if (office === null) return bump(id, '사무실이 없어 변형할 값이 없다.');
        try {
          (office as { room: string }).room = ROOM_EDIT;
        } catch (error) {
          return bump(id, `원본 거절: ${String(error)}`);
        }
        return bump(
          id,
          `원본이 읽은 값을 직접 고쳤다 — 거절되지 않았다. 지금 값: ${show(
            panelA.ref.office.value
          )}`
        );
      }

      case 'capture': {
        if (!loaded()) return notLoaded(id);
        const all = panelA.changes();
        /**
         * A root-path change carries every saved path inside it.
         *
         * `draft.apply()` writes the whole object in one go
         * (`packages/state-ref/src/draft/index.ts:398`), so the resource
         * records the applied edit at the root - and this filter, which read
         * `path[0]`, dropped it. Capture then selected 0 changes, the save
         * submitted nothing, and the resource stayed dirty forever with a
         * change nobody could ever send (B8-7-19). The DTO is built from the
         * resource's current value, so a root change is submittable; what it
         * is not is a change with a leaf path.
         */
        const carried = all.filter(
          change =>
            change.path.length === 0 ||
            SAVED_PATHS.includes(String(change.path[0]))
        );
        submission = panelA.capture(carried.map(change => change.id));
        const rootCarried = carried.some(change => change.path.length === 0);
        const text = `version ${submission.version}, 변경 ${submission.changes.length}건`;
        ui.captured.value = text;
        return bump(
          id,
          `제출할 변경을 고정했다 — ${text}. 전체 ${
            all.length
          }건 중 DTO가 싣는 경로(${SAVED_PATHS.join('·')})만 골랐다.${
            rootCarried
              ? ' 그중 한 건은 로컬 적용이 남긴 (root) 변경이고, 레코드 전체를 담으므로 함께 싣는다.'
              : ''
          }`
        );
      }
      case 'save':
        return startSave(id, {
          accept: { kind: 'submitted' },
          // Stated rather than defaulted: which half of R2-11 a save
          // exercises is the thing under test in M2-09.
          onReject: 'keep',
          started: '저장을 시작했다. 조회 shape와 다른 DTO를 보냈다.',
        });

      case 'save-with-response':
        return startSave(id, {
          // The server answers with the record it stored, so the app maps
          // that into the baseline instead of trusting what it sent. A
          // correction lands here rather than being lost.
          accept: {
            kind: 'response',
            select: (response: SaveAddressResponse) => response.stored,
          },
          onReject: 'keep',
          started:
            '저장을 시작했다. 서버 응답의 저장된 레코드를 기준으로 삼는다.',
        });

      case 'save-with-refetch':
        return startSave(id, {
          // Unlike the other three, this one costs a READ: the baseline comes
          // from reading the server again after the WRITE lands. That extra
          // request is the whole point of the comparison in M2-07, so the
          // demo has to settle it too.
          accept: { kind: 'refetch' },
          onReject: 'keep',
          started:
            '저장을 시작했다. 성공 뒤 서버를 다시 읽어 기준을 맞춘다 — READ 완료도 눌러야 한다.',
        });

      case 'save-reject-remove':
        return startSave(id, {
          accept: { kind: 'submitted' },
          // The other half of R2-11. Only a *confirmed* rejection may act on
          // this, and only on the submitted edits that are still unchanged -
          // a later input on the same path, an edit on another field and an
          // accepted server value all stay.
          onReject: 'remove',
          started:
            '저장을 시작했다. 확정 거절이면 고정한 제출 입력만 되돌린다 — unknown이면 되돌리지 않는다.',
        });

      case 'edit-after-capture':
        if (!loaded()) return notLoaded(id);
        panelA.ref.zip.value = `9${ui.tick.value}`;
        return bump(
          id,
          '제출 뒤 입력이다. submitted 수용은 이것을 소비하지 않는다.'
        );

      case 'live-activate-a':
      case 'live-key-b': {
        if (!liveAlive) return bump(id, '표시를 이미 해제했다.');
        const next: LiveId = id === 'live-activate-a' ? 'a' : 'b';
        const before = liveSourceRef.id.value;
        liveSourceRef.id.value = next;
        return bump(
          id,
          before === null
            ? `비활성 상태에서 key ${keyText(
                liveKey(next)
              )}로 활성화했다. 조회가 시작된다.`
            : `key를 ${keyText(liveKey(before))}에서 ${keyText(
                liveKey(next)
              )}로 바꿨다. 이전 key의 조회는 마지막 소유자였다면 취소되고, 늦게 오는 결과는 새 표시에 들어가지 않는다.`
        );
      }
      case 'live-deactivate':
        if (!liveAlive) return bump(id, '표시를 이미 해제했다.');
        liveSourceRef.id.value = null;
        return bump(
          id,
          '원본이 key를 가리키지 않게 해서 표시를 비활성으로 돌렸다. 조회 핸들이 사라진다.'
        );
      case 'live-dispose':
        if (!liveAlive) return bump(id, '이미 해제했다.');
        liveView.dispose();
        liveAlive = false;
        ui.liveDisposed.value = true;
        return bump(
          id,
          '표시를 해제했다. 이후 접근은 명시적으로 거절되고 구독도 남지 않는다.'
        );

      /**
       * `client.remove()` on the live key.
       *
       * It refuses while anything still holds the entry - owners, dirty,
       * unconfirmed or a pending status (`packages/sync/src/index.ts:1588`) - so
       * the same button answers twice: refused while the display follows the
       * key, accepted once it has been released. That refusal is the other half
       * of what M2-19's seventh item means by 생성/제거.
       */
      case 'cache-remove-live-a': {
        const key = liveKey('a');
        const removed = client.remove(key);
        return bump(
          id,
          removed
            ? `소유자가 없는 ${keyText(
                key
              )} 캐시 항목을 제거했다. 관측 표에서 줄이 사라지고 제거 이벤트가 온다.`
            : `${keyText(
                key
              )}를 제거하지 않았다. 아직 소유자가 있거나 로컬 차이·미확정·진행 중 상태다 — 붙잡고 있는 것이 있으면 제거는 거절된다.`
        );
      }

      /**
       * An unlinked command, with and without a declared scope.
       *
       * Unlinked on purpose (R2-08's `resource 없는 명령`): a linked save is
       * refused while another linked save on the same query is in flight, which
       * is the library's own barrier and the *other* half of M2-11's third
       * bullet. Two unlinked commands may overlap, and that is what makes the
       * ordering claim testable - scoped, the second waits as `queued`;
       * unscoped, both run as `pending` and no order is promised.
       */
      case 'command-run':
      case 'command-scoped': {
        if (!loaded()) return notLoaded(id);
        const scoped = id === 'command-scoped';
        const operation = mutation.start(
          toSaveDto(panelA.ref.value, server.revision()),
          scoped ? { scope: COMMAND_SCOPE } : {}
        );
        void operation.result.then(result => {
          bump(`${id} 결과`, `작업 ${result.operationId}: ${result.kind}`);
        });
        return bump(
          id,
          scoped
            ? `scope \`${COMMAND_SCOPE}\`로 독립 명령을 시작했다. 같은 scope의 앞선 작업이 끝나기 전에는 queued로 기다린다 — 순서는 선언한 scope 안에서만 보장된다.`
            : '순서를 지정하지 않고 독립 명령을 시작했다. 같은 조회에 연결하지 않았으므로 장벽에 걸리지 않고, 여러 개가 동시에 pending으로 나아간다.'
        );
      }

      case 'probe-open':
        if (probe) return bump(id, '이미 열려 있다.');
        openProbe();
        return bump(
          id,
          `같은 key ${keyText(
            PANEL_KEY
          )}에 둘째 client를 열었다. 캐시는 별도이고, 아직 조회하지 않았으므로 환경 listener는 늘지 않는다.`
        );
      case 'probe-load': {
        if (!probe) return bump(id, '둘째 client가 없다. 먼저 연다.');
        void probe.query.load().catch(() => undefined);
        return bump(
          id,
          '둘째 client의 조회를 시작했다. 주 client가 같은 key를 이미 들고 있어도 요청은 따로 나간다 — 캐시가 다르므로 공유할 진행 READ가 없다.'
        );
      }
      case 'probe-edit': {
        if (!probe) return bump(id, '둘째 client가 없다. 먼저 연다.');
        if (!probe.query.status.loaded.value)
          return bump(id, '둘째 client가 아직 로드되지 않았다. 먼저 조회한다.');
        probe.query.ref.city.value = CITY.probe;
        return bump(
          id,
          `둘째 client에서만 도시를 ${CITY.probe}로 바꿨다. 같은 key지만 패널 두 장에는 보이지 않고 WRITE도 없다.`
        );
      }
      case 'probe-dispose':
        if (!probe)
          return bump(
            id,
            probeEverOpened ? '이미 해제했다.' : '둘째 client가 없다.'
          );
        disposeProbe();
        return bump(
          id,
          '둘째 client의 조회를 해제했다. 그 client의 마지막 시작 관찰자였으므로 환경 listener 수가 하나 줄어든다.'
        );

      case 'inspect-unsubscribe':
        if (!ui.inspectSubscribed.value)
          return bump(id, '이미 해제했다. 구독 이후 이벤트 수는 0에 머문다.');
        releaseInspection();
        // The counters go to 0 so the next operations can show that nothing
        // arrives: a frozen non-zero number would be ambiguous between "no
        // event came" and "we stopped counting".
        ui.cacheEventsSeen.value = 0;
        ui.mutationEventsSeen.value = 0;
        return bump(
          id,
          '캐시·WRITE 관측 구독을 해제했다. 이후 조작을 더 해도 구독 이후 이벤트 수는 0에 머문다 — 해제한 구독으로는 이벤트가 오지 않는다.'
        );
      case 'inspect-resubscribe':
        if (ui.inspectSubscribed.value) return bump(id, '이미 구독 중이다.');
        subscribeInspection();
        return bump(
          id,
          '관측 구독을 다시 걸었다. 세는 것은 이 시점 이후의 이벤트뿐이고, 해제 중에 지나간 것은 오지 않는다.'
        );

      case 'focus':
        environment.setFocused(true);
        ui.focused.value = true;
        return bump(id, 'focus 사건을 보냈다.');
      case 'reconnect':
        environment.emit('reconnect');
        return bump(id, '상태 변화 없이 reconnect 사건만 보냈다.');
      case 'go-offline':
        environment.setOnline(false);
        ui.online.value = false;
        return bump(id, '오프라인으로 바꿨다.');
      case 'go-online':
        environment.setOnline(true);
        ui.online.value = true;
        return bump(id, '온라인으로 바꿨다. reconnect가 함께 발생한다.');

      case 'computed-read':
        return bump(id, readComputed());
      case 'computed-bump-dep':
        manual.updateRef.dep.value = manual.updateRef.dep.value + 1;
        return bump(
          id,
          `의존 값을 ${manual.updateRef.dep.value}로 바꿨다. sync() 전이다.`
        );
      case 'computed-bump-unrelated':
        manual.updateRef.unrelated.value = manual.updateRef.unrelated.value + 1;
        return bump(id, '계산이 읽지 않는 값을 바꿨다.');
      case 'computed-sync':
        manual.sync();
        return bump(id, '수동 sync(). 구독 콜백은 이때 알림을 받는다.');
    }
  };

  return {
    server,
    environment,
    client,
    panelA,
    panelB,
    readonlyQuery,
    liveView,
    mutation,
    drafts: () => drafts,
    probe: probeOf,
    boundary: boundaryOf,
    unsaved: unsavedNow,
    watchUi,
    run,
    dispose() {
      releaseBoundary();
      drafts.a?.discard();
      drafts.b?.discard();
      mutation.dispose();
      panelA.dispose();
      panelB.dispose();
      readonlyQuery.dispose();
      if (liveAlive) liveView.dispose();
      releaseInspection();
      offRepaintCache();
      offRepaintMutations();
      disposeProbe();
    },
  };
}
