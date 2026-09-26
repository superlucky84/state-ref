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
    const actualRows = reading.changes[card];
    if (!actualRows) {
      out.push(`changes for ${card} are missing`);
      continue;
    }
    if (actualRows.length !== wantRows.length) {
      out.push(
        `${card} changes: expected ${wantRows.length} row(s), got ${
          actualRows.length
        } (${actualRows.map(row => row.path).join(', ') || 'none'})`
      );
      continue;
    }
    for (const [index, want] of wantRows.entries()) {
      for (const [cell, expectedCell] of Object.entries(want)) {
        const got = actualRows[index][cell];
        if (!matches(got, expectedCell)) {
          out.push(
            `${card} changes[${index}]/${cell}: expected ${describe(
              expectedCell
            )}, got ${got === undefined ? '(no such cell)' : got}`
          );
        }
      }
    }
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
 * Every ported checklist item, in checklist order.
 *
 * Declared last on purpose: the lists it spreads have to exist first.
 */
export const SCENARIOS: readonly Scenario[] = [
  ...M2_05_08,
  ...M2_07,
  ...M2_09,
  ...M2_10,
  ...M2_11,
  ...M2_12,
];
