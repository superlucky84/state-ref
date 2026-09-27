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
      ['swap-room-type', '방 번호를 배열로 교체 (타입 교체)'],
      ['readonly-write', 'readonly 조회에 쓰기 시도'],
      ['readonly-capture', 'readonly 조회에서 제출 고정 시도'],
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
      ['draft-a-write-after-discard', '폐기한 draft A에 쓰기 시도'],
      ['draft-a-resolve-source', 'draft A 충돌 → 원본 선택'],
      ['draft-a-resolve-draft', 'draft A 충돌 → draft 선택'],
      ['draft-a-rename-contact', 'draft A 연락처 1 이름 변경'],
      ['draft-a-hold-change', 'draft A의 검토 항목 하나를 손에 든다'],
      ['draft-a-resolve-held', '손에 든 항목으로 draft A 해소 시도'],
      ['draft-a-resolve-other-owner', 'draft B의 항목으로 draft A 해소 시도'],
    ],
  },
  {
    id: 'live',
    title: '따라가는 표시 (liveView)',
    operations: [
      ['live-activate-a', 'key live/a로 활성화'],
      ['live-key-b', 'key를 live/b로 전환'],
      ['live-deactivate', '표시 비활성화'],
      ['live-dispose', '표시 해제'],
      ['live-edit-local', '표시 중인 조회를 로컬 편집'],
      ['live-share-open', '같은 key를 보는 둘째 표시 열기'],
      ['live-share-close', '둘째 표시를 화면에서만 닫기'],
      ['live-share-release', '둘째 표시의 view 해제'],
    ],
  },
  {
    id: 'mutation',
    title: '서버 저장',
    operations: [
      ['capture', '제출할 변경 고정'],
      ['capture-unknown-id', '없는 변경 ID로 제출 고정 시도'],
      ['save', '저장 실행 (제출값 수용)'],
      ['save-with-response', '저장 실행 (응답 매핑 수용)'],
      ['save-with-refetch', '저장 실행 (사후 재조회 수용)'],
      ['save-reject-remove', '저장 실행 (거절 시 제출 입력 되돌림)'],
      ['edit-after-capture', '제출 뒤 추가 입력'],
      ['command-run', '독립 명령 실행 (순서 지정 없음)'],
      ['command-scoped', '독립 명령 실행 (scope 지정, 순서 보장)'],
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
    id: 'inspect',
    title: '관측 구독',
    operations: [
      ['inspect-unsubscribe', '관측 구독 해제'],
      ['inspect-resubscribe', '관측 구독 재개'],
      ['cache-remove-live-a', 'live/a 캐시 항목 제거 시도'],
      ['probe-open', '둘째 client 열기 (같은 key)'],
      ['probe-load', '둘째 client 조회'],
      ['probe-edit', '둘째 client에서 도시 → 제주'],
      ['probe-edit-seoul', '둘째 client에서 도시 → 서울'],
      ['probe-dispose', '둘째 client 해제'],
    ],
  },
  {
    id: 'boundary',
    title: '경계와 데이터 규칙',
    operations: [
      ['boundary-branch-room', '원본 office.room에서 draft 분기 (child ref)'],
      ['boundary-branch-readonly', 'readonly 조회에서 draft 분기'],
      ['boundary-branch-probe', '둘째 client 조회에서 draft 분기'],
      ['boundary-edit', '경계 draft 값 변경'],
      ['boundary-apply', '경계 draft 로컬 적용'],
      ['draft-a-reserved-key', 'draft A에 예약 키 쓰기'],
      ['draft-a-unsupported-value', 'draft A에 미지원 값 쓰기'],
      ['draft-a-mutate-snapshot', 'draft A가 읽은 값 직접 변형'],
      ['resource-reserved-key', '원본에 예약 키 쓰기'],
      ['resource-unsupported-value', '원본에 미지원 값 쓰기'],
      ['resource-mutate-snapshot', '원본이 읽은 값 직접 변형'],
    ],
  },
  {
    id: 'lifetime',
    title: '수명과 정리',
    operations: [
      ['draft-cycle-20', 'draft 생성·종료 20회 반복'],
      ['draft-keep-two', 'draft 2개를 살려 둔다'],
      ['draft-release-kept', '살려 둔 draft를 모두 종료'],
      ['cache-remove-profile', 'profile 캐시 항목 제거 시도'],
      ['hold-probe-ref', '둘째 client의 ref를 손에 든다'],
      ['read-held-ref', '손에 든 ref로 읽기'],
      ['serverless-edit', '서버 없는 draft 편집'],
      ['serverless-apply', '서버 없는 draft 적용'],
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
