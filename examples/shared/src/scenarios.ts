import type { OperationId } from './operations';
import type { ScreenReading } from './screen';

/**
 * A checklist item as data.
 *
 * The buttons to press and what must be true afterwards - nothing about how
 * long to wait or how many presses a retry costs. Both runners press the same
 * list and check the same expectation: vitest through the model
 * (`screenOf`), the browser runner through the rendered DOM (DC8-8-02).
 *
 * Expectations are deliberately partial. A full screen per step would be
 * enormous, would change whenever an unrelated row changed, and would bury the
 * one value the step is about. What a step names is what it is testing.
 */
export type Match = string | Readonly<{ contains: string }>;

export type Expectation = Readonly<{
  /** Card id -> field id -> what the row must show. */
  cards?: Readonly<Record<string, Readonly<Record<string, Match>>>>;
  /** Request id -> the cells that must match. */
  requests?: Readonly<Record<string, Readonly<Record<string, Match>>>>;
  /**
   * Card id -> the changes rows it must show, in order.
   *
   * Compared as a whole list, unlike the maps above: "two lines are left and
   * the submitted one is gone" is a statement about the count as much as the
   * content, and `[]` is how a scenario says `변경 없음`.
   */
  changes?: Readonly<
    Record<string, readonly Readonly<Record<string, Match>>[]>
  >;
  /**
   * Card id -> its cache table, compared as a whole list in shown order.
   *
   * One statement, not per-key assertions: a released key stays in the cache
   * with `owners 0` (DC8-8-15), so "which keys exist and how many owners each
   * has" only means something as a list. Keyed by card because two clients hold
   * an entry for the same key (DC8-8-20).
   */
  cache?: Readonly<Record<string, readonly Readonly<Record<string, Match>>[]>>;
  /**
   * Card id -> its open WRITEs, as a whole list in start order.
   *
   * `[]` is how a scenario says 미종료 WRITE 없음 - which is what M2-19's
   * thirteenth item asks for after a WRITE settles, and how it says that the
   * second client never started one.
   */
  mutations?: Readonly<
    Record<string, readonly Readonly<Record<string, Match>>[]>
  >;
  /** Cards that must NOT be on screen. */
  absentCards?: readonly string[];
  /** Request ids that must not exist yet - pins "no request was issued". */
  absentRequests?: readonly string[];
}>;

export type Step =
  | Readonly<{ press: OperationId }>
  /** `note` is why the step is here; it goes in the failure message. */
  | Readonly<{ expect: Expectation; note: string }>;

export type Scenario = Readonly<{
  /** Stable id a checklist cell cites. */
  id: string;
  title: string;
  /** The checklist item and bullet this pins. */
  pins: string;
  steps: readonly Step[];
}>;

const matches = (actual: string | undefined, expected: Match) =>
  typeof expected === 'string'
    ? actual === expected
    : (actual ?? '').includes(expected.contains);

const describe = (expected: Match) =>
  typeof expected === 'string' ? expected : `…${expected.contains}…`;

/**
 * One ordered table, compared as a whole.
 *
 * Three tables are read this way - a card's changes, the cache, and the open
 * WRITEs - and the count is part of every one of the claims they carry ("two
 * lines are left", "the key is gone", "nothing is in flight"). One comparison
 * for all three, for the same reason there is one `mismatches` for both
 * runners.
 */
const compareRows = (
  what: string,
  actualRows: readonly Record<string, string>[] | undefined,
  wantRows: readonly Readonly<Record<string, Match>>[],
  out: string[]
) => {
  if (!actualRows) {
    out.push(`${what}: table is missing`);
    return;
  }
  if (actualRows.length !== wantRows.length) {
    out.push(
      `${what}: expected ${wantRows.length} row(s), got ${actualRows.length} (${
        actualRows
          .map(row => row.path ?? row.key ?? row.id)
          .filter(name => name !== undefined)
          .join(', ') || 'none'
      })`
    );
    return;
  }
  for (const [index, want] of wantRows.entries()) {
    for (const [cell, expectedCell] of Object.entries(want)) {
      const got = actualRows[index][cell];
      if (!matches(got, expectedCell)) {
        out.push(
          `${what}[${index}]/${cell}: expected ${describe(expectedCell)}, got ${
            got === undefined ? '(no such cell)' : got
          }`
        );
      }
    }
  }
};

/**
 * Every way a reading fails an expectation, as lines a person can act on.
 *
 * One function for both runners: the comparison semantics cannot be right in
 * the browser and subtly different in vitest.
 */
export function mismatches(
  reading: ScreenReading,
  expected: Expectation
): string[] {
  const out: string[] = [];

  for (const [card, fields] of Object.entries(expected.cards ?? {})) {
    const actualCard = reading.cards[card];
    if (!actualCard) {
      out.push(`card ${card} is missing`);
      continue;
    }
    for (const [field, want] of Object.entries(fields)) {
      const got = actualCard[field];
      if (!matches(got, want)) {
        out.push(
          `${card}/${field}: expected ${describe(want)}, got ${
            got === undefined ? '(no such row)' : got
          }`
        );
      }
    }
  }

  for (const [id, cells] of Object.entries(expected.requests ?? {})) {
    const actualRow = reading.requests[id];
    if (!actualRow) {
      out.push(`request ${id} is missing`);
      continue;
    }
    for (const [cell, want] of Object.entries(cells)) {
      const got = actualRow[cell];
      if (!matches(got, want)) {
        out.push(
          `${id}/${cell}: expected ${describe(want)}, got ${
            got === undefined ? '(no such cell)' : got
          }`
        );
      }
    }
  }

  for (const [card, wantRows] of Object.entries(expected.changes ?? {})) {
    compareRows(`${card} changes`, reading.changes[card], wantRows, out);
  }

  for (const [card, wantRows] of Object.entries(expected.cache ?? {})) {
    compareRows(`${card} cache`, reading.cache[card], wantRows, out);
  }
  for (const [card, wantRows] of Object.entries(expected.mutations ?? {})) {
    compareRows(`${card} mutations`, reading.mutations[card], wantRows, out);
  }

  for (const card of expected.absentCards ?? []) {
    if (reading.cards[card]) out.push(`card ${card} should not be on screen`);
  }
  for (const id of expected.absentRequests ?? []) {
    if (reading.requests[id]) out.push(`request ${id} should not exist`);
  }

  return out;
}

/** Press every operation a scenario names, in order, ignoring its checks. */
export const pressesOf = (scenario: Scenario): readonly OperationId[] =>
  scenario.steps.flatMap(step => ('press' in step ? [step.press] : []));

/** The three M2-11 bullets the demo can reach (PHASE8_5 단계 14). */
export const M2_11: readonly Scenario[] = [
  {
    id: 'M2-11-1',
    title: '연결이 시작되면 진행 중이던 READ는 중단된다',
    pins: 'M2-11 첫째 항목 — mutation 이전 READ가 최신 기준을 덮지 않는다',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      {
        note: '기준이 서버 값으로 섰다',
        expect: {
          cards: {
            'resource-a': {
              status: 'success / idle',
              city: '서울',
              dirty: 'false',
            },
            requests: { server: '서울 / 1' },
          },
          absentCards: ['draft-a', 'draft-b'],
        },
      },
      { press: 'edit-busan' },
      { press: 'capture' },
      { press: 'refetch' },
      {
        note: '저장을 시작하기 전에 READ가 떠 있다',
        expect: {
          requests: { 'READ-3': { key: 'profile', outcome: 'in-flight' } },
          cards: { 'resource-a': { city: '부산', dirty: 'true' } },
        },
      },
      { press: 'save' },
      {
        note:
          'beginLink()가 epoch을 올리며 그 READ를 중단시킨다. 예의 바른 transport는 ' +
          '늦게 답할 기회 자체가 없고, 데모는 그 사실을 말한다',
        expect: {
          requests: {
            'READ-3': { outcome: 'aborted', revision: '1' },
            'WRITE-1': { key: '(mutation)', outcome: 'in-flight' },
          },
          cards: {
            operations: {
              mutationPhase: 'pending',
              lastResult: { contains: '진행 중이던 READ는 중단된다' },
            },
            // The edit is still local: the WRITE has not answered.
            'resource-a': { city: '부산', dirty: 'true', version: '1 / 0' },
          },
        },
      },
    ],
  },
  {
    id: 'M2-11-2',
    title: 'signal을 무시한 늦은 READ는 최신 기준을 덮지 않는다',
    pins: 'M2-11 둘째 항목 — transport가 signal을 무시하는 경우도 같은 결과',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'next-read-ignore-signal' },
      { press: 'edit-busan' },
      { press: 'capture' },
      { press: 'refetch' },
      { press: 'save' },
      {
        note:
          '이 transport는 abort를 듣지 않으므로 READ가 중단되지 않는다 — ' +
          'M2-11-1과 갈리는 바로 그 한 칸이다',
        expect: {
          requests: {
            'READ-3': { outcome: 'in-flight' },
            'WRITE-1': { outcome: 'in-flight' },
          },
        },
      },
      { press: 'settle-write' },
      {
        note: '제출값이 기준이 됐다. 서버도 클라이언트도 부산이다',
        expect: {
          cards: {
            'resource-a': {
              city: '부산',
              dirty: 'false',
              version: '2 / 0',
              unconfirmed: 'false',
            },
            operations: { mutationPhase: 'success' },
            requests: { server: '부산 / 2' },
          },
        },
      },
      { press: 'settle-read' },
      {
        note:
          '늦은 READ가 접수 시점 값(서울/revision 1)을 들고 도착했는데도 기준은 ' +
          '부산에 그대로다 — epoch 검사가 그 결과를 버렸다',
        expect: {
          requests: { 'READ-3': { outcome: 'success', revision: '1' } },
          cards: {
            'resource-a': {
              city: '부산',
              dirty: 'false',
              version: '2 / 0',
              status: 'success / idle',
            },
            requests: { server: '부산 / 2', counts: '3 / 1' },
          },
        },
      },
    ],
  },
  {
    id: 'M2-11-6',
    title: '연결되지 않은 조회는 장벽 밖에서 그대로 나아간다',
    pins: 'M2-11 여섯째 항목 — 연결되지 않은 query까지 보호한다고 표시하지 않는다',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'capture' },
      { press: 'save' },
      {
        note: '연결된 저장이 떠 있다',
        expect: {
          requests: { 'WRITE-1': { outcome: 'in-flight' } },
          cards: { operations: { mutationPhase: 'pending' } },
        },
      },
      { press: 'load' },
      {
        note:
          '패널 조회(profile)는 거절되고 readonly 조회(profile/readonly)만 시작한다. ' +
          '새로 생긴 요청은 그 하나뿐이고, 화면은 거절된 쪽을 이름으로 말한다',
        expect: {
          requests: {
            'READ-3': { key: 'profile/readonly', outcome: 'in-flight' },
          },
          absentRequests: ['READ-4'],
          cards: {
            operations: { lastResult: { contains: '패널 조회만' } },
            requests: { counts: '3 / 1' },
          },
        },
      },
    ],
  },
];

/**
 * M2-10, already passed by hand in the React demo (2026-09-26).
 *
 * Ported so the other four connectors get the same cover. The fourth bullet -
 * the recovery barrier - is already pinned by `M2-11-6`.
 *
 * The drain presses `가능한 요청 모두 완료` more times than the retry chain
 * needs: one press settles the open request and the retry is issued on the next
 * turn, so a chain of `QUERY_RETRY + 1` attempts costs twice that. Pressing a
 * few extra times is a no-op once nothing is pending, which keeps the scenario
 * from encoding the retry budget as a number.
 */
export const M2_10: readonly Scenario[] = [
  {
    id: 'M2-10-1',
    title: '저장은 성공했고 기준 복구만 실패했다, 그리고 재조회로 복구된다',
    pins: 'M2-10 첫째·둘째 항목 — sync-error와 재전송 없는 복구',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'capture' },
      { press: 'next-write-sync-error' },
      { press: 'save-with-refetch' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      {
        note:
          '서버는 저장했고(부산 / 2) 클라이언트는 그 기준을 확인하지 못했다 — ' +
          '한 화면이 두 사실을 따로 말한다. 재시도 예산 3회를 소진한 네 번의 READ가 ' +
          '모두 error다',
        expect: {
          cards: {
            operations: { mutationPhase: 'sync-error' },
            'resource-a': {
              status: 'error / idle',
              city: '부산',
              dirty: 'true',
              unconfirmed: 'true',
              invalidated: 'true',
              version: '1 / 0',
            },
            requests: { server: '부산 / 2', counts: '6 / 1', inFlight: '0' },
          },
          requests: {
            'WRITE-1': { outcome: 'success-then-read-failure' },
            'READ-3': { outcome: 'error' },
            'READ-4': { outcome: 'error' },
            'READ-5': { outcome: 'error' },
            'READ-6': { outcome: 'error' },
          },
        },
      },
      { press: 'refetch' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      {
        note:
          '기준을 고친 것은 재조회이지 재전송이 아니다 — WRITE는 1회 그대로이고 ' +
          'READ-7만 늘었다',
        expect: {
          cards: {
            'resource-a': {
              status: 'success / idle',
              city: '부산',
              dirty: 'false',
              unconfirmed: 'false',
              invalidated: 'false',
              version: '2 / 0',
            },
            requests: { server: '부산 / 2', counts: '7 / 1' },
          },
          requests: { 'READ-7': { outcome: 'success' } },
          absentRequests: ['WRITE-2'],
        },
      },
    ],
  },
  {
    id: 'M2-10-3a',
    title: '확정 거절은 제출한 입력을 되돌린다',
    pins: 'M2-10 셋째 항목 — 확정 거절 쪽',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'capture' },
      { press: 'next-write-rejected' },
      { press: 'save-reject-remove' },
      { press: 'settle-all' },
      {
        note:
          '저장되지 않았음을 들었으므로 제출 입력을 되돌린다. 기준은 미확정이 ' +
          '아니고, invalidated만 남는다 — beginLink()가 올린 것을 성공 경로만 내린다',
        expect: {
          cards: {
            operations: { mutationPhase: 'rejected' },
            'resource-a': {
              city: '서울',
              dirty: 'false',
              unconfirmed: 'false',
              invalidated: 'true',
            },
            requests: { server: '서울 / 1', counts: '2 / 1' },
          },
          requests: { 'WRITE-1': { outcome: 'rejected' } },
        },
      },
    ],
  },
  {
    id: 'M2-10-3b',
    title: '전송 실패는 되돌리지 않고 미확정으로 남는다',
    pins: 'M2-10 셋째 항목 — settled unknown 쪽',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'capture' },
      { press: 'next-write-transport-failure' },
      { press: 'save-reject-remove' },
      { press: 'settle-all' },
      {
        note:
          '서버가 저장했는지 알 수 없으므로 되돌리지 않는다. 같은 저장 버튼에 ' +
          '같은 서버 상태(서울 / 1)인데 화면이 갈리는 것은 클라이언트가 들은 말 ' +
          '때문이다 — M2-10-3a와 나란히 읽어야 하는 짝이다',
        expect: {
          cards: {
            operations: { mutationPhase: 'unknown' },
            'resource-a': {
              city: '부산',
              dirty: 'true',
              unconfirmed: 'true',
              invalidated: 'true',
            },
            requests: { server: '서울 / 1', counts: '2 / 1' },
          },
          requests: { 'WRITE-1': { outcome: 'transport-failure' } },
        },
      },
    ],
  },
];

/**
 * M2-07, already passed by hand in the React demo (2026-09-25).
 *
 * The three acceptance kinds compared from the same submission. Each scenario
 * starts a fresh model, so the counts here are per run - the manual record's
 * `2 / 2` for `submitted` was cumulative within one session, not a different
 * result.
 */
export const M2_07: readonly Scenario[] = [
  {
    id: 'M2-07-response',
    title: '응답 매핑 수용 — 추가 READ 0회, 기준은 서버가 돌려준 레코드',
    pins: 'M2-07 첫째 항목 — response 수용',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'capture' },
      { press: 'next-write-corrected' },
      { press: 'save-with-response' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      {
        note:
          '기준이 서버가 저장한 레코드에서 왔으므로 보정된 우편번호(01 → 00001)가 ' +
          '화면에 들어온다. 추가 READ는 없다 — READ는 2회 그대로다',
        expect: {
          cards: {
            operations: { mutationPhase: 'success' },
            'resource-a': {
              city: '부산',
              zip: '00001',
              dirty: 'false',
              version: '2 / 0',
            },
            requests: { server: '부산 / 2', counts: '2 / 1' },
          },
          requests: { 'WRITE-1': { outcome: 'success-corrected' } },
          absentRequests: ['READ-3'],
        },
      },
    ],
  },
  {
    id: 'M2-07-submitted',
    title: '제출값 수용 — 추가 READ 0회, 기준은 보낸 값 그대로',
    pins: 'M2-07 첫째 항목 — submitted 수용',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'capture' },
      { press: 'save' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      {
        note:
          '보낸 값이 그대로 기준이 된다. 서버가 보정할 것을 예약하지 않았으므로 ' +
          '우편번호는 01이고, 추가 READ도 없다',
        expect: {
          cards: {
            operations: { mutationPhase: 'success' },
            'resource-a': {
              city: '부산',
              zip: '01',
              dirty: 'false',
              version: '2 / 0',
            },
            requests: { server: '부산 / 2', counts: '2 / 1' },
          },
          absentRequests: ['READ-3'],
        },
      },
    ],
  },
  {
    id: 'M2-07-refetch',
    title:
      '사후 재조회 수용 — READ 1회를 더 쓰고, WRITE가 끝나도 작업은 끝나지 않는다',
    pins: 'M2-07 첫째 항목 — refetch 수용, 그 READ 비용',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'capture' },
      { press: 'save-with-refetch' },
      { press: 'settle-all' },
      {
        note:
          'WRITE는 이미 끝나 서버가 부산 / 2인데 작업은 아직 pending이다 — ' +
          '기준이 복구 READ에서 오기 때문이다. 세 수용 방식 중 이것만 READ를 더 쓴다',
        expect: {
          cards: {
            operations: { mutationPhase: 'pending' },
            'resource-a': { serverBusy: 'true', dirty: 'true' },
            requests: { server: '부산 / 2', counts: '3 / 1' },
          },
          requests: { 'READ-3': { key: 'profile', revision: '2' } },
        },
      },
      { press: 'settle-all' },
      {
        note: '그 READ를 완료해야 비로소 작업이 끝나고 기준이 선다',
        expect: {
          cards: {
            operations: { mutationPhase: 'success' },
            'resource-a': {
              city: '부산',
              dirty: 'false',
              serverBusy: 'false',
              version: '2 / 0',
            },
            requests: { counts: '3 / 1' },
          },
          requests: { 'READ-3': { outcome: 'success' } },
        },
      },
    ],
  },
];

/**
 * M2-05 and M2-08, already passed by hand in the React demo.
 *
 * `무관한 필드 변경` and `제출 뒤 추가 입력` build their values out of `ui.tick`
 * (`메모 8`, `zip 911`), which counts operations *and* server notifications. The
 * expectations therefore pin what the bullet is about - the row's path and what
 * it changed from, and above all whether the row is still there - and leave the
 * value that depends on the tick alone. Pinning it would make the scenario fail
 * the day an unrelated operation is added.
 */
export const M2_05_08: readonly Scenario[] = [
  {
    id: 'M2-05',
    title: 'resource는 마지막으로 수용한 서버 기준으로 로컬 차이를 추적한다',
    pins: 'M2-05 네 항목 전부 (R2-05/06)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      {
        note:
          'changes는 서버 → 로컬 한 줄이고 dirty가 켜진다. 서버 값도 WRITE 횟수도 ' +
          '움직이지 않는다 — 편집은 서버에 아무것도 보내지 않는다',
        expect: {
          cards: {
            'resource-a': {
              city: '부산',
              dirty: 'true',
              version: '1 / 0',
              status: 'success / idle',
            },
            requests: { server: '서울 / 1', counts: '2 / 0' },
          },
          changes: {
            'resource-a': [
              {
                path: 'city',
                before: '"서울"',
                after: '"부산"',
                conflict: '-',
              },
            ],
          },
        },
      },
      { press: 'edit-seoul' },
      {
        note:
          '서버 값으로 되돌리자 다른 변경이 없으므로 changes가 비고 dirty가 내려간다. ' +
          'READ/WRITE는 그대로다 — changes를 보는 것만으로 요청이 생기지 않는다',
        expect: {
          cards: {
            'resource-a': { city: '서울', dirty: 'false', version: '2 / 0' },
            requests: { server: '서울 / 1', counts: '2 / 0' },
          },
          changes: { 'resource-a': [] },
        },
      },
    ],
  },
  {
    id: 'M2-08',
    title: '제출한 변경만 확정되고 미제출·후속 입력은 남는다',
    pins: 'M2-08 네 항목 (R2-10)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'edit-memo' },
      { press: 'capture' },
      {
        note: '고정한 제출은 DTO가 싣는 경로(city)만 담는다 — memo는 제출되지 않는다',
        expect: {
          cards: { operations: { captured: { contains: '변경 1건' } } },
          changes: {
            'resource-a': [{ path: 'city' }, { path: 'memo' }],
          },
        },
      },
      { press: 'save' },
      { press: 'edit-after-capture' },
      {
        note:
          'WRITE가 떠 있는 동안 들어온 입력(zip)이 세 번째 줄로 붙는다. WRITE는 ' +
          '1회 그대로다 — 후속 입력이 두 번째 요청을 만들지 않는다',
        expect: {
          cards: {
            operations: { mutationPhase: 'pending' },
            'resource-a': { serverBusy: 'true', invalidated: 'true' },
            requests: { counts: '2 / 1' },
          },
          changes: {
            'resource-a': [
              { path: 'city' },
              { path: 'memo' },
              { path: 'zip', before: '"01"' },
            ],
          },
          absentRequests: ['WRITE-2'],
        },
      },
      { press: 'settle-all' },
      { press: 'settle-all' },
      {
        note:
          '성공이 지운 것은 제출한 city 한 줄뿐이다. 제출하지 않은 memo와 제출 뒤의 ' +
          'zip은 남고 dirty도 켜진 채다 — 성공이 무관한 편집을 clean으로 바꾸지 않는다',
        expect: {
          cards: {
            operations: { mutationPhase: 'success' },
            'resource-a': {
              city: '부산',
              dirty: 'true',
              serverBusy: 'false',
              invalidated: 'false',
            },
            requests: { server: '부산 / 2', counts: '2 / 1' },
          },
          changes: {
            'resource-a': [
              { path: 'memo', before: '"최초 메모"' },
              { path: 'zip', before: '"01"' },
            ],
          },
        },
      },
    ],
  },
];

/**
 * M2-09, already passed by hand in the React demo (2026-09-25).
 *
 * Five flows. The first two hold the acceptance kind fixed and vary `onReject`
 * alone, so a difference on screen has one cause. The third bullet - a
 * dependent input under a failed parent creation - stays closed as a demo limit
 * (DC8-5-42); `packages/sync/src/tests/mutation.test.ts:285` pins it as T2-11.
 *
 * The order of the inputs is part of the contract: a local edit raises the
 * resource revision and `mutation.start` refuses a submission whose revision
 * has moved, so a later input has to arrive *after* the save starts. Putting it
 * between capture and save makes the operation answer instead (B8-7-09).
 */
export const M2_09: readonly Scenario[] = [
  {
    id: 'M2-09-keep',
    title: '거절해도 제출한 입력을 지킨다 (onReject: keep)',
    pins: 'M2-09 첫째 항목 — keep 정책',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'edit-memo' },
      { press: 'capture' },
      { press: 'next-write-rejected' },
      { press: 'save' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      {
        note:
          '제출한 city와 제출하지 않은 memo가 모두 남는다. 확정 거절은 ' +
          'unconfirmed를 켜지 않지만 invalidated는 남는다 — beginLink()가 올린 것을 ' +
          '성공 경로만 내린다',
        expect: {
          cards: {
            operations: { mutationPhase: 'rejected', mutationPending: '0' },
            'resource-a': {
              city: '부산',
              dirty: 'true',
              unconfirmed: 'false',
              invalidated: 'true',
            },
            requests: { server: '서울 / 1', counts: '2 / 1' },
          },
          changes: { 'resource-a': [{ path: 'city' }, { path: 'memo' }] },
          absentRequests: ['WRITE-2'],
        },
      },
    ],
  },
  {
    id: 'M2-09-remove',
    title: '거절하면 제출한 입력만 되돌린다 (onReject: remove)',
    pins: 'M2-09 첫째 항목 — remove 정책',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'edit-memo' },
      { press: 'capture' },
      { press: 'next-write-rejected' },
      { press: 'save-reject-remove' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      {
        note:
          '되돌린 것은 제출한 city뿐이고 제출하지 않은 memo는 남는다 — 그래서 ' +
          'dirty도 여전히 켜져 있다. 복구가 revision을 한 칸 올린다(2 → 3)',
        expect: {
          cards: {
            operations: { mutationPhase: 'rejected' },
            'resource-a': {
              city: '서울',
              dirty: 'true',
              unconfirmed: 'false',
              invalidated: 'true',
              version: '3 / 0',
            },
            requests: { server: '서울 / 1', counts: '2 / 1' },
          },
          changes: { 'resource-a': [{ path: 'memo' }] },
        },
      },
    ],
  },
  {
    id: 'M2-09-later-input',
    title: '저장 시작 뒤의 같은 경로 입력은 새 기준 위에 다시 얹힌다',
    pins: 'M2-09 둘째 항목 — 같은 경로의 후속 입력',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'capture' },
      { press: 'next-write-rejected' },
      { press: 'save-reject-remove' },
      // After the save starts, not before: an edit in between moves the
      // resource revision and `mutation.start` refuses the stale submission.
      { press: 'edit-gwangju' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      {
        note:
          '제출했던 서울 → 부산만 사라지고 후속 입력이 남아 서울 → 광주로 다시 ' +
          '얹혔다. 충돌이 아니다 — 복구는 제출한 것만 되돌린다',
        expect: {
          cards: {
            operations: { mutationPhase: 'rejected' },
            'resource-a': { city: '광주', dirty: 'true' },
          },
          changes: {
            'resource-a': [
              {
                path: 'city',
                before: '"서울"',
                after: '"광주"',
                conflict: '-',
              },
            ],
          },
        },
      },
    ],
  },
  {
    id: 'M2-09-server-update',
    title: 'WRITE와 무관한 서버 갱신이 거절 복구를 통과한다',
    pins: 'M2-09 둘째 항목 — 다른 필드의 서버 갱신',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'server-edit-memo' },
      {
        note: '서버만 바뀌었고 클라이언트는 아직 모른다',
        expect: {
          cards: {
            'resource-a': { memo: '최초 메모' },
            requests: { server: '서울 / 2' },
          },
        },
      },
      { press: 'refetch' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'capture' },
      { press: 'next-write-rejected' },
      { press: 'save-reject-remove' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      {
        note:
          '거절 복구 뒤에도 서버가 따로 바꾼 memo는 기준에 남아 있다 — 복구는 ' +
          '거절된 제출만 되돌리고 과거 전체 객체로 되감지 않는다',
        expect: {
          cards: {
            operations: { mutationPhase: 'rejected' },
            'resource-a': {
              city: '서울',
              memo: { contains: '서버 메모' },
              dirty: 'false',
            },
            requests: { server: '서울 / 2', counts: '3 / 1' },
          },
          changes: { 'resource-a': [] },
        },
      },
    ],
  },
  {
    id: 'M2-09-earlier-success',
    title: '먼저 성공한 작업의 기준을 나중 거절이 지우지 않는다',
    pins: 'M2-09 둘째 항목 — 다른 작업 결과 유지, 그리고 자동 재전송 금지',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'capture' },
      { press: 'save' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      { press: 'edit-gwangju' },
      { press: 'capture' },
      { press: 'next-write-rejected' },
      { press: 'save-reject-remove' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      {
        note:
          '거절이 되돌린 곳은 광주를 제출하기 전, 즉 이미 수용된 부산이다 — ' +
          '서울로 거슬러 가지 않는다. WRITE는 2회(성공 1 + 거절 1)로 재전송이 없다',
        expect: {
          cards: {
            operations: { mutationPhase: 'rejected' },
            'resource-a': { city: '부산', dirty: 'false' },
            requests: { server: '부산 / 2', counts: '2 / 2' },
          },
          changes: { 'resource-a': [] },
          absentRequests: ['WRITE-3'],
        },
      },
    ],
  },
];

/** M2-12, performed here for the first time - it was 미수행. */
export const M2_12: readonly Scenario[] = [
  {
    id: 'M2-12',
    title: 'dirty한 원본에서 갈라진 draft는 clean에서 시작한다',
    pins: 'M2-12 네 항목 (R2-14/15)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      {
        note: '원본은 서버 서울과 다른 부산을 들고 dirty다. draft는 아직 없다',
        expect: {
          cards: { 'resource-a': { city: '부산', dirty: 'true' } },
          changes: {
            'resource-a': [{ path: 'city', before: '"서울"', after: '"부산"' }],
          },
          absentCards: ['draft-a', 'draft-b'],
        },
      },
      { press: 'branch-drafts' },
      {
        note:
          '두 draft는 현재 원본 값(부산)을 보여주면서 dirty=false·변경 없음이다 — ' +
          '현재 값은 쓰고 부모의 변경 기록은 상속하지 않는다. 원본의 서울 → 부산은 ' +
          '그대로 남아 있고, 분기 자체가 요청을 만들지 않는다',
        expect: {
          cards: {
            'draft-a': { city: '부산', draftDirty: 'false', version: '0 / 0' },
            'draft-b': { city: '부산', draftDirty: 'false', version: '0 / 0' },
            'resource-a': { city: '부산', dirty: 'true' },
            requests: { counts: '2 / 0' },
          },
          changes: {
            'draft-a': [],
            'draft-b': [],
            'resource-a': [{ path: 'city' }],
          },
        },
      },
      { press: 'draft-a-daejeon' },
      {
        note:
          '움직인 것은 draft A뿐이다. 그 변경의 before는 부산 — 서울이 아니라 ' +
          '갈라져 나온 시점의 원본 값이다. draft B와 원본은 부산이고 요청도 그대로다',
        expect: {
          cards: {
            'draft-a': { city: '대전', draftDirty: 'true', version: '1 / 0' },
            'draft-b': { city: '부산', draftDirty: 'false', version: '0 / 0' },
            'resource-a': { city: '부산', dirty: 'true', version: '1 / 0' },
            requests: { counts: '2 / 0' },
          },
          changes: {
            'draft-a': [
              {
                path: 'city',
                before: '"부산"',
                after: '"대전"',
                conflict: '-',
              },
            ],
            'draft-b': [],
            'resource-a': [{ path: 'city', before: '"서울"', after: '"부산"' }],
          },
        },
      },
    ],
  },
];

/**
 * M2-13, performed here for the first time - it was 미수행.
 *
 * Two instruments had to be added first: the draft's changes table dropped the
 * source value, so a conflict showed two of the three values the item asks for
 * (B8-7-16), and the draft card had no field the draft never edits, so "a
 * source update reaches the draft" had nothing to look at (B8-7-17).
 *
 * The shared prefix leaves the source dirty at 부산, a draft branched off it and
 * edited to 대전, and the source's memo changed - so every scenario below starts
 * from one baseline and varies one thing.
 */
const M2_13_PREFIX: readonly Step[] = [
  { press: 'load' },
  { press: 'settle-all' },
  { press: 'edit-busan' },
  { press: 'branch-drafts' },
  { press: 'draft-a-daejeon' },
  { press: 'edit-memo' },
];

export const M2_13: readonly Scenario[] = [
  {
    id: 'M2-13-unrelated',
    title: 'draft가 수정하지 않은 원본 필드의 갱신은 draft에도 보인다',
    pins: 'M2-13 첫째 항목',
    steps: [
      ...M2_13_PREFIX,
      {
        note:
          'draft는 city만 편집했고 memo는 건드리지 않았다. 원본이 memo를 바꾸자 ' +
          'draft에도 그 값이 보이고, draft의 변경 목록에는 city 한 줄뿐이다 — ' +
          '보이는 것과 내 변경은 다른 축이다',
        expect: {
          cards: {
            'resource-a': { city: '부산', memo: { contains: '메모 ' } },
            'draft-a': {
              city: '대전',
              memo: { contains: '메모 ' },
              draftDirty: 'true',
            },
          },
          changes: {
            'draft-a': [{ path: 'city', before: '"부산"', after: '"대전"' }],
          },
        },
      },
    ],
  },
  {
    id: 'M2-13-conflict',
    title:
      '겹치면 기준·내 입력·원본 세 값이 함께 보이고 입력이 사라지지 않는다',
    pins: 'M2-13 둘째·셋째 항목',
    steps: [
      ...M2_13_PREFIX,
      { press: 'edit-gwangju' },
      {
        note:
          '원본이 draft와 같은 경로를 광주로 바꿨다. 한 줄이 세 값을 말한다 — ' +
          '기준 부산, 내 입력 대전, 원본 광주. draft는 여전히 대전을 들고 있고 ' +
          '조용히 덮어써지지 않았다. 충돌 수는 1이고 요청은 생기지 않았다',
        expect: {
          cards: {
            'resource-a': { city: '광주' },
            'draft-a': { city: '대전', draftDirty: 'true', version: '3 / 1' },
            requests: { counts: '2 / 0' },
          },
          changes: {
            'draft-a': [
              {
                path: 'city',
                before: '"부산"',
                after: '"대전"',
                source: '"광주"',
                conflict: 'conflict',
              },
            ],
          },
        },
      },
    ],
  },
  {
    id: 'M2-13-resolve-source',
    title: '충돌을 원본 쪽으로 해소하면 draft가 원본 값을 따르고 clean이 된다',
    pins: 'M2-13 셋째 항목 — 해소(원본 선택)',
    steps: [
      ...M2_13_PREFIX,
      { press: 'edit-gwangju' },
      { press: 'draft-a-resolve-source' },
      {
        note: 'draft가 광주를 받아들이고 자기 변경을 버린다 — 충돌 0, 변경 없음',
        expect: {
          cards: {
            'draft-a': { city: '광주', draftDirty: 'false', version: '5 / 0' },
            'resource-a': { city: '광주' },
          },
          changes: { 'draft-a': [] },
        },
      },
    ],
  },
  {
    id: 'M2-13-resolve-draft',
    title: '충돌을 draft 쪽으로 해소하면 내 입력이 새 원본 값 위에 다시 얹힌다',
    pins: 'M2-13 셋째 항목 — 해소(draft 선택)',
    steps: [
      ...M2_13_PREFIX,
      { press: 'edit-gwangju' },
      { press: 'draft-a-resolve-draft' },
      {
        note:
          'draft는 대전을 지키고, 그 변경의 기준이 광주로 옮겨 붙어 충돌이 사라진다 ' +
          '— 같은 입력이 새 기준 위에서 다시 서술된다. 원본은 광주 그대로다',
        expect: {
          cards: {
            'draft-a': { city: '대전', draftDirty: 'true', version: '5 / 0' },
            'resource-a': { city: '광주' },
          },
          changes: {
            'draft-a': [
              {
                path: 'city',
                before: '"광주"',
                after: '"대전"',
                source: '"광주"',
                conflict: '-',
              },
            ],
          },
        },
      },
    ],
  },
  {
    id: 'M2-13-source-rollback',
    title: '원본의 낙관적 값이 되돌려져도 draft는 자기 입력을 지킨다',
    pins: 'M2-13 넷째 항목 — 원본의 낙관적 값 복구',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'branch-drafts' },
      { press: 'draft-a-daejeon' },
      { press: 'edit-gwangju' },
      { press: 'capture' },
      { press: 'next-write-rejected' },
      { press: 'save-reject-remove' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      {
        note:
          '거절이 원본의 제출 입력을 되돌려 원본이 서울로 돌아갔다. draft는 두 번의 ' +
          '원본 변경과 한 번의 거절을 지나고도 대전을 들고 있고, 충돌을 이제 ' +
          '**현재** 원본 값(서울)에 대해 보고한다 — 기준은 갈라져 나온 부산 그대로다',
        expect: {
          cards: {
            operations: { mutationPhase: 'rejected' },
            'resource-a': { city: '서울', dirty: 'false' },
            'draft-a': { city: '대전', draftDirty: 'true', version: '3 / 1' },
          },
          changes: {
            'draft-a': [
              {
                path: 'city',
                before: '"부산"',
                after: '"대전"',
                source: '"서울"',
                conflict: 'conflict',
              },
            ],
            'resource-a': [],
          },
        },
      },
    ],
  },
  {
    id: 'M2-13-converge',
    title: '원본이 draft 값으로 수렴하면 draft는 clean이 된다',
    pins: 'M2-13 넷째 항목 — 원본이 대전으로 수렴',
    steps: [
      ...M2_13_PREFIX,
      { press: 'draft-a-apply' },
      {
        note:
          '로컬 적용이 원본을 대전으로 수렴시켰다. draft는 clean이고 원본은 dirty다. ' +
          '적용이 요청을 만들지 않는다. **적용은 원본의 변경을 (root) 한 줄로 기록한다** ' +
          '— draft가 객체 전체를 쓰기 때문이고, 그래서 표가 city 한 줄이 아니라 ' +
          '레코드 전체를 담은 한 줄이 된다',
        expect: {
          cards: {
            'resource-a': { city: '대전', dirty: 'true' },
            'draft-a': { city: '대전', draftDirty: 'false', version: '4 / 0' },
            requests: { counts: '2 / 0' },
          },
          changes: {
            'draft-a': [],
            'resource-a': [
              {
                path: '(root)',
                before: { contains: '"city":"서울"' },
                after: { contains: '"city":"대전"' },
                conflict: '-',
              },
            ],
          },
        },
      },
    ],
  },
];

/**
 * M2-14, performed here for the first time - it was 미수행.
 *
 * `draft.apply()` writes the whole object in one go
 * (`packages/state-ref/src/draft/index.ts:398`), so the resource records the
 * applied edit at the **root** path rather than as a `city` row. That is the
 * library's behaviour, not a defect - but the demo's `capture` filtered changes
 * by `path[0]` and therefore dropped it, so the applied change could never be
 * submitted and the resource stayed dirty forever (B8-7-19). These scenarios pin
 * both halves: the root row, and its resolution through an ordinary save.
 */
export const M2_14: readonly Scenario[] = [
  {
    id: 'M2-14-apply',
    title: '로컬 적용은 요청 없이 원본을 바꾸고, 그 변경은 저장으로 해소된다',
    pins: 'M2-14 첫째~넷째 항목',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'branch-drafts' },
      { press: 'draft-a-daejeon' },
      { press: 'edit-memo' },
      {
        note: '서버 서울 → 원본 부산 → draft 대전, 그리고 원본의 무관한 필드도 바뀐 상태',
        expect: {
          cards: {
            'resource-a': { city: '부산', dirty: 'true' },
            'draft-a': { city: '대전', draftDirty: 'true' },
          },
          changes: { 'resource-a': [{ path: 'city' }, { path: 'memo' }] },
        },
      },
      { press: 'draft-a-apply' },
      {
        note:
          'draft는 대전/clean, 원본은 대전/dirty이고 요청은 0회다. 원본의 무관한 ' +
          '변경(memo)은 적용에 지워지지 않고 그 안에 함께 실린다. **적용은 레코드 ' +
          '전체를 한 번에 쓰므로 원본의 변경이 (root) 한 줄로 기록된다** — city 한 ' +
          '줄이 아니다',
        expect: {
          cards: {
            'resource-a': {
              city: '대전',
              dirty: 'true',
              memo: { contains: '메모 ' },
            },
            'draft-a': { city: '대전', draftDirty: 'false' },
            requests: { counts: '2 / 0' },
          },
          changes: {
            'draft-a': [],
            'resource-a': [
              {
                path: '(root)',
                before: { contains: '"city":"서울"' },
                after: { contains: '"city":"대전"' },
                conflict: '-',
              },
            ],
          },
        },
      },
      { press: 'capture' },
      {
        note:
          '(root) 변경도 제출 대상이다 — 레코드 전체를 담으므로 DTO가 싣는 경로가 ' +
          '그 안에 있다. 이 한 줄을 걸러내던 동안에는 적용한 변경을 영원히 보낼 수 ' +
          '없었다(B8-7-19)',
        expect: {
          cards: { operations: { captured: { contains: '변경 1건' } } },
        },
      },
      { press: 'save' },
      { press: 'settle-all' },
      { press: 'settle-all' },
      {
        note: '저장이 성공하고 기준이 수용되자 원본의 변경이 해소됐다 — clean이다',
        expect: {
          cards: {
            operations: { mutationPhase: 'success' },
            'resource-a': { city: '대전', dirty: 'false' },
            requests: { server: '대전 / 2', counts: '2 / 1' },
          },
          changes: { 'resource-a': [] },
        },
      },
    ],
  },
  {
    id: 'M2-14-refuse',
    title: '충돌하면 전체 적용을 무변경으로 거절한다',
    pins: 'M2-14 다섯째 항목 — 무변경 거절',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'branch-drafts' },
      { press: 'draft-a-daejeon' },
      { press: 'edit-gwangju' },
      { press: 'draft-a-apply' },
      {
        note:
          '적용이 거절되고 원본은 전혀 움직이지 않았다 — (root) 줄이 생기지 않고 ' +
          'city 한 줄과 version 그대로다. 부분 적용도 없다',
        expect: {
          cards: {
            operations: { lastResult: { contains: '적용 거절: conflict' } },
            'resource-a': { city: '광주', dirty: 'true', version: '2 / 0' },
            'draft-a': { city: '대전', draftDirty: 'true', version: '2 / 1' },
          },
          changes: {
            'resource-a': [{ path: 'city', before: '"서울"', after: '"광주"' }],
            'draft-a': [
              { path: 'city', source: '"광주"', conflict: 'conflict' },
            ],
          },
        },
      },
    ],
  },
  {
    id: 'M2-14-later-edit',
    title: '적용 뒤의 새 입력을 그 적용의 완료 처리가 지우지 않는다',
    pins: 'M2-14 다섯째 항목 — 적용 뒤 추가 입력',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'branch-drafts' },
      { press: 'draft-a-daejeon' },
      { press: 'draft-a-apply' },
      { press: 'edit-gwangju' },
      {
        note: '적용 뒤 draft는 clean이고 원본을 따라 광주로 움직인다',
        expect: {
          cards: { 'draft-a': { city: '광주', draftDirty: 'false' } },
          changes: { 'draft-a': [] },
        },
      },
      { press: 'draft-a-daejeon' },
      {
        note:
          '새 입력은 새 기준(광주) 위의 변경으로 남는다 — 앞선 적용이 정리한 편집 ' +
          '목록에 휩쓸려 사라지지 않는다',
        expect: {
          cards: { 'draft-a': { city: '대전', draftDirty: 'true' } },
          changes: {
            'draft-a': [
              {
                path: 'city',
                before: '"광주"',
                after: '"대전"',
                conflict: '-',
              },
            ],
          },
        },
      },
    ],
  },
];

/**
 * M2-15, performed here for the first time - it was 미수행.
 *
 * The fourth bullet needed an operation that touches a *dead* ref on purpose.
 * After `draft A 폐기` the demo's slot is empty, so every ordinary draft
 * operation answers from the demo's own guard - which is not the same claim.
 * `폐기한 draft A에 쓰기 시도` holds the discarded draft and writes through it,
 * so both halves are checkable: the refusal is explicit and in the draft's own
 * vocabulary, and it is not dressed up as a network or save cancellation.
 */
export const M2_15: readonly Scenario[] = [
  {
    id: 'M2-15-reset',
    title: 'reset은 draft의 입력만 지우고 세션을 끝내지 않는다',
    pins: 'M2-15 첫째 항목',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'branch-drafts' },
      { press: 'draft-a-daejeon' },
      { press: 'draft-a-reset' },
      {
        note:
          'draft A가 현재 원본 값(부산)을 따르고 clean이 됐다. 원본의 서울 → 부산은 ' +
          '그대로이고 draft B도 그대로다',
        expect: {
          cards: {
            'draft-a': { city: '부산', draftDirty: 'false' },
            'draft-b': { city: '부산', draftDirty: 'false' },
            'resource-a': { city: '부산', dirty: 'true' },
          },
          changes: {
            'draft-a': [],
            'resource-a': [{ path: 'city', before: '"서울"', after: '"부산"' }],
          },
        },
      },
      { press: 'draft-a-daejeon' },
      {
        note:
          '세션이 살아 있으므로 같은 draft에 다시 입력할 수 있다 — reset은 종료가 ' +
          '아니다',
        expect: {
          cards: { 'draft-a': { city: '대전', draftDirty: 'true' } },
          changes: {
            'draft-a': [{ path: 'city', before: '"부산"', after: '"대전"' }],
          },
        },
      },
    ],
  },
  {
    id: 'M2-15-discard',
    title: 'discard는 draft를 끝내고 원본의 변경은 남긴다',
    pins: 'M2-15 둘째·넷째 항목',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'branch-drafts' },
      { press: 'draft-a-daejeon' },
      { press: 'draft-a-discard' },
      {
        note:
          'draft A 카드가 화면에서 사라졌다. 원본의 서울 → 부산은 남고 draft B는 ' +
          '살아 있다 — 폐기는 그 draft만 끝낸다',
        expect: {
          absentCards: ['draft-a'],
          cards: {
            'draft-b': { city: '부산', draftDirty: 'false' },
            'resource-a': { city: '부산', dirty: 'true' },
          },
          changes: {
            'resource-a': [{ path: 'city', before: '"서울"', after: '"부산"' }],
          },
        },
      },
      { press: 'draft-a-daejeon' },
      {
        note:
          '폐기한 뒤에는 데모의 슬롯이 비어 있으므로 데모 자신의 가드가 먼저 답한다 ' +
          '— 이것은 아직 ref의 거절이 아니다',
        expect: {
          cards: {
            operations: {
              lastResult: '먼저 draft를 분기한다.',
              mutationPhase: 'idle',
              mutationPending: '0',
            },
            requests: { counts: '2 / 0' },
          },
          absentCards: ['draft-a'],
        },
      },
      { press: 'draft-a-write-after-discard' },
      {
        note:
          '이 조작은 붙잡아 둔 종료된 ref에 일부러 쓴다. 거절이 명시적이고 ' +
          '**draft 자신의 어휘**로 나온다 — `This draft has been discarded.` ' +
          '네트워크 취소도 저장 취소도 아니다: 원본은 부산 그대로이고 ' +
          'mutation phase는 idle, READ/WRITE도 2 / 0이다',
        expect: {
          cards: {
            operations: {
              lastResult: { contains: 'This draft has been discarded.' },
              mutationPhase: 'idle',
              mutationPending: '0',
            },
            'resource-a': { city: '부산', dirty: 'true' },
            requests: { counts: '2 / 0' },
          },
          absentCards: ['draft-a'],
        },
      },
    ],
  },
  {
    id: 'M2-15-discard-after-apply',
    title: '이미 적용한 내용을 draft 폐기로 되돌리지 않는다',
    pins: 'M2-15 셋째 항목',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'branch-drafts' },
      { press: 'draft-a-daejeon' },
      { press: 'draft-a-apply' },
      { press: 'draft-a-discard' },
      {
        note:
          '적용이 원본에 남긴 대전은 폐기에도 그대로다 — 폐기는 draft의 세션을 ' +
          '끝내는 것이고 이미 원본에 들어간 것을 되감지 않는다. draft B는 원본을 ' +
          '따라 대전이다',
        expect: {
          absentCards: ['draft-a'],
          cards: {
            'resource-a': { city: '대전', dirty: 'true' },
            'draft-b': { city: '대전', draftDirty: 'false' },
            requests: { counts: '2 / 0' },
          },
          changes: {
            'resource-a': [
              { path: '(root)', after: { contains: '"city":"대전"' } },
            ],
          },
        },
      },
    ],
  },
];

/**
 * M2-16, the two bullets the demo can reach.
 *
 * The other two need instruments that do not exist: there is no page-wide
 * unsaved indicator to aggregate, and the readonly query is opened with
 * `editable: false` so it has no changes, no version row and no card - nor is
 * there any operation that hands one draft's change to another draft's
 * `resolve`. Both are named in the checklist rather than guessed at.
 */
export const M2_16: readonly Scenario[] = [
  {
    id: 'M2-16-clean-source',
    title: '원본 clean · draft dirty 조합이 따로 보인다',
    pins: 'M2-16 첫째 항목 — M2-12가 덮지 않은 조합',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'branch-drafts' },
      { press: 'draft-a-daejeon' },
      {
        note:
          '원본은 서버 기준과 같아 clean이고 draft만 dirty다 — M2-12가 본 것은 ' +
          '그 반대(원본 dirty · draft clean)였다. 두 dirty가 서로 다른 것의 변경을 ' +
          '가리킨다는 것이 이 항목의 요점이다',
        expect: {
          cards: {
            'resource-a': {
              city: '서울',
              dirty: 'false',
              serverBusy: 'false',
              version: '0 / 0',
            },
            'draft-a': { city: '대전', draftDirty: 'true', version: '1 / 0' },
            'draft-b': { city: '서울', draftDirty: 'false' },
          },
          changes: {
            'resource-a': [],
            'draft-a': [{ path: 'city', before: '"서울"', after: '"대전"' }],
          },
        },
      },
    ],
  },
  {
    id: 'M2-16-dirty-vs-pending',
    title:
      'dirty와 pending은 다른 축이고, 앞 작업의 종료가 새 작업을 비우지 않는다',
    pins: 'M2-16 셋째 항목',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'branch-drafts' },
      { press: 'draft-a-daejeon' },
      {
        note:
          '로컬 차이만 있는 상태 — dirty는 켜지고 pending은 0이다. 편집은 요청을 ' +
          '만들지 않는다',
        expect: {
          cards: {
            'resource-a': { dirty: 'true', serverBusy: 'false' },
            operations: { mutationPhase: 'idle', mutationPending: '0' },
            requests: { counts: '2 / 0' },
          },
        },
      },
      { press: 'capture' },
      { press: 'save' },
      {
        note: '이제 둘이 함께 켜진다 — dirty는 여전히 로컬 차이, pending은 WRITE다',
        expect: {
          cards: {
            'resource-a': { dirty: 'true', serverBusy: 'true' },
            operations: { mutationPhase: 'pending', mutationPending: '1' },
            requests: { counts: '2 / 1' },
          },
        },
      },
      { press: 'settle-all' },
      { press: 'settle-all' },
      {
        note: '성공이 dirty와 pending을 함께 내린다. draft의 dirty는 무관하게 남는다',
        expect: {
          cards: {
            'resource-a': { dirty: 'false', serverBusy: 'false' },
            'draft-a': { draftDirty: 'true' },
            operations: { mutationPhase: 'success', mutationPending: '0' },
          },
        },
      },
      { press: 'edit-gwangju' },
      { press: 'capture' },
      { press: 'save' },
      {
        note:
          '두 번째 작업이 pending으로 선다 — 앞 작업이 끝났다는 사실이 새 작업의 ' +
          '상태를 비우지 않는다. WRITE는 2회이고 draft의 dirty는 두 저장을 지나 ' +
          '그대로다',
        expect: {
          cards: {
            'resource-a': { dirty: 'true', serverBusy: 'true' },
            'draft-a': { draftDirty: 'true' },
            operations: { mutationPhase: 'pending', mutationPending: '1' },
            requests: { counts: '2 / 2' },
          },
        },
      },
    ],
  },
];

/**
 * M2-11's fourth bullet, reachable now that the demo has a `liveView` card.
 *
 * The two keys answer with different values (`서울-a` / `서울-b`) on purpose: "the
 * old key's late result stayed out of the new display" is only visible if the two
 * answers differ - the same reason the mock snapshots at accept time
 * (DC8-5-48).
 */
export const M2_11_LIVE: readonly Scenario[] = [
  {
    id: 'M2-11-4-activate',
    title: '비활성에서 활성화하고, 비활성화·해제 뒤에는 표시가 남지 않는다',
    pins: 'M2-11 넷째 항목 — 활성화, 그리고 다섯째 항목의 표시 쪽',
    steps: [
      {
        note: '원본이 key를 가리키지 않으므로 비활성이고 조회 핸들도 없다',
        expect: {
          cards: {
            live: {
              liveKey: '(없음)',
              liveEnabled: 'false',
              liveCity: '(없음)',
            },
          },
          absentRequests: ['READ-1'],
        },
      },
      { press: 'live-activate-a' },
      { press: 'settle-all' },
      {
        note: '활성화하자 그 key의 조회가 시작되고 표시가 그 key의 값을 든다',
        expect: {
          cards: {
            live: {
              liveKey: 'live/a',
              liveEnabled: 'true',
              livePhase: 'success / idle',
              liveCity: '서울-a',
            },
          },
          requests: { 'READ-1': { key: 'live/a', outcome: 'success' } },
        },
      },
      { press: 'live-deactivate' },
      {
        note: '비활성으로 돌리면 조회 핸들이 사라지고 표시가 비어 있다 — 요청은 늘지 않는다',
        expect: {
          cards: {
            live: {
              liveKey: '(없음)',
              liveEnabled: 'false',
              liveCity: '(없음)',
            },
          },
          absentRequests: ['READ-2'],
        },
      },
      { press: 'live-dispose' },
      {
        note:
          '해제 뒤에는 모든 행이 (해제됨)이다 — 표시가 남지 않는다. 구독이 남지 ' +
          '않는지는 화면에 계측이 없어 여기서 판정하지 않는다',
        expect: {
          cards: {
            live: {
              liveKey: '(해제됨)',
              liveEnabled: '(해제됨)',
              livePhase: '(해제됨)',
              liveCity: '(해제됨)',
            },
          },
        },
      },
    ],
  },
  {
    id: 'M2-11-4-cancel',
    title: '진행 READ 중 key를 바꾸면 마지막 소유자였던 조회가 취소된다',
    pins: 'M2-11 넷째 항목 — signal 취소',
    steps: [
      { press: 'live-activate-a' },
      {
        note: 'live/a의 조회가 떠 있다',
        expect: {
          cards: {
            live: { liveKey: 'live/a', livePhase: 'pending / fetching' },
          },
          requests: { 'READ-1': { key: 'live/a', outcome: 'in-flight' } },
        },
      },
      { press: 'live-key-b' },
      {
        note:
          '표시가 이 view뿐이었으므로 이전 key의 조회는 **취소된다** — READ-1이 ' +
          'aborted가 되고 새 key의 조회가 시작된다',
        expect: {
          cards: {
            live: { liveKey: 'live/b', livePhase: 'pending / fetching' },
          },
          requests: {
            'READ-1': { key: 'live/a', outcome: 'aborted' },
            'READ-2': { key: 'live/b', outcome: 'in-flight' },
          },
        },
      },
      { press: 'settle-all' },
      {
        note: '새 key의 값만 표시된다',
        expect: {
          cards: { live: { liveKey: 'live/b', liveCity: '서울-b' } },
        },
      },
    ],
  },
  {
    id: 'M2-11-4-late',
    title: 'signal을 무시한 이전 key의 늦은 결과가 새 표시에 들어가지 않는다',
    pins: 'M2-11 넷째 항목 — 늦은 결과 차단',
    steps: [
      { press: 'next-read-ignore-signal' },
      { press: 'live-activate-a' },
      { press: 'live-key-b' },
      {
        note:
          '이 조회는 abort를 듣지 않으므로 READ-1이 취소되지 않고 떠 있다 — ' +
          'M2-11-4-cancel과 갈리는 한 칸이다',
        expect: {
          requests: {
            'READ-1': { key: 'live/a', outcome: 'in-flight' },
            'READ-2': { key: 'live/b', outcome: 'in-flight' },
          },
          cards: { live: { liveKey: 'live/b' } },
        },
      },
      { press: 'settle-read' },
      {
        note:
          '이전 key의 결과가 늦게 도착했다(READ-1 success). 표시는 여전히 새 key를 ' +
          '기다리는 중이고 서울-a는 어디에도 나타나지 않는다 — 늦은 결과가 버려졌다',
        expect: {
          requests: { 'READ-1': { key: 'live/a', outcome: 'success' } },
          cards: {
            live: {
              liveKey: 'live/b',
              livePhase: 'pending / fetching',
              liveCity: '(없음)',
            },
          },
        },
      },
      { press: 'settle-read' },
      {
        note: '새 key의 결과만 표시에 들어간다',
        expect: {
          cards: {
            live: {
              liveKey: 'live/b',
              livePhase: 'success / idle',
              liveCity: '서울-b',
            },
          },
        },
      },
    ],
  },
];

/**
 * Every ported checklist item, in checklist order.
 *
 * Declared last on purpose: the lists it spreads have to exist first.
 */
/**
 * The observation card (Phase 8.8 단계 7).
 *
 * These read `inspectCache()` and `inspectMutations()` off the screen, which is
 * what M2-19's seventh and thirteenth items ask for, plus the two lifecycle
 * numbers nothing could see before: how many handles hold a key, and how many
 * listeners the client put on the environment.
 *
 * Every string below was measured through the model first and copied from the
 * reading - never written from what a value ought to be.
 */
export const M2_INSPECT: readonly Scenario[] = [
  {
    id: 'M2-19-7-cache',
    title: '캐시 관측이 조회 상태·소유자 수·생성을 그대로 보여 준다',
    pins: 'M2-19 7항 (inspectCache) · M2-18 4항 첫 문장 (시작 전 listener 없음)',
    steps: [
      {
        note: '조작 전. 두 패널이 한 key를 공유하므로 owners가 2다 — 지금까지 화면에 그 숫자가 없어 두 카드가 같은 값을 보이는 것으로 추론했다. 아직 아무 조회도 시작하지 않았으므로 환경 listener는 0이다',
        expect: {
          cards: {
            inspect: {
              cacheSize: '2',
              cacheOwners: '3',
              openMutations: '0',
              inspectSubscribed: 'true',
              observedEvents: '0 / 0',
              cacheEventFields: '(이벤트 없음)',
              mutationEventFields: '(이벤트 없음)',
              envListeners: '0',
            },
          },
          cache: {
            inspect: [
              {
                key: 'profile',
                kind: 'query',
                owners: '2',
                status: 'pending / idle',
              },
              {
                key: 'profile/readonly',
                kind: 'query',
                owners: '1',
                status: 'pending / idle',
              },
            ],
          },
          mutations: { inspect: [] },
        },
      },
      { press: 'load' },
      {
        note: '조회가 시작되자 환경 listener가 1이 된다. 관찰자는 load()/refetch()에서만 start()하므로(index.ts:1070) 그 전에는 만들어지지 않는다 — M2-18 4항의 첫 문장이다. 이벤트 필드에는 payload가 없다',
        expect: {
          cards: {
            inspect: {
              envListeners: '1',
              cacheEventFields: 'kind,owners,queryKey,status',
              mutationEventFields: '(이벤트 없음)',
            },
          },
          cache: {
            inspect: [
              { key: 'profile', owners: '2', status: 'pending / fetching' },
              {
                key: 'profile/readonly',
                owners: '1',
                status: 'pending / fetching',
              },
            ],
          },
        },
      },
      { press: 'settle-all' },
      {
        note: '완료 뒤 두 항목 모두 success/idle이고 소유자 수는 그대로다',
        expect: {
          cards: { inspect: { cacheSize: '2', cacheOwners: '3' } },
          cache: {
            inspect: [
              { key: 'profile', owners: '2', status: 'success / idle' },
              {
                key: 'profile/readonly',
                owners: '1',
                status: 'success / idle',
              },
            ],
          },
        },
      },
      { press: 'live-activate-a' },
      {
        note: '새 key가 생기는 것이 표에 한 줄로 나타난다 (M2-19 7항의 "생성")',
        expect: {
          cards: { inspect: { cacheSize: '3', cacheOwners: '4' } },
          cache: {
            inspect: [
              { key: 'profile', owners: '2' },
              { key: 'profile/readonly', owners: '1' },
              { key: 'live/a', owners: '1', status: 'pending / fetching' },
            ],
          },
        },
      },
    ],
  },
  {
    id: 'M2-11-5-release',
    title: '비활성화와 해제 뒤 그 key의 구독이 남지 않는다',
    pins: 'M2-11 5항 (비활성화·해제 뒤 구독이 남지 않는다) · M2-19 7항 (소유자 수)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'live-activate-a' },
      { press: 'settle-all' },
      { press: 'live-key-b' },
      {
        note: 'key를 바꾸면 이전 key의 구독이 곧바로 사라진다: live/a가 owners 0이 되고 live/b가 1을 든다. 캐시 항목은 남으므로 cacheSize는 4로 늘고 소유자 합계는 4에 머문다 — 구독이 남지 않는 것과 캐시에서 사라지는 것은 다른 사실이다 (DC8-8-15)',
        expect: {
          cards: { inspect: { cacheSize: '4', cacheOwners: '4' } },
          cache: {
            inspect: [
              { key: 'profile', owners: '2' },
              { key: 'profile/readonly', owners: '1' },
              { key: 'live/a', owners: '0' },
              { key: 'live/b', owners: '1', status: 'pending / fetching' },
            ],
          },
        },
      },
      { press: 'settle-all' },
      { press: 'live-deactivate' },
      {
        note: '비활성화하면 두 live key 모두 owners 0이다. 표시도 비고(liveKey (없음)), 구독도 남지 않는다',
        expect: {
          cards: {
            inspect: { cacheSize: '4', cacheOwners: '3' },
            live: { liveKey: '(없음)', liveEnabled: 'false' },
          },
          cache: {
            inspect: [
              { key: 'profile', owners: '2' },
              { key: 'profile/readonly', owners: '1' },
              { key: 'live/a', owners: '0' },
              { key: 'live/b', owners: '0' },
            ],
          },
        },
      },
      { press: 'live-dispose' },
      {
        note: '해제는 소유자 수를 더 내리지 않는다 — 비활성화가 이미 다 놓았기 때문이다. 표시만 (해제됨)으로 바뀐다. `표시 해제`의 결과 문구는 "구독도 남지 않는다"고 주장해 왔고, 그 주장을 처음 화면에서 확인한다',
        expect: {
          cards: {
            inspect: { cacheSize: '4', cacheOwners: '3' },
            live: { liveKey: '(해제됨)', liveCity: '(해제됨)' },
          },
          cache: {
            inspect: [
              { key: 'profile', owners: '2' },
              { key: 'profile/readonly', owners: '1' },
              { key: 'live/a', owners: '0' },
              { key: 'live/b', owners: '0' },
            ],
          },
        },
      },
    ],
  },
  {
    id: 'M2-19-7-remove',
    title: '붙잡고 있으면 제거를 거절하고, 놓은 뒤에는 캐시에서 사라진다',
    pins: 'M2-19 7항 (생성/제거)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'live-activate-a' },
      { press: 'settle-all' },
      {
        note: '표시가 live/a를 보고 있으므로 소유자가 1이다',
        expect: {
          cards: { inspect: { cacheSize: '3', cacheOwners: '4' } },
          cache: {
            inspect: [
              { key: 'profile', owners: '2' },
              { key: 'profile/readonly', owners: '1' },
              { key: 'live/a', owners: '1', status: 'success / idle' },
            ],
          },
        },
      },
      { press: 'cache-remove-live-a' },
      {
        note: '소유자가 있는 항목의 제거는 거절된다. 표가 그대로이고 화면이 이유를 말한다 — 같은 버튼이 두 번 다르게 답하는 것이 이 항목의 내용이다',
        expect: {
          cards: {
            inspect: { cacheSize: '3', cacheOwners: '4' },
            operations: { lastResult: { contains: '제거하지 않았다' } },
          },
          cache: {
            inspect: [
              { key: 'profile', owners: '2' },
              { key: 'profile/readonly', owners: '1' },
              { key: 'live/a', owners: '1' },
            ],
          },
        },
      },
      { press: 'live-deactivate' },
      {
        note: '비활성화로 소유자가 0이 됐지만 항목은 아직 남아 있다 (DC8-8-15)',
        expect: {
          cards: { inspect: { cacheSize: '3', cacheOwners: '3' } },
          cache: {
            inspect: [
              { key: 'profile', owners: '2' },
              { key: 'profile/readonly', owners: '1' },
              { key: 'live/a', owners: '0' },
            ],
          },
        },
      },
      { press: 'cache-remove-live-a' },
      {
        note: '이제 제거된다. 표에서 줄이 사라지고 cacheSize가 2로 줄어든다 — M2-19 7항이 요구하는 "제거"다',
        expect: {
          cards: {
            inspect: { cacheSize: '2', cacheOwners: '3' },
            operations: { lastResult: { contains: '제거했다' } },
          },
          cache: {
            inspect: [
              { key: 'profile', owners: '2', status: 'success / idle' },
              {
                key: 'profile/readonly',
                owners: '1',
                status: 'success / idle',
              },
            ],
          },
        },
      },
    ],
  },
  {
    id: 'M2-19-13-mutations',
    title: '미종료 WRITE만 보이고, 종료하면 목록에서 빠진다',
    pins: 'M2-19 13항 (inspectMutations)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'capture' },
      {
        note: '로컬 편집과 제출 고정만으로는 WRITE가 시작되지 않으므로 목록은 비어 있다',
        expect: {
          cards: { inspect: { openMutations: '0' } },
          mutations: { inspect: [] },
        },
      },
      { press: 'save' },
      {
        note: '실행 중인 WRITE는 phase pending이고, 연결된 key가 profile 하나로 보인다. 이벤트 필드에는 입력 DTO·응답·오류가 없고 idempotent는 불리언일 뿐 키 값이 아니다',
        expect: {
          cards: {
            inspect: {
              openMutations: '1',
              mutationEventFields:
                'attempt,idempotent,linkedKeys,operationId,phase,scope,settledAt,startedAt',
            },
          },
          mutations: {
            inspect: [
              {
                id: '1',
                phase: 'pending',
                scope: '(없음)',
                attempt: '0',
                idempotent: 'false',
                linked: 'profile',
              },
            ],
          },
        },
      },
      { press: 'settle-all' },
      {
        note: '종료한 작업은 client가 보관하지 않으므로 목록이 빈다. 미종료만 보인다는 것이 이 항목의 내용이다',
        expect: {
          cards: { inspect: { openMutations: '0' } },
          mutations: { inspect: [] },
        },
      },
    ],
  },
  {
    id: 'M2-19-7-unsubscribe',
    title:
      '구독을 해제하면 이후 이벤트가 오지 않고, 재개하면 그 시점부터만 온다',
    pins: 'M2-19 7항·13항의 마지막 문장 (구독 해제 뒤 이벤트 없음)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'inspect-unsubscribe' },
      {
        note: '해제했으므로 구독 이후 이벤트는 0이다. 이미 관측한 필드 목록은 남는다 — 그것은 표면에 대한 사실이고 구독 상태와 무관하다',
        expect: {
          cards: {
            inspect: {
              inspectSubscribed: 'false',
              observedEvents: '0 / 0',
              cacheEventFields: 'kind,owners,queryKey,status',
            },
          },
        },
      },
      { press: 'refetch' },
      { press: 'settle-all' },
      {
        note: '재조회가 캐시를 실제로 움직였고 표가 그것을 따라 갱신됐는데도(success/idle) 해제한 쪽의 이벤트 수는 0이다. 데모는 같은 흐름에 두 쌍의 핸들을 걸고 있고 다시 그리는 쪽은 살아 있으므로, 이 0은 "이벤트가 흐르지 않았다"가 아니라 **해제한 그 listener에게 오지 않았다**는 뜻이다 — 해제가 listener 단위라는 더 강한 주장이다 (DC8-8-17)',
        expect: {
          cards: { inspect: { observedEvents: '0 / 0' } },
          cache: {
            inspect: [
              { key: 'profile', owners: '2', status: 'success / idle' },
              {
                key: 'profile/readonly',
                owners: '1',
                status: 'success / idle',
              },
            ],
          },
        },
      },
      { press: 'inspect-resubscribe' },
      {
        note: '재개 직후는 0이다. 해제 중에 지나간 이벤트가 몰려오지 않는다',
        expect: {
          cards: {
            inspect: { inspectSubscribed: 'true', observedEvents: '0 / 0' },
          },
        },
      },
      { press: 'refetch' },
      { press: 'settle-all' },
      {
        note: '재개한 listener에게 다시 이벤트가 온다. 이 수는 누적 총계가 아니라 이 눌림 수열에 대한 값이고(DC8-8-13), WRITE 이벤트는 여전히 0이다',
        expect: {
          cards: { inspect: { observedEvents: '4 / 0' } },
        },
      },
    ],
  },
];

/**
 * The second client (Phase 8.8 단계 8).
 *
 * Same environment, same key `profile` - a different key would prove nothing
 * (DC8-8-18). What the two cards show side by side is the whole point: two cache
 * tables each holding a `profile` row, two event counters, and two baselines
 * that do not move together.
 *
 * Measured through the model first; every string here was copied from a reading.
 */
export const M2_CLIENTS: readonly Scenario[] = [
  {
    id: 'M2-03-share',
    title: '한 client 안에서는 같은 key를 공유한다',
    pins: 'M2-03 첫째·둘째 항목 (같은 key 공유, 편집은 보이고 WRITE는 없다)',
    steps: [
      { press: 'load' },
      {
        note: '패널 두 장이 한 key를 보므로 소유자가 2다. `최초 조회`는 패널 조회 하나와 readonly 조회 하나만 냈고 — 패널 B는 아무것도 요청하지 않았는데 함께 fetching이다. 그것이 진행 READ를 공유한다는 뜻이다',
        expect: {
          cards: {
            'resource-a': { status: 'pending / fetching' },
            'resource-b': { status: 'pending / fetching' },
            requests: { counts: '2 / 0' },
            inspect: { cacheSize: '2', cacheOwners: '3' },
          },
          cache: {
            inspect: [
              { key: 'profile', owners: '2', status: 'pending / fetching' },
              {
                key: 'profile/readonly',
                owners: '1',
                status: 'pending / fetching',
              },
            ],
          },
          requests: {
            'READ-1': { key: 'profile' },
            'READ-2': { key: 'profile/readonly' },
          },
          absentRequests: ['READ-3'],
        },
      },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      {
        note: '한 패널의 편집이 다른 패널에 그대로 보이고, 요청은 늘지 않는다 — 편집만으로 WRITE는 없다',
        expect: {
          cards: {
            'resource-a': { city: '부산', dirty: 'true' },
            'resource-b': { city: '부산', dirty: 'true' },
            requests: { counts: '2 / 0' },
            inspect: { openMutations: '0' },
          },
          mutations: { inspect: [] },
          absentRequests: ['READ-3'],
        },
      },
    ],
  },
  {
    id: 'M2-03-isolate',
    title: '둘째 client는 같은 key의 값·편집·요청을 공유하지 않는다',
    pins: 'M2-03 여섯째 항목 (별도 client 격리, R2-07)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      {
        note: '주 client만 있는 상태. probe 카드는 아직 없다',
        expect: { absentCards: ['probe'] },
      },
      { press: 'probe-open' },
      {
        note: '같은 key `profile`에 둘째 client를 열었다. 캐시가 따로이므로 그 client의 표는 자기 항목 하나만 들고, 기준이 없어 `pending / idle`이다 — 주 client는 이미 로드됐는데도 값을 물려받지 않는다. 아직 조회하지 않았으므로 환경 listener는 1 그대로다',
        expect: {
          cards: {
            probe: {
              probeState: '열림',
              status: 'pending / idle',
              cacheSize: '1',
              cacheOwners: '1',
              observedEvents: '0',
            },
            inspect: { cacheSize: '2', cacheOwners: '3', envListeners: '1' },
          },
          cache: {
            probe: [
              {
                key: 'profile',
                kind: 'query',
                owners: '1',
                status: 'pending / idle',
              },
            ],
            inspect: [
              { key: 'profile', owners: '2', status: 'success / idle' },
              {
                key: 'profile/readonly',
                owners: '1',
                status: 'success / idle',
              },
            ],
          },
        },
      },
      { press: 'probe-load' },
      { press: 'settle-all' },
      {
        note: '요청이 따로 나갔다: 주 client가 같은 key를 이미 들고 있는데도 READ가 2 → 3으로 늘고 그 key는 `profile`이다. 공유할 진행 READ가 없다는 뜻이다',
        expect: {
          cards: {
            probe: { status: 'success / idle', city: '서울', dirty: 'false' },
            requests: { counts: '3 / 0' },
          },
          requests: { 'READ-3': { key: 'profile', outcome: 'success' } },
        },
      },
      { press: 'probe-edit' },
      {
        note: '둘째 client에서만 도시를 바꿨다. 같은 key인데 패널 두 장은 서울·clean 그대로고 요청도 늘지 않는다',
        expect: {
          cards: {
            probe: { city: '제주', dirty: 'true', version: '1 / 0' },
            'resource-a': { city: '서울', dirty: 'false', version: '0 / 0' },
            'resource-b': { city: '서울', dirty: 'false' },
            requests: { counts: '3 / 0' },
          },
        },
      },
      { press: 'edit-busan' },
      {
        note: '반대 방향도 마찬가지다. 패널은 부산·dirty가 되고 둘째 client는 제주·version 1 그대로다 — 두 기준이 각자 움직인다',
        expect: {
          cards: {
            'resource-a': { city: '부산', dirty: 'true', version: '1 / 0' },
            probe: { city: '제주', dirty: 'true', version: '1 / 0' },
            requests: { counts: '3 / 0' },
          },
        },
      },
    ],
  },
  {
    id: 'M2-19-per-client',
    title: '관측은 client별이다',
    pins: 'M2-19 7항·13항의 `client별`',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'probe-open' },
      { press: 'probe-load' },
      { press: 'settle-all' },
      {
        note: '두 표가 같은 이름의 줄을 따로 들고 있다. 주 client의 표에 둘째 client의 항목이 나타나지 않고, 그 반대도 아니다 — `inspectCache()`는 자기 client의 캐시만 본다',
        expect: {
          cards: {
            inspect: { cacheSize: '2', cacheOwners: '3' },
            probe: { cacheSize: '1', cacheOwners: '1' },
          },
          cache: {
            inspect: [
              { key: 'profile', owners: '2' },
              { key: 'profile/readonly', owners: '1' },
            ],
            probe: [{ key: 'profile', owners: '1' }],
          },
        },
      },
      { press: 'edit-busan' },
      { press: 'capture' },
      { press: 'save' },
      {
        note: '주 client의 진행 중 WRITE는 주 client의 목록에만 있다. 둘째 client에는 WRITE 표가 아예 없다 — `inspectMutations()`도 client별이다',
        expect: {
          cards: { inspect: { openMutations: '1' } },
          mutations: {
            inspect: [{ id: '1', phase: 'pending', linked: 'profile' }],
          },
        },
      },
      { press: 'settle-all' },
      {
        note: '완료 뒤 주 client의 목록이 빈다. 그 동안 둘째 client의 이벤트 수는 자기 client에서 일어난 일만 센다 — 주 client의 WRITE와 복구는 거기 세어지지 않는다',
        expect: {
          cards: {
            inspect: { openMutations: '0' },
            probe: { observedEvents: '3', city: '서울', dirty: 'false' },
          },
          mutations: { inspect: [] },
        },
      },
    ],
  },
  {
    id: 'M2-18-4-dispose',
    title:
      '마지막 시작 관찰자를 해제하면 그 client의 환경 listener가 남지 않는다',
    pins: 'M2-18 4항 뒷문장 (dispose 뒤 listener 없음)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      {
        note: '주 client 하나가 조회를 시작했으므로 listener는 1이다',
        expect: { cards: { inspect: { envListeners: '1' } } },
      },
      { press: 'probe-open' },
      {
        note: '둘째 client를 열어도 아직 1이다. 관찰자는 load()/refetch()에서만 시작한다',
        expect: { cards: { inspect: { envListeners: '1' } } },
      },
      { press: 'probe-load' },
      { press: 'settle-all' },
      {
        note: 'client마다 한 번씩 구독하므로 2가 된다',
        expect: {
          cards: {
            inspect: { envListeners: '2' },
            probe: { status: 'success / idle' },
          },
        },
      },
      { press: 'probe-dispose' },
      {
        note: '둘째 client의 조회를 해제했다. 그것이 그 client의 마지막 시작 관찰자였으므로 listener가 1로 돌아온다 — 패널 조회는 화면과 수명이 같아 이 문장을 시험할 수 없고, 해제할 수 있는 client가 있어야 닿는다. 해제한 client의 행은 모두 `(해제됨)`이고 그 캐시 표는 비어 있다',
        expect: {
          cards: {
            inspect: { envListeners: '1', cacheSize: '2', cacheOwners: '3' },
            probe: {
              probeState: '해제됨',
              status: '(해제됨)',
              cacheSize: '(해제됨)',
              observedEvents: '(해제됨)',
            },
          },
          cache: { probe: [] },
        },
      },
    ],
  },
];

/**
 * Ordering between several commands (Phase 8.8 단계 9).
 *
 * Three readings, and the contrast is what makes the claim mean anything: an
 * unscoped pair both reach the server, a scoped pair does not, and a linked
 * save is refused outright while another is in flight. Together they are what
 * M2-11's third bullet calls 명시적 순서·충돌 정책, and the `queued` phase is
 * the last clause M2-19's thirteenth item was missing.
 */
export const M2_ORDER: readonly Scenario[] = [
  {
    id: 'M2-11-3-unordered',
    title: 'scope를 선언하지 않은 명령들에는 순서가 약속되지 않는다',
    pins: 'M2-11 셋째 항목 (여러 mutation의 명시적 순서) — 대비 항',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'command-run' },
      { press: 'command-run' },
      {
        note: '연결하지 않은 명령 둘은 장벽에 걸리지 않고 **둘 다 pending**이다. WRITE가 2건 나가 둘 다 떠 있다 — sync는 선언하지 않은 순서를 만들어 내지 않는다',
        expect: {
          cards: {
            inspect: { openMutations: '2' },
            operations: { mutationPending: '2' },
            requests: { counts: '2 / 2', inFlight: '2' },
          },
          mutations: {
            inspect: [
              {
                id: '1',
                phase: 'pending',
                scope: '(없음)',
                linked: '(없음)',
              },
              {
                id: '2',
                phase: 'pending',
                scope: '(없음)',
                linked: '(없음)',
              },
            ],
          },
        },
      },
    ],
  },
  {
    id: 'M2-11-3-scoped',
    title:
      '같은 scope의 둘째 명령은 queued로 기다리고, 앞선 작업이 끝난 뒤에 나간다',
    pins: 'M2-11 셋째 항목 (명시적 순서) · M2-19 13항 (scope 대기는 queued, 실행은 pending)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'command-scoped' },
      { press: 'command-scoped' },
      {
        note: '같은 scope를 선언하면 첫째만 pending이고 둘째는 queued다. 그리고 **WRITE는 1건뿐이다** — queued는 이름표가 아니라 요청이 아직 서버에 가지 않았다는 뜻이다',
        expect: {
          cards: {
            inspect: { openMutations: '2' },
            operations: { mutationPending: '2' },
            requests: { counts: '2 / 1', inFlight: '1' },
          },
          mutations: {
            inspect: [
              { id: '1', phase: 'pending', scope: 'address' },
              { id: '2', phase: 'queued', scope: 'address' },
            ],
          },
        },
      },
      { press: 'settle-write' },
      {
        note: '앞선 작업을 완료하자 목록에서 빠지고 둘째가 pending으로 올라가 WRITE가 2건이 된다. 화면이 끝난 작업의 번호를 말한다 — 순서가 선언한 대로 지켜졌다',
        expect: {
          cards: {
            inspect: { openMutations: '1' },
            operations: {
              lastResult: { contains: '작업 1: success' },
              mutationPending: '1',
            },
            requests: { counts: '2 / 2' },
          },
          mutations: {
            inspect: [{ id: '2', phase: 'pending', scope: 'address' }],
          },
        },
      },
    ],
  },
  {
    id: 'M2-11-3-barrier',
    title: '같은 조회에 연결된 저장은 겹치지 않는다',
    pins: 'M2-11 셋째 항목 (충돌 정책)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'edit-busan' },
      { press: 'capture' },
      { press: 'save' },
      { press: 'save' },
      {
        note: '연결된 저장이 진행 중이면 둘째 저장은 시작되지 않는다. 목록에 줄이 하나뿐이고 WRITE도 1건이며, 화면이 이유를 말한다 — 순서를 선언하지 않은 연결 저장들의 충돌 정책은 "겹치지 않는다"다',
        expect: {
          cards: {
            inspect: { openMutations: '1' },
            operations: {
              mutationPending: '1',
              lastResult: {
                contains: '이 조회에 연결된 저장이 이미 진행 중이다',
              },
            },
            requests: { counts: '2 / 1', inFlight: '1' },
          },
          mutations: {
            inspect: [
              { id: '1', phase: 'pending', scope: '(없음)', linked: 'profile' },
            ],
          },
        },
      },
    ],
  },
];

/**
 * M2-17 - path, array and data boundaries.
 *
 * Four refusals that must all be *no-change* failures, and the two rules that
 * keep unsupported data out of both an editable query and a draft. The three
 * apply refusals share the same four buttons and differ only in the source, so
 * the reading is which reason the same sequence produces from each.
 */
const M2_17: readonly Scenario[] = [
  {
    id: 'M2-17-1-missing',
    title:
      '원본의 부모가 사라지면 적용이 missing-source로 거절하고 아무것도 바꾸지 않는다',
    pins: 'M2-17 첫째 항목 (부모 소멸)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'boundary-branch-room' },
      { press: 'boundary-edit' },
      {
        note: 'child ref에서 분기한 draft다. 원본이 레코드가 아니라 그 안의 한 칸이므로 변경 경로가 `(root)`이고, 그 한 칸이 곧 draft 전체다',
        expect: {
          cards: {
            boundary: {
              boundarySource: '원본 office.room',
              boundaryValue: '999',
              draftDirty: 'true',
              version: '1 / 0',
            },
          },
          changes: {
            boundary: [
              {
                path: '(root)',
                before: '"301"',
                after: '"999"',
                source: '"301"',
                conflict: '-',
              },
            ],
          },
        },
      },
      { press: 'remove-office' },
      {
        note: '부모를 없애자 draft는 **적용을 누르기 전에 이미** 원본이 없음을 안다 — `원본` 칸이 `(없음)`이 되고 충돌로 선다. 입력 `999`는 그대로다',
        expect: {
          cards: {
            boundary: { boundaryValue: '999', version: '2 / 1' },
            'resource-a': { office: '(없음)' },
          },
          changes: {
            boundary: [
              {
                path: '(root)',
                after: '"999"',
                source: '(없음)',
                conflict: 'conflict',
              },
            ],
          },
        },
      },
      { press: 'boundary-apply' },
      {
        note: '적용이 `missing-source`로 거절하고 **원본도 draft도 그대로다.** 원본의 변경 기록에는 사무실을 없앤 한 줄만 있고 방 번호를 쓴 줄은 없다 — 무변경 실패다',
        expect: {
          cards: {
            operations: {
              lastResult: { contains: '적용 거절: missing-source' },
            },
            boundary: { boundaryValue: '999', draftDirty: 'true' },
            'resource-a': { office: '(없음)', version: '1 / 0' },
          },
          changes: {
            'resource-a': [{ path: 'office', after: 'null', conflict: '-' }],
            boundary: [
              {
                path: '(root)',
                after: '"999"',
                source: '(없음)',
                conflict: 'conflict',
              },
            ],
          },
        },
      },
    ],
  },
  {
    id: 'M2-17-1-type',
    title:
      '원본의 타입이 바뀌면 적용이 conflict로 거절한다 — 글자가 같아도 같은 값이 아니다',
    pins: 'M2-17 첫째 항목 (타입 교체)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'boundary-branch-room' },
      { press: 'boundary-edit' },
      { press: 'swap-room-type' },
      {
        note: '원본은 이 쓰기를 받는다 — `office.room`이 문자열에서 배열이 됐다. draft의 `before`는 `"301"`, `원본`은 `["301"]`이다. **화면의 글자는 같고 따옴표와 괄호만 다르다**',
        expect: {
          cards: {
            'resource-a': { office: '{"floor":3,"room":["301"]}' },
            boundary: { version: '2 / 1' },
          },
          changes: {
            'resource-a': [
              { path: 'office.room', before: '"301"', after: '["301"]' },
            ],
            boundary: [
              {
                path: '(root)',
                before: '"301"',
                after: '"999"',
                source: '["301"]',
                conflict: 'conflict',
              },
            ],
          },
        },
      },
      { press: 'boundary-apply' },
      {
        note: '`conflict`로 거절한다 — 경로는 살아 있으므로 `missing-source`가 아니다. 원본의 배열은 그대로 남고 draft의 `999`도 남는다',
        expect: {
          cards: {
            operations: { lastResult: { contains: '적용 거절: conflict' } },
            'resource-a': { office: '{"floor":3,"room":["301"]}' },
            boundary: { boundaryValue: '999', draftDirty: 'true' },
          },
        },
      },
    ],
  },
  {
    id: 'M2-17-1-readonly',
    title: 'readonly 원본은 분기와 편집을 받고 적용만 readonly로 거절한다',
    pins: 'M2-17 첫째 항목 (readonly) · CI-31',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'boundary-branch-readonly' },
      { press: 'boundary-edit' },
      {
        note: 'readonly 조회에서도 분기와 편집은 된다. 거절은 적용에서만 난다 — 그래서 입력을 쥔 채로 검토할 수 있다',
        expect: {
          cards: {
            boundary: { boundarySource: 'readonly 조회', draftDirty: 'true' },
          },
          changes: {
            boundary: [
              {
                path: 'city',
                before: '"서울"',
                after: '"대전"',
                source: '"서울"',
                conflict: '-',
              },
            ],
          },
        },
      },
      { press: 'boundary-apply' },
      {
        note: '`readonly`로 거절한다. **원본이 사라졌다고 말하지 않는다** — `원본` 칸은 여전히 `"서울"`이고 충돌도 아니다. 거절 뒤에도 draft는 멀쩡하다',
        expect: {
          cards: {
            operations: { lastResult: { contains: '적용 거절: readonly' } },
            boundary: { draftDirty: 'true', version: '1 / 0' },
          },
          changes: {
            boundary: [
              {
                path: 'city',
                before: '"서울"',
                after: '"대전"',
                source: '"서울"',
                conflict: '-',
              },
            ],
          },
        },
      },
      { press: 'boundary-apply' },
      {
        note: '다시 물어도 같은 답이다. 거절이 draft를 망가뜨리지 않았다는 뜻이고, 이 문장이 [CI-31](../core-improvement/REQUIREMENTS.md)이 고친 자리다',
        expect: {
          cards: {
            operations: { lastResult: { contains: '적용 거절: readonly' } },
            boundary: { version: '1 / 0' },
          },
          changes: {
            boundary: [{ path: 'city', source: '"서울"', conflict: '-' }],
          },
        },
      },
    ],
  },
  {
    id: 'M2-17-2-array',
    title:
      '배열 한 칸을 고쳐도 변경은 배열 하나다 — 재정렬 뒤 같은 인덱스를 이전 entity로 취급하지 않는다',
    pins: 'M2-17 둘째 항목 (배열 재정렬 경계)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'branch-drafts' },
      { press: 'draft-a-rename-contact' },
      {
        note: '`contacts[0].name`을 고쳤는데 기록된 경로는 **`contacts`**다. 배열 하나가 원자 단위이고 인덱스는 entity ID가 아니다 — 경로가 `contacts.0.name`이었다면 재정렬 뒤 그 경로는 다른 사람을 가리킨다',
        expect: {
          cards: { 'draft-a': { draftDirty: 'true', version: '1 / 0' } },
          changes: {
            'draft-a': [
              {
                path: 'contacts',
                after: { contains: '"name":"최"' },
                conflict: '-',
              },
            ],
          },
        },
      },
      { press: 'reorder-contacts' },
      {
        note: '원본을 뒤집자 그 한 줄이 충돌이 된다. `원본` 칸이 뒤집힌 배열을 보여 준다 — 비교 대상이 배열 전체이므로 순서가 바뀐 것도 차이다',
        expect: {
          cards: {
            'resource-a': { contacts: '박,이,김' },
            'draft-a': { version: '2 / 1' },
          },
          changes: {
            'draft-a': [
              {
                path: 'contacts',
                source: { contains: '[{"id":"c3"' },
                conflict: 'conflict',
              },
            ],
          },
        },
      },
      { press: 'draft-a-apply' },
      {
        note: '`conflict`로 거절한다. **원본의 순서가 그대로다** — 0번 자리에 `최`를 써넣지 않았다. 원자적 경계를 넘는 적용이 막힌 자리다',
        expect: {
          cards: {
            operations: { lastResult: { contains: '적용 거절: conflict' } },
            'resource-a': { contacts: '박,이,김' },
            'draft-a': { draftDirty: 'true' },
          },
        },
      },
    ],
  },
  {
    id: 'M2-17-3-rules',
    title:
      '예약 키·미지원 값·직접 변형은 원본과 draft 양쪽에서 각자의 말로 거절되고 아무것도 남기지 않는다',
    pins: 'M2-17 셋째·넷째 항목 (예약 키·미지원 값·직접 변형, query와 draft의 지원 범위)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'branch-drafts' },
      { press: 'draft-a-reserved-key' },
      {
        note: 'draft는 예약 키를 이름을 대며 거절한다',
        expect: {
          cards: {
            operations: {
              lastResult: {
                contains: 'Draft payload key toJSON is reserved.',
              },
            },
          },
        },
      },
      { press: 'draft-a-unsupported-value' },
      {
        note: 'Map은 평범한 acyclic 데이터가 아니다',
        expect: {
          cards: {
            operations: {
              lastResult: {
                contains: 'Draft values must be plain, acyclic data.',
              },
            },
          },
        },
      },
      { press: 'draft-a-mutate-snapshot' },
      {
        note: '읽어 온 값은 스냅숏이라 직접 고칠 수 없다 — 조용히 고쳐지는 대신 던진다',
        expect: {
          cards: {
            operations: {
              lastResult: {
                contains: 'Draft snapshots cannot be modified directly.',
              },
            },
          },
        },
      },
      { press: 'resource-reserved-key' },
      {
        note: '**같은 값을 원본에 쓰면 원본이 자기 말로 거절한다.** 두 지원 범위가 같다는 것이 이 짝의 내용이고, 층이 다르므로 문장도 다르다',
        expect: {
          cards: {
            operations: {
              lastResult: {
                contains: 'Resource payload key toJSON is reserved.',
              },
            },
          },
        },
      },
      { press: 'resource-unsupported-value' },
      {
        note: '원본도 Map을 받지 않는다. draft 쪽 문장과 짝이 되는 자리다',
        expect: {
          cards: {
            operations: {
              lastResult: {
                contains: 'Editable resources require plain, acyclic data.',
              },
            },
          },
        },
      },
      { press: 'resource-mutate-snapshot' },
      {
        note: '여섯 번의 거절이 끝났고 **원본은 clean이다** — dirty도 변경 줄도 없고 사무실도 처음 그대로다. 지원하지 않는 구조가 조용히 원본을 손상시키지 않았다는 것이 이 항목의 합격 기준이다',
        expect: {
          cards: {
            operations: {
              lastResult: {
                contains: 'Resource snapshots cannot be modified directly.',
              },
            },
            'resource-a': {
              dirty: 'false',
              version: '0 / 0',
              office: '{"floor":3,"room":"301"}',
            },
            'draft-a': { draftDirty: 'false' },
          },
          changes: { 'resource-a': [], 'draft-a': [] },
        },
      },
    ],
  },
];

/**
 * M2-16 items 2 and 4 - the screen-wide unsaved sum, and the review surface.
 *
 * The sum has to be read where it disagrees with the parent, or a row that
 * merely mirrored `resource.dirty` would pass. The review items have to be
 * refused for two different reasons - too old, and someone else's - and the
 * same held item has to *work* while it is current, or "refused" would only
 * mean "this button never works".
 */
const M2_16_REST: readonly Scenario[] = [
  {
    id: 'M2-16-2-unsaved',
    title:
      '화면 전체 미저장은 원본과 draft를 합산하되 원본의 dirty를 덮어쓰지 않는다',
    pins: 'M2-16 둘째 항목 (합산 표시)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'branch-drafts' },
      {
        note: '아무도 입력을 쥐지 않았다. 합산 행과 원본의 dirty가 둘 다 false로 같다 — 여기서는 두 행을 구별할 수 없다',
        expect: {
          cards: {
            operations: { unsaved: 'false' },
            'resource-a': { dirty: 'false' },
            'draft-a': { draftDirty: 'false' },
          },
        },
      },
      { press: 'draft-a-daejeon' },
      {
        note: '**여기서 갈린다.** draft만 입력을 쥐었는데 합산 행은 `true`이고 **원본의 dirty는 false 그대로**다. 합산이 부모를 덮어썼다면 원본 카드가 자기 것이 아닌 입력을 자기 것이라고 말했을 것이다',
        expect: {
          cards: {
            operations: { unsaved: 'true' },
            'resource-a': { dirty: 'false' },
            'draft-a': { draftDirty: 'true' },
          },
        },
      },
      { press: 'edit-busan' },
      {
        note: '원본도 입력을 쥐면 둘 다 true다. 합산 행은 켜진 채로 있고 — 두 출처가 켜졌다고 두 번 켜지지는 않는다',
        expect: {
          cards: {
            operations: { unsaved: 'true' },
            'resource-a': { dirty: 'true' },
          },
        },
      },
      { press: 'edit-seoul' },
      {
        note: '원본을 서버 값으로 되돌려 원본만 clean이 됐다. **합산은 여전히 true다** — draft가 아직 쥐고 있기 때문이고, 한쪽이 비었다고 화면 전체가 저장된 것은 아니다',
        expect: {
          cards: {
            operations: { unsaved: 'true' },
            'resource-a': { dirty: 'false' },
            'draft-a': { draftDirty: 'true' },
          },
          changes: { 'resource-a': [] },
        },
      },
      { press: 'draft-a-reset' },
      {
        note: '마지막 입력까지 지우면 합산이 내려간다. 올라간 것과 같은 이유로 내려간다',
        expect: {
          cards: {
            operations: { unsaved: 'false' },
            'resource-a': { dirty: 'false' },
            'draft-a': { draftDirty: 'false' },
          },
        },
      },
    ],
  },
  {
    id: 'M2-16-4-readonly',
    title:
      'readonly 조회도 검토 목록과 version을 가진다 — 영원히 비어 있고, 제출은 거절한다',
    pins: 'M2-16 넷째 항목 (readonly changes와 version)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      {
        note: '**검토 목록이 없는 것이 아니라 비어 있는 것이다.** 조회는 성공했고 version은 `0 / 0`이며 표는 빈 목록이다 — 빈 표가 곧 판독이다',
        expect: {
          cards: {
            readonly: {
              status: 'success / idle',
              dirty: 'false',
              version: '0 / 0',
            },
          },
          changes: { readonly: [] },
        },
      },
      { press: 'readonly-write' },
      {
        note: '쓰기가 거절되므로 여기에 쌓일 것이 없다. 표와 version은 그대로다',
        expect: {
          cards: {
            operations: {
              lastResult: { contains: 'This query is readonly.' },
            },
            readonly: { version: '0 / 0', dirty: 'false' },
          },
          changes: { readonly: [] },
        },
      },
      { press: 'readonly-capture' },
      {
        note: '제출 고정도 같은 문장으로 거절한다. 검토할 수는 있게 두되 제출할 것은 가지지 않는다',
        expect: {
          cards: {
            operations: {
              lastResult: { contains: 'This query is readonly.' },
            },
            readonly: { version: '0 / 0' },
          },
          changes: { readonly: [] },
        },
      },
      { press: 'edit-busan' },
      {
        note: '**편집 가능한 원본을 고쳐도 readonly 카드는 움직이지 않는다.** 다른 key의 다른 조회이고, 한쪽의 검토가 다른 쪽으로 새지 않는다',
        expect: {
          cards: {
            'resource-a': { dirty: 'true' },
            readonly: { dirty: 'false', version: '0 / 0' },
          },
          changes: { readonly: [] },
        },
      },
      { press: 'capture-unknown-id' },
      {
        note: '이 resource의 항목이 아닌 ID로는 제출을 고정할 수 없다 — 원본에도 같은 규칙이 있다',
        expect: {
          cards: {
            operations: {
              lastResult: {
                contains: 'Unknown or repeated resource change ID.',
              },
            },
          },
        },
      },
    ],
  },
  {
    id: 'M2-16-4-review',
    title:
      '오래된 검토나 다른 draft의 항목으로는 해소할 수 없고, 같은 항목도 현재이면 받는다',
    pins: 'M2-16 넷째 항목 (오래된 검토·다른 owner의 항목)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'branch-drafts' },
      { press: 'draft-a-daejeon' },
      { press: 'draft-b-daejeon' },
      { press: 'edit-gwangju' },
      {
        note: '두 draft가 같은 경로에 같은 입력을 쥐었고 원본이 겹치게 바뀌어 둘 다 충돌이다. **항목 번호도 둘 다 1이다** — 번호가 같다는 것이 다음 단계의 함정이다',
        expect: {
          cards: {
            'draft-a': { version: '2 / 1' },
            'draft-b': { version: '2 / 1' },
          },
          changes: {
            'draft-a': [{ path: 'city', conflict: 'conflict' }],
            'draft-b': [{ path: 'city', conflict: 'conflict' }],
          },
        },
      },
      { press: 'draft-a-resolve-other-owner' },
      {
        note: 'draft B의 항목으로 draft A를 해소하려 하면 `stale`로 거절한다. 번호도 경로도 version도 같은데 거절하는 이유는 **주인이 다르기** 때문이고, draft A는 그대로 충돌로 남는다',
        expect: {
          cards: {
            operations: { lastResult: { contains: '해소 거절: stale' } },
            'draft-a': { city: '대전', version: '2 / 1' },
          },
          changes: {
            'draft-a': [{ path: 'city', conflict: 'conflict' }],
          },
        },
      },
      { press: 'draft-a-hold-change' },
      { press: 'draft-a-rename-contact' },
      {
        note: '항목을 손에 든 뒤 draft가 움직였다. 손에 든 것은 version 2의 사진이고 draft는 이제 3이다',
        expect: {
          cards: { 'draft-a': { version: '3 / 1' } },
        },
      },
      { press: 'draft-a-resolve-held' },
      {
        note: '**오래된 검토로는 해소할 수 없다.** 화면이 두 version을 나란히 말하고, 충돌은 그대로 남는다 — 사용자가 보고 결정한 화면이 이미 지나갔기 때문이다',
        expect: {
          cards: {
            operations: {
              lastResult: { contains: '손에 든 항목의 version은 2이고' },
            },
            'draft-a': { city: '대전', version: '3 / 1' },
          },
        },
      },
      { press: 'draft-a-hold-change' },
      { press: 'draft-a-resolve-held' },
      {
        note: '**같은 버튼이 현재 항목으로는 받는다.** 거절이 "이 길이 막혔다"가 아니라 "이 항목이 낡았다"였음을 보이는 자리다. 해소 뒤 draft는 원본 쪽 값을 받아 clean이 된다',
        expect: {
          cards: {
            operations: {
              lastResult: { contains: '손에 든 항목으로 해소했다' },
            },
            'draft-a': { city: '광주' },
          },
        },
      },
    ],
  },
];

/**
 * M2-18 - lifetime and cleanup.
 *
 * The accumulation test only means something if the same instrument can also
 * count something: 0 after twenty rounds is a reading because 2 after keeping
 * two is one too (DC8-8-27's rule, applied to a counter rather than a
 * refusal).
 */
const M2_18: readonly Scenario[] = [
  {
    id: 'M2-18-1-cycles',
    title:
      'draft를 20회 만들고 끝내도 남는 것이 없고, 일부러 남긴 것은 정확히 그만큼 깨어난다',
    pins: 'M2-18 첫째 항목 (생성·종료 반복 뒤 누적 없음)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      {
        note: '기준선. 조회 핸들 셋이 캐시 항목 둘을 잡고 있고 환경 listener는 1이다',
        expect: {
          cards: {
            lifetime: { draftCycles: '0회', draftLive: '0', draftNotices: '0' },
            inspect: { cacheSize: '2', cacheOwners: '3', envListeners: '1' },
          },
        },
      },
      { press: 'draft-cycle-20' },
      {
        note: '20회를 돌렸다. **client가 보는 숫자는 하나도 움직이지 않았다** — 캐시 항목 수도 소유자 합계도 환경 listener도 그대로다',
        expect: {
          cards: {
            lifetime: { draftCycles: '20회', draftLive: '0' },
            inspect: { cacheSize: '2', cacheOwners: '3', envListeners: '1' },
          },
        },
      },
      { press: 'edit-busan' },
      {
        note: '**그런데 움직이지 않는 숫자만으로는 부족하다.** 원본을 고쳐 깨어나는 draft를 세면 `0`이다 — 20회분의 구독이 살아 있었다면 여기서 20이 나왔을 것이다',
        expect: {
          cards: {
            lifetime: { draftLive: '0', draftNotices: '0' },
            'resource-a': { city: '부산' },
          },
        },
      },
      { press: 'draft-keep-two' },
      { press: 'edit-memo' },
      {
        note: '**같은 계측이 2도 센다.** 일부러 살려 둔 draft 2개가 원본 변경 한 번에 깨어난다. 앞의 `0`이 "이 행은 원래 0만 나온다"가 아니었다는 뜻이다',
        expect: {
          cards: {
            lifetime: {
              draftCycles: '22회',
              draftLive: '2',
              draftNotices: '2',
            },
            inspect: { cacheSize: '2', cacheOwners: '3', envListeners: '1' },
          },
        },
      },
      { press: 'draft-release-kept' },
      { press: 'edit-memo' },
      {
        note: '종료하면 다시 0이다. 올라간 것과 같은 이유로 내려간다',
        expect: {
          cards: {
            lifetime: { draftLive: '0', draftNotices: '0' },
            inspect: { cacheSize: '2', cacheOwners: '3', envListeners: '1' },
          },
        },
      },
    ],
  },
  {
    id: 'M2-18-2-retained',
    title:
      '캐시 항목의 유지 사유 넷이 화면에 하나씩 쌓이고, 제거는 그때마다 거절된다',
    pins: 'M2-18 둘째 항목 (dirty·pending·복구 대기·열린 구독의 유지 사유)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'cache-remove-profile' },
      {
        note: '아무 입력도 없는데 제거가 거절된다. **유지 사유는 열린 구독 하나뿐이다** — 패널 두 장이 이 key를 보고 있다',
        expect: {
          cards: {
            lifetime: { retainedBy: '소유자 2' },
            operations: { lastResult: { contains: '유지 사유: 소유자 2' } },
            inspect: { cacheSize: '2' },
          },
        },
      },
      { press: 'edit-busan' },
      { press: 'cache-remove-profile' },
      {
        note: '로컬 입력이 생기자 사유가 둘이 된다. 하나가 해소돼도 나머지가 남는 한 항목은 유지된다',
        expect: {
          cards: {
            lifetime: { retainedBy: '소유자 2 · dirty' },
            'resource-a': { dirty: 'true' },
          },
        },
      },
      { press: 'capture' },
      { press: 'save' },
      { press: 'cache-remove-profile' },
      {
        note: '저장이 떠 있는 동안 셋이 된다. `진행 중 WRITE`는 dirty와 다른 축이고(M2-16 셋째 항목), 유지 사유로서도 따로 선다',
        expect: {
          cards: {
            lifetime: {
              retainedBy: { contains: '진행 중 WRITE 1' },
            },
            'resource-a': { serverBusy: 'true' },
          },
        },
      },
      { press: 'settle-all' },
      { press: 'next-write-transport-failure' },
      { press: 'edit-busan' },
      { press: 'capture' },
      { press: 'save' },
      { press: 'settle-all' },
      { press: 'cache-remove-profile' },
      {
        note: '전송이 실패해 결과를 모르는 WRITE가 끝났다. **dirty도 진행 중도 내려갔는데 복구 대기(미확정)만으로 항목이 유지된다** — 앞선 저장이 기준을 옮겨 로컬 차이는 없지만, 서버가 이번 것을 받았는지 모르는 채로 기준을 버릴 수는 없다',
        expect: {
          cards: {
            lifetime: { retainedBy: '소유자 2 · 미확정' },
            'resource-a': {
              unconfirmed: 'true',
              serverBusy: 'false',
              dirty: 'false',
            },
            operations: { lastResult: { contains: '미확정' } },
          },
        },
      },
    ],
  },
  {
    id: 'M2-18-3-5-held',
    title:
      '응답 교체는 손에 든 ref를 살려 두고 실제 만료는 거절한다. 한 화면이 끝나도 서버 없는 draft는 계속 쓰인다',
    pins: 'M2-18 셋째·다섯째 항목 (화면 독립·서버 없는 draft, 응답 교체와 만료의 차이)',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'probe-open' },
      { press: 'probe-load' },
      { press: 'settle-all' },
      { press: 'hold-probe-ref' },
      {
        note: '둘째 client의 도시 ref를 손에 들었다. 환경 listener는 2다 — 두 client가 각자 하나씩 구독한다',
        expect: {
          cards: {
            lifetime: { heldRef: '서울' },
            inspect: { envListeners: '2' },
          },
        },
      },
      { press: 'probe-edit' },
      { press: 'read-held-ref' },
      {
        note: '**응답이 교체돼도 같은 ref가 새 값을 준다.** 손에 든 것은 값의 사진이 아니라 경로이므로, 값이 바뀌면 바뀐 값을 읽는다',
        expect: {
          cards: {
            lifetime: { heldRef: '제주' },
            operations: { lastResult: { contains: '같은 ref가 새 값을 준다' } },
          },
        },
      },
      { press: 'serverless-edit' },
      {
        note: '서버 없는 draft를 편집했다. query도 client도 없는 원본이다',
        expect: {
          cards: {
            lifetime: { serverless: '로컬 메모 (편집됨) / 원본 로컬 메모' },
          },
        },
      },
      { press: 'probe-dispose' },
      { press: 'read-held-ref' },
      {
        note: '**그 화면이 끝나자 같은 ref가 거절한다.** 응답 교체와 실제 만료는 다른 경계다 — 하나는 값을 바꾸고 하나는 ref를 쓸 수 없게 만든다. 환경 listener도 1로 돌아왔다',
        expect: {
          cards: {
            lifetime: {
              heldRef: { contains: 'This query handle has been disposed.' },
            },
            inspect: { envListeners: '1' },
          },
        },
      },
      { press: 'serverless-apply' },
      {
        note: '**한 화면이 끝났다고 다른 것이 멈추지 않는다.** 서버 없는 draft는 그대로 적용되고 원본에 들어간다. 메인 화면의 패널도 그대로다',
        expect: {
          cards: {
            lifetime: {
              serverless: '로컬 메모 (편집됨) / 원본 로컬 메모 (편집됨)',
            },
            operations: {
              lastResult: { contains: 'client도 관여하지 않는다' },
            },
            'resource-a': { status: 'success / idle', city: '서울' },
          },
        },
      },
    ],
  },
];

/**
 * M2-19 items 3 and 8 - the two the demo could already almost answer.
 *
 * The other ten need screens this demo does not have (infinite queries,
 * persistence, offline resume, checkpoints, linked submissions), and the
 * decision not to port them wholesale is recorded in the phase notes. These
 * two are assembled from controls that already exist plus one draft source
 * that did not.
 */
const M2_19_REST: readonly Scenario[] = [
  {
    id: 'M2-19-3-axes',
    title:
      '복원된 서버 기준·미저장 입력·진행 작업이 화면에서 서로 섞이지 않는다',
    pins: 'M2-19 셋째 항목',
    steps: [
      { press: 'load' },
      { press: 'settle-all' },
      { press: 'server-edit-memo' },
      {
        note: '서버가 혼자 움직였다. `서버 도시 / revision`은 2가 됐는데 화면의 값도 dirty도 그대로다 — **서버가 바뀐 것과 내가 바꾼 것은 다른 사실이다**',
        expect: {
          cards: {
            requests: { server: '서울 / 2' },
            'resource-a': { city: '서울', dirty: 'false', serverBusy: 'false' },
          },
          changes: { 'resource-a': [] },
        },
      },
      { press: 'edit-busan' },
      {
        note: '미저장 입력이 생겼다. 서버 기준은 여전히 `서울 / 2`이고, 변경 줄이 그 둘의 차이를 말한다',
        expect: {
          cards: {
            requests: { server: '서울 / 2' },
            'resource-a': {
              city: '부산',
              dirty: 'true',
              serverBusy: 'false',
              unconfirmed: 'false',
            },
          },
          changes: {
            'resource-a': [{ path: 'city', before: '"서울"', after: '"부산"' }],
          },
        },
      },
      { press: 'capture' },
      { press: 'save' },
      {
        note: '진행 작업이 셋째 축으로 켜진다. **앞의 둘은 그대로다** — 값도 변경 줄도 그대로고 `dirty`도 내려가지 않는다. 저장을 시작한 것이 저장한 것은 아니다',
        expect: {
          cards: {
            'resource-a': {
              city: '부산',
              dirty: 'true',
              serverBusy: 'true',
              unconfirmed: 'false',
            },
            operations: { mutationPhase: 'pending', mutationPending: '1' },
          },
          changes: {
            'resource-a': [{ path: 'city', before: '"서울"', after: '"부산"' }],
          },
        },
      },
      { press: 'accept-server' },
      {
        note: '**진행 작업이 있는 동안에는 기준을 바꾸지 않는다.** 기준 수용이 거절되고 세 축 모두 움직이지 않는다 — 떠 있는 WRITE 아래에서 기준을 갈아치우면 그 WRITE의 결과를 무엇과 비교할지 알 수 없게 된다',
        expect: {
          cards: {
            operations: {
              lastResult: {
                contains: 'A linked operation is pending for this query.',
              },
            },
            'resource-a': { city: '부산', dirty: 'true', serverBusy: 'true' },
          },
        },
      },
      { press: 'settle-all' },
      {
        note: '저장이 끝나 셋째 축이 내려가고, 서버 기준이 `부산 / 3`으로 옮겨져 미저장 입력도 해소됐다. 세 축이 각자의 이유로 움직였다',
        expect: {
          cards: {
            requests: { server: '부산 / 3' },
            'resource-a': {
              city: '부산',
              dirty: 'false',
              serverBusy: 'false',
              unconfirmed: 'false',
            },
          },
          changes: { 'resource-a': [] },
        },
      },
      { press: 'server-edit-memo' },
      { press: 'edit-gwangju' },
      { press: 'accept-server' },
      {
        note: '**기준 복원이 미저장 입력을 먹지 않는다.** 서버가 혼자 바꾼 무관한 필드는 기준으로 들어왔는데, 내가 쥔 `광주`는 그 새 기준에 대한 변경으로 그대로 남는다 — 복원된 기준과 미저장 입력이 한 화면에서 각자 선다',
        expect: {
          cards: {
            'resource-a': { city: '광주', dirty: 'true', serverBusy: 'false' },
          },
          changes: {
            'resource-a': [{ path: 'city', before: '"부산"', after: '"광주"' }],
          },
        },
      },
    ],
  },
  {
    id: 'M2-19-8-apply',
    title:
      '이미 편집한 조회에서 분기한 draft는 깨끗하고, 적용은 네트워크 없이 root 변경 1건만 남긴다',
    pins: 'M2-19 여덟째 항목 (앞 다섯 문장)',
    steps: [
      { press: 'probe-open' },
      { press: 'probe-load' },
      { press: 'settle-all' },
      { press: 'probe-edit' },
      { press: 'boundary-branch-probe' },
      {
        note: '원본이 이미 `제주`로 편집된 상태인데 **draft는 clean에서 시작한다.** 값은 편집된 값을 물려받고 변경 기록은 물려받지 않는다',
        expect: {
          cards: {
            probe: { city: '제주', dirty: 'true' },
            boundary: {
              boundarySource: '둘째 client 조회',
              draftDirty: 'false',
              version: '0 / 0',
            },
          },
          changes: { boundary: [] },
        },
      },
      { press: 'boundary-edit' },
      {
        note: 'draft의 입력은 적용 전까지 원본 화면에 보이지 않는다. 원본은 `제주` 그대로다',
        expect: {
          cards: {
            probe: { city: '제주' },
            boundary: { draftDirty: 'true' },
            // Pinned here too, so the next step's identical count is a
            // statement about the apply rather than about this scenario.
            requests: { counts: '1 / 0' },
          },
          changes: {
            boundary: [
              {
                path: 'city',
                before: '"제주"',
                after: '"대전"',
                conflict: '-',
              },
            ],
          },
        },
      },
      { press: 'boundary-apply' },
      {
        note: '적용 뒤 **draft는 깨끗하고 원본이 편집 상태다.** 그리고 요청 수가 `1 / 0` 그대로다 — 로컬 적용에는 네트워크 호출이 없다',
        expect: {
          cards: {
            operations: { lastResult: { contains: '로컬 적용 1건' } },
            probe: { city: '대전' },
            boundary: { draftDirty: 'false' },
            requests: { counts: '1 / 0', inFlight: '0' },
          },
          changes: { boundary: [] },
        },
      },
      { press: 'probe-edit' },
      { press: 'boundary-edit' },
      { press: 'probe-edit-seoul' },
      {
        note: '**draft가 열린 동안 원본이 바뀌면 겹친 경로가 충돌로 보이고 입력은 지워지지 않는다.** `원본` 칸이 `"서울"`을 말하는데 draft의 `대전`은 그대로 있다',
        expect: {
          cards: { boundary: { draftDirty: 'true', version: '6 / 1' } },
          changes: {
            boundary: [
              {
                path: 'city',
                before: '"제주"',
                after: '"대전"',
                source: '"서울"',
                conflict: 'conflict',
              },
            ],
          },
        },
      },
    ],
  },
  {
    id: 'M2-19-8-closed',
    title:
      '원본 화면을 닫아도 draft 값은 남고, 적용만 missing-source로 거절된다',
    pins: 'M2-19 여덟째 항목 (마지막 문장)',
    steps: [
      { press: 'probe-open' },
      { press: 'probe-load' },
      { press: 'settle-all' },
      { press: 'boundary-branch-probe' },
      { press: 'boundary-edit' },
      {
        note: '입력을 쥔 draft. 충돌은 없다 — 충돌이 있으면 적용이 그쪽을 먼저 답하므로 이 문장이 시험되지 않는다',
        expect: {
          cards: { boundary: { draftDirty: 'true', version: '1 / 0' } },
          changes: {
            boundary: [
              {
                path: 'city',
                after: '"대전"',
                source: '"서울"',
                conflict: '-',
              },
            ],
          },
        },
      },
      { press: 'probe-dispose' },
      {
        note: '원본 화면이 닫혔다. 그 카드는 모든 행이 `(해제됨)`인데 **draft의 값과 dirty는 그대로다** — 입력은 화면의 수명에 매여 있지 않다',
        expect: {
          cards: {
            probe: { probeState: '해제됨', status: '(해제됨)' },
            boundary: { draftDirty: 'true', version: '1 / 0' },
          },
        },
      },
      { press: 'boundary-apply' },
      {
        note: '**거절되는 것은 적용뿐이다.** `missing-source`로 답하고 draft의 입력은 남는다. 변경 줄의 `원본` 칸만 `(없음)`이 된다 — 쓸 곳이 사라졌다는 뜻이고, 쥐고 있던 것이 사라졌다는 뜻이 아니다',
        expect: {
          cards: {
            operations: {
              lastResult: { contains: '적용 거절: missing-source' },
            },
            boundary: { draftDirty: 'true' },
          },
          changes: {
            boundary: [
              {
                path: 'city',
                after: '"대전"',
                source: '(없음)',
                conflict: '-',
              },
            ],
          },
        },
      },
    ],
  },
];

/**
 * M2-20's own two: a second display of one key, and a local edit under it.
 *
 * Everything else M2-20 asks for is already running in all five demos - the
 * table in `docs/server-sync/PHASE8_8.md` names which scenario stands for each
 * column (DC8-8-32). These two are the sentences nothing covered.
 *
 * The second display is a real component with its own connector subscription,
 * and closing its screen is an unmount rather than a `dispose()`. That is the
 * contract DC5-05-03 declared and this is where it is checked in five
 * connectors: an unmount ends that component's subscription and lets go of
 * nothing else (DC8-8-33).
 */
export const M2_20: readonly Scenario[] = [
  {
    id: 'M2-20-live-local',
    title:
      '표시 중인 조회의 로컬 편집이 두 표시에 서고, 화면을 닫아도 view는 남는다',
    pins: 'M2-20 첫째 항목 — 로컬 resource 편집 반영, 그리고 화면 해제와 구독 종료의 구별',
    steps: [
      { press: 'live-activate-a' },
      { press: 'settle-all' },
      { press: 'live-share-open' },
      {
        note:
          '같은 key를 보는 둘째 표시가 열렸다. 소유자가 2가 되고 두 표시가 같은 ' +
          '값을 든다 — 그런데 READ는 늘지 않는다: 둘째 표시는 새 조회가 아니라 ' +
          '같은 캐시 항목의 둘째 소유자다',
        expect: {
          cards: {
            live: { liveKey: 'live/a', liveCity: '서울-a' },
            share: {
              shareState: '열림',
              livePhase: 'success / idle',
              liveCity: '서울-a',
            },
            requests: { counts: '1 / 0' },
          },
          cache: {
            inspect: [
              { key: 'profile', owners: '2' },
              { key: 'profile/readonly', owners: '1' },
              { key: 'live/a', owners: '2', status: 'success / idle' },
            ],
          },
        },
      },
      { press: 'live-edit-local' },
      {
        note:
          '조회의 ref로 로컬 편집을 하면 두 표시가 함께 제주-local을 든다. 어떤 ' +
          'READ도 낼 수 없는 값이므로(DC8-8-34) 이것은 늦은 결과가 아니라 편집이고, ' +
          '표시가 기준의 사본이 아니라 그 resource를 본다는 뜻이다',
        expect: {
          cards: {
            live: { liveCity: '제주-local' },
            share: { shareState: '열림', liveCity: '제주-local' },
            requests: { counts: '1 / 0' },
          },
        },
      },
      { press: 'live-share-close' },
      {
        note:
          '둘째 표시의 화면만 닫았다. 값 행은 (화면 닫힘)이 되지만 **소유자 수는 ' +
          '그대로 2다** — 언마운트는 그 컴포넌트의 커넥터 구독만 끝내고 공유 view는 ' +
          '놓지 않는다 (DC5-05-03)',
        expect: {
          cards: {
            share: {
              shareState: '화면 닫힘 (view 유지)',
              livePhase: '(화면 닫힘)',
              liveCity: '(화면 닫힘)',
            },
            inspect: { cacheSize: '3', cacheOwners: '5' },
          },
          cache: {
            inspect: [
              { key: 'profile', owners: '2' },
              { key: 'profile/readonly', owners: '1' },
              { key: 'live/a', owners: '2' },
            ],
          },
        },
      },
      { press: 'live-share-open' },
      {
        note:
          '다시 열면 닫기 전의 값이 그대로 있고 READ도 늘지 않는다 — 화면이 없는 ' +
          '동안에도 view가 그 자리를 지키고 있었다',
        expect: {
          cards: {
            share: { shareState: '열림', liveCity: '제주-local' },
            requests: { counts: '1 / 0' },
          },
        },
      },
      { press: 'live-share-release' },
      {
        note:
          '이번에는 view를 놓았다. 소유자가 1로 줄고 모든 행이 (해제됨)이다 — 앞 ' +
          '단계의 "2 그대로"가 무엇에 대한 주장이었는지는 이 대비로만 읽힌다 ' +
          '(DC8-8-27)',
        expect: {
          cards: {
            share: {
              shareState: '해제됨',
              livePhase: '(해제됨)',
              liveCity: '(해제됨)',
            },
            inspect: { cacheSize: '3', cacheOwners: '4' },
            live: { liveKey: 'live/a', liveCity: '제주-local' },
          },
          cache: {
            inspect: [
              { key: 'profile', owners: '2' },
              { key: 'profile/readonly', owners: '1' },
              { key: 'live/a', owners: '1' },
            ],
          },
        },
      },
    ],
  },
  {
    id: 'M2-20-live-shared',
    title:
      '둘째 view가 보고 있는 key는 표시가 떠나도 조회가 유지되고 그 view에만 결과가 온다',
    pins: 'M2-20 첫째 항목의 마지막 문장 · M2-11 5항의 남은 문장 (공유 READ 유지)',
    steps: [
      { press: 'live-activate-a' },
      { press: 'live-share-open' },
      {
        note: 'live/a의 READ가 떠 있고 두 표시가 그것을 함께 기다린다',
        expect: {
          cards: {
            live: { liveKey: 'live/a', livePhase: 'pending / fetching' },
            share: { shareState: '열림', livePhase: 'pending / fetching' },
          },
          requests: { 'READ-1': { key: 'live/a', outcome: 'in-flight' } },
          cache: {
            inspect: [
              { key: 'profile', owners: '2' },
              { key: 'profile/readonly', owners: '1' },
              { key: 'live/a', owners: '2' },
            ],
          },
        },
      },
      { press: 'live-key-b' },
      {
        note:
          '표시가 key를 떠났는데도 READ-1은 **in-flight로 남는다** — 마지막 ' +
          '소유자가 아니었기 때문이다. 같은 조작이 `M2-11-4-cancel`에서는 aborted를 ' +
          '냈고, 갈라진 것은 소유자 수 하나뿐이다. live/a는 owners 1로 둘째 view가 든다',
        expect: {
          cards: {
            live: { liveKey: 'live/b', livePhase: 'pending / fetching' },
            share: { shareState: '열림', livePhase: 'pending / fetching' },
          },
          requests: {
            'READ-1': { key: 'live/a', outcome: 'in-flight' },
            'READ-2': { key: 'live/b', outcome: 'in-flight' },
          },
          cache: {
            inspect: [
              { key: 'profile', owners: '2' },
              { key: 'profile/readonly', owners: '1' },
              { key: 'live/a', owners: '1' },
              { key: 'live/b', owners: '1' },
            ],
          },
        },
      },
      { press: 'settle-all' },
      {
        note:
          '두 결과가 각자의 표시로 간다: 떠난 쪽은 서울-b, 남은 쪽은 서울-a다. ' +
          '이전 key의 결과가 새 표시에 들어가지 않으면서도 **그것을 보고 있던 ' +
          'view에서는 확인된다**',
        expect: {
          cards: {
            live: { liveKey: 'live/b', liveCity: '서울-b' },
            share: { shareState: '열림', liveCity: '서울-a' },
          },
          requests: {
            'READ-1': { key: 'live/a', outcome: 'success' },
            'READ-2': { key: 'live/b', outcome: 'success' },
          },
        },
      },
      { press: 'live-dispose' },
      {
        note:
          '따라가는 표시를 해제해도 둘째 표시의 조회와 표시는 그대로다 — 공유 view를 ' +
          '한 화면에서만 놓은 것이고, live/a는 여전히 owners 1이다. 소유자를 잃은 것은 ' +
          '떠난 쪽 key(live/b)뿐이다',
        expect: {
          cards: {
            live: { liveKey: '(해제됨)', liveCity: '(해제됨)' },
            share: { shareState: '열림', liveCity: '서울-a' },
          },
          cache: {
            inspect: [
              { key: 'profile', owners: '2' },
              { key: 'profile/readonly', owners: '1' },
              { key: 'live/a', owners: '1' },
              { key: 'live/b', owners: '0' },
            ],
          },
        },
      },
    ],
  },
];

export const SCENARIOS: readonly Scenario[] = [
  ...M2_05_08,
  ...M2_07,
  ...M2_09,
  ...M2_10,
  ...M2_11,
  ...M2_12,
  ...M2_13,
  ...M2_14,
  ...M2_15,
  ...M2_16,
  ...M2_11_LIVE,
  ...M2_INSPECT,
  ...M2_CLIENTS,
  ...M2_ORDER,
  ...M2_17,
  ...M2_16_REST,
  ...M2_18,
  ...M2_19_REST,
  ...M2_20,
];
