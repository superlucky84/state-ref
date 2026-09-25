import { createComputed, createStore, createStoreManualSync } from 'state-ref';
import type { Watch } from 'state-ref';
import { createDraft } from 'state-ref/draft';
import type { Draft } from 'state-ref/draft';
import { createSyncClient } from '@stateref/sync';
import type {
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
  INITIAL_PROFILE,
  removeOffice,
  reorderContacts,
  SAVED_PATHS,
  toSaveDto,
  withMemo,
} from './scenario';
import { operationLabel } from './operations';
import type { OperationId } from './operations';
import type { Profile, SaveAddressDto, SaveAddressResponse } from './types';

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
 * The retry budget the panel queries state for themselves (DC8-5-29).
 *
 * The count matches sync's own default, so the demo keeps exercising the real
 * default policy. The delay is flattened to 0 because the fixture cannot move
 * sync's clock (DC8-5-12) - with the default backoff a person running M2-04
 * would have to wait 1s, 2s and 4s between presses with nothing to press.
 */
export const QUERY_RETRY = 3;
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
  computedCalculations: number;
  computedIdentityStable: boolean;
  computedValue: string;
  /** What the *subscribed* computed last saw; it waits for `sync()`. */
  computedSubscribed: string;
}>;

export type DraftPair = Readonly<{
  a: Draft<Profile> | null;
  b: Draft<Profile> | null;
  generation: number;
}>;

export type ComputedSource = Readonly<{ dep: number; unrelated: number }>;

export type DemoModel = Readonly<{
  server: MockServer;
  environment: ControlledEnvironment;
  client: SyncClient;
  /** Two handles on the same key: one baseline, one set of edits. */
  panelA: QueryHandle<Profile>;
  panelB: QueryHandle<Profile>;
  /** A separate key opened with `editable: false`. */
  readonlyQuery: QueryHandle<Profile>;
  mutation: MutationHandle<SaveAddressDto, SaveAddressResponse>;
  drafts: () => DraftPair;
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
    queryKey: ['profile'],
    queryFn: server.read,
    ...AUTO_REFETCH,
    ...RETRY_POLICY,
  };
  const panelA = client.query<Profile>(queryOptions);
  const panelB = client.query<Profile>(queryOptions);
  const readonlyQuery = client.query<Profile>({
    queryKey: ['profile', 'readonly'],
    queryFn: server.read,
    editable: false,
    ...RETRY_POLICY,
  });

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
    computedCalculations: 0,
    computedIdentityStable: true,
    computedValue: '(읽지 않음)',
    computedSubscribed: '(알림 없음)',
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
  let submission: ResourceSubmission<Profile> | null = null;

  const bump = (operation: string, result: string) => {
    ui.tick.value = ui.tick.value + 1;
    ui.lastOperation.value = operation;
    ui.lastResult.value = result;
  };

  const requireDraft = (slot: 'a' | 'b'): Draft<Profile> | null => drafts[slot];

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
          error => {
            if (barred) bump(id, barredText(error, '패널 조회만'));
          }
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
          error => {
            if (barred) bump(id, barredText(error, '재조회가'));
          }
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
        drafts = { ...drafts, a: null, generation: drafts.generation + 1 };
        ui.draftGeneration.value = drafts.generation;
        return bump(id, 'draft A를 폐기했다. 원본과 draft B는 살아 있다.');
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

      case 'capture': {
        if (!loaded()) return notLoaded(id);
        const all = panelA.changes();
        const carried = all.filter(change =>
          SAVED_PATHS.includes(String(change.path[0]))
        );
        submission = panelA.capture(carried.map(change => change.id));
        const text = `version ${submission.version}, 변경 ${submission.changes.length}건`;
        ui.captured.value = text;
        return bump(
          id,
          `제출할 변경을 고정했다 — ${text}. 전체 ${
            all.length
          }건 중 DTO가 싣는 경로(${SAVED_PATHS.join('·')})만 골랐다.`
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
    mutation,
    drafts: () => drafts,
    watchUi,
    run,
    dispose() {
      drafts.a?.discard();
      drafts.b?.discard();
      mutation.dispose();
      panelA.dispose();
      panelB.dispose();
      readonlyQuery.dispose();
    },
  };
}
