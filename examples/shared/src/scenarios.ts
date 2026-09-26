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

/** Every ported checklist item, in checklist order. */
export const SCENARIOS: readonly Scenario[] = [...M2_10, ...M2_11];
