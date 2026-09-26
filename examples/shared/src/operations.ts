/**
 * The buttons every demo must offer, in display order.
 *
 * All five demos import this list, so the operation sets cannot drift apart
 * (step 4 of docs/server-sync/PHASE8_5.md). When Phase 8.7 compares the five
 * screens by hand, a difference has to come from the connector rather than
 * from one demo having grown a control the others lack.
 */
export const OPERATION_GROUPS = [
  {
    id: 'server',
    title: '서버와 요청',
    operations: [
      ['settle-read', '진행 중 READ 완료'],
      ['settle-write', '진행 중 WRITE 완료'],
      ['settle-all', '가능한 요청 모두 완료'],
      ['next-read-error', '다음 READ 실패 예약 (재시도에 흡수됨)'],
      ['next-read-error-exhausted', '다음 READ 연속 실패 (재시도 소진)'],
      ['next-read-ignore-signal', '다음 READ는 signal을 무시함 (늦게 완료)'],
      ['next-write-rejected', '다음 WRITE 확정 거절 예약'],
      ['next-write-unknown', '다음 WRITE 응답 없음 예약 (계속 진행 중)'],
      ['next-write-transport-failure', '다음 WRITE 전송 실패 예약 (결과 불명)'],
      ['next-write-sync-error', '다음 WRITE 성공 + 복구 READ 실패 예약'],
      ['next-write-corrected', '다음 WRITE 서버 보정 예약'],
      ['server-edit-memo', '서버가 무관한 필드를 바꿈'],
    ],
  },
  {
    id: 'query',
    title: '조회',
    operations: [
      ['load', '최초 조회'],
      ['refetch', '재조회'],
      ['invalidate', '무효화(진행 READ 취소)'],
      ['accept-server', '알려진 서버 값 수용'],
    ],
  },
  {
    id: 'resource',
    title: '공유 resource 편집',
    operations: [
      ['edit-busan', `도시 → 부산`],
      ['edit-seoul', `도시 → 서울 (서버 값으로 되돌림)`],
      ['edit-memo', '무관한 필드 변경'],
      ['edit-gwangju', `도시 → 광주 (draft와 겹침)`],
      ['reorder-contacts', '연락처 배열 재정렬'],
      ['remove-office', '사무실(부모) 제거'],
      ['readonly-write', 'readonly 조회에 쓰기 시도'],
    ],
  },
  {
    id: 'draft',
    title: '독립 draft',
    operations: [
      ['branch-drafts', '현재 원본에서 draft 2개 분기'],
      ['draft-a-daejeon', `draft A 도시 → 대전`],
      ['draft-b-daejeon', `draft B 도시 → 대전`],
      ['draft-a-apply', 'draft A 로컬 적용'],
      ['draft-b-apply', 'draft B 로컬 적용'],
      ['draft-a-reset', 'draft A 초기화'],
      ['draft-a-discard', 'draft A 폐기'],
      ['draft-a-resolve-source', 'draft A 충돌 → 원본 선택'],
      ['draft-a-resolve-draft', 'draft A 충돌 → draft 선택'],
    ],
  },
  {
    id: 'mutation',
    title: '서버 저장',
    operations: [
      ['capture', '제출할 변경 고정'],
      ['save', '저장 실행 (제출값 수용)'],
      ['save-with-response', '저장 실행 (응답 매핑 수용)'],
      ['save-with-refetch', '저장 실행 (사후 재조회 수용)'],
      ['save-reject-remove', '저장 실행 (거절 시 제출 입력 되돌림)'],
      ['edit-after-capture', '제출 뒤 추가 입력'],
    ],
  },
  {
    id: 'environment',
    title: '자동 조회 환경',
    operations: [
      ['focus', 'focus 사건'],
      ['reconnect', 'reconnect 사건'],
      ['go-offline', '오프라인으로'],
      ['go-online', '온라인으로'],
    ],
  },
  {
    id: 'computed',
    title: '콜백 없는 computed',
    operations: [
      ['computed-read', '다시 읽기'],
      ['computed-bump-dep', '의존 값 변경'],
      ['computed-bump-unrelated', '무관한 값 변경'],
      ['computed-sync', '수동 sync()'],
    ],
  },
] as const;

export type OperationGroupId = (typeof OPERATION_GROUPS)[number]['id'];

export type OperationId =
  (typeof OPERATION_GROUPS)[number]['operations'][number][0];

export const OPERATION_IDS: readonly OperationId[] = OPERATION_GROUPS.flatMap(
  group => group.operations.map(([id]) => id)
);

/**
 * The label a demo shows for an operation.
 *
 * A result that has to name a button reads it from here rather than repeating
 * the text: a renamed button would otherwise leave an instruction on screen
 * that points at a control nobody can find.
 */
export function operationLabel(id: OperationId): string {
  for (const group of OPERATION_GROUPS) {
    for (const [operationId, label] of group.operations) {
      if (operationId === id) return label;
    }
  }
  throw new RangeError(`Unknown operation id: ${String(id)}`);
}
