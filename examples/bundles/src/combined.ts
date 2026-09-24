import { createStore } from 'state-ref';
import { batch } from 'state-ref/batch';
import { createDraft } from 'state-ref/draft';
import type { Draft } from 'state-ref/draft';
import { createSyncClient } from '@stateref/sync';
import type { QueryHandle } from '@stateref/sync';
import { createPage, installNetworkProbe } from './page';

/**
 * Everything at once (M2-01, "전체 조합 페이지").
 *
 * The point is that the APIs keep the same meaning side by side: a draft
 * branched off a *resource* ref still applies locally without a WRITE, and
 * `batch` still coalesces notifications for plain core writes only.
 */

type Profile = { city: string; zip: string; memo: string };

const networkCalls = installNetworkProbe();
const page = createPage();

let stored: Profile = { city: '서울', zip: '04524', memo: '원본 메모' };
let reads = 0;

const client = createSyncClient();
const query: QueryHandle<Profile> = client.query<Profile>({
  queryKey: ['profile'],
  queryFn: () => {
    reads += 1;
    return Promise.resolve({ ...stored });
  },
});
let draft: Draft<Profile> | null = null;

// A plain core store next to the resource, so the batch contract is visible
// without involving sync.
const watch = createStore({ a: 0, b: 0 });
let notifications = 0;
const plain = watch(state => {
  notifications += 1;
  page.log(
    `core 구독 알림 ${notifications}회 — a=${state.a.value} b=${state.b.value}`
  );
});

query.watchStatus(() => {
  page.paint();
});

page.row('status.loaded', () => String(query.status.loaded.value));
page.row('resource city', () => query.ref.city.value);
page.row('resource dirty', () => String(query.status.dirty.value));
page.row('draft city', () => (draft ? draft.ref.city.value : '(draft 없음)'));
page.row('draft changes', () => (draft ? String(draft.changes().length) : '-'));
page.row('core a / b', () => `${plain.a.value} / ${plain.b.value}`);
page.row('core 알림 수', () => String(notifications));
page.row('READ 횟수', () => String(reads));
page.row('네트워크 호출', () => `${networkCalls()}회`);

page.action('조회 (load)', () => {
  void query
    .load()
    .then(() => page.log('조회를 마쳤다.'))
    .catch(error => page.log(`조회 실패: ${String(error)}`));
});
page.action('resource 도시 → 부산', () => {
  query.ref.city.value = '부산';
  page.log('resource를 편집했다. WRITE는 없다.');
});
page.action('resource에서 draft 분기', () => {
  draft?.discard();
  draft = createDraft(query.ref);
  page.log('원본이 dirty여도 draft는 clean에서 시작한다.');
});
page.action('draft 도시 → 대전', () => {
  if (!draft) {
    page.log('먼저 draft를 분기한다.');
    return;
  }
  draft.ref.city.value = '대전';
  page.log('draft만 바꿨다.');
});
page.action('draft apply', () => {
  if (!draft) {
    page.log('먼저 draft를 분기한다.');
    return;
  }
  const result = draft.apply();
  page.log(
    result.ok
      ? `resource에 로컬 적용 ${result.applied}건. 네트워크 WRITE는 없다.`
      : `적용 거절: ${result.reason}`
  );
});
page.action('batch로 두 경로 쓰기', () => {
  batch(() => {
    plain.a.value = plain.a.value + 1;
    plain.b.value = plain.b.value + 10;
  });
  page.log('가장 바깥 batch가 끝날 때 구독당 알림 1회다.');
});
page.action('batch 없이 두 경로 쓰기', () => {
  plain.a.value = plain.a.value + 1;
  plain.b.value = plain.b.value + 10;
  page.log('기본 계약대로 쓰기마다 동기 알림이다.');
});

page.paint();
