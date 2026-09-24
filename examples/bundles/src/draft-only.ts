import { createStore } from 'state-ref';
import { createDraft } from 'state-ref/draft';
import type { Draft } from 'state-ref/draft';
import { createPage, installNetworkProbe } from './page';

/**
 * core + draft, with no server engine (M2-01, "core+draft 페이지").
 *
 * `apply()` is a synchronous local write to the source. It is not a WRITE,
 * and the network counter on screen is the visible form of that: it stays at
 * zero through create, edit, review, apply and reset.
 */

type Profile = { city: string; zip: string; memo: string };

const networkCalls = installNetworkProbe();
const page = createPage();

const watch = createStore<Profile>({
  city: '서울',
  zip: '04524',
  memo: '원본 메모',
});
const source = watch();
let draft: Draft<Profile> | null = createDraft(source);
let generation = 1;

const describeChanges = () => {
  if (!draft) {
    return '(draft 없음)';
  }
  const changes = draft.changes();
  if (changes.length === 0) {
    return '0건';
  }
  return changes
    .map(
      change =>
        `${change.path.join('.')}: ${String(change.before.value)} → ` +
        `${String(change.after.value)}${change.conflict ? ' (충돌)' : ''}`
    )
    .join(' / ');
};

page.row('원본 city', () => source.city.value);
page.row('원본 memo', () => source.memo.value);
page.row('draft city', () => (draft ? draft.ref.city.value : '(draft 없음)'));
page.row('draft dirty', () =>
  draft ? String(draft.status.dirty.value) : '(draft 없음)'
);
page.row('draft conflicts', () =>
  draft ? String(draft.status.conflicts.value) : '(draft 없음)'
);
page.row('changes', describeChanges);
page.row('draft 세대', () => String(generation));
page.row('네트워크 호출', () => `${networkCalls()}회`);

page.action('draft 도시 → 대전', () => {
  if (!draft) {
    page.log('먼저 draft를 다시 만든다.');
    return;
  }
  draft.ref.city.value = '대전';
  page.log('draft만 바꿨다. 원본은 그대로다.');
});
page.action('원본 도시 → 부산', () => {
  source.city.value = '부산';
  page.log('원본을 바꿨다. draft가 같은 경로를 쥐고 있으면 충돌이 된다.');
});
page.action('원본 memo 변경', () => {
  source.memo.value = `메모 ${generation}-${Date.now() % 1000}`;
  page.log('draft와 겹치지 않는 필드다. 충돌이 되지 않는다.');
});
page.action('apply (로컬 적용)', () => {
  if (!draft) {
    page.log('먼저 draft를 다시 만든다.');
    return;
  }
  const result = draft.apply();
  page.log(
    result.ok
      ? `로컬 적용 ${result.applied}건. 네트워크 WRITE는 없다.`
      : `적용 거절: ${result.reason}`
  );
});
page.action('reset (입력만 지움)', () => {
  if (!draft) {
    page.log('먼저 draft를 다시 만든다.');
    return;
  }
  draft.reset();
  page.log('draft 입력만 지웠다. 원본은 그대로다.');
});
page.action('discard', () => {
  if (!draft) {
    page.log('이미 폐기했다.');
    return;
  }
  draft.discard();
  draft = null;
  page.log('draft를 폐기했다. 원본은 살아 있다.');
});
page.action('draft 다시 만들기', () => {
  draft?.discard();
  draft = createDraft(source);
  generation += 1;
  page.log('원본이 어떤 상태든 draft는 clean에서 시작한다.');
});

page.paint();
