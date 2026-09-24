import { createStore } from 'state-ref';
import { createPage, installNetworkProbe } from './page';

/**
 * core alone (M2-01, first row).
 *
 * Nothing here imports `state-ref/draft`, `state-ref/batch` or
 * `@stateref/sync`, so the recorded module graph for this entry must contain
 * the core dist and nothing else from the library.
 */

const networkCalls = installNetworkProbe();
const page = createPage();

const watch = createStore({ city: '서울', count: 0 });
let notifications = 0;
// A subscription ends by aborting a signal returned from its first run;
// there is no dispose().
const ending = new AbortController();
const ref = watch((state, isFirst) => {
  notifications += 1;
  page.log(
    `구독 알림 ${notifications}회 — ${state.city.value} / ${state.count.value}`
  );
  return isFirst ? ending.signal : undefined;
});
let subscribed = true;

page.row('city', () => ref.city.value);
page.row('count', () => String(ref.count.value));
page.row('구독 알림 수', () => String(notifications));
page.row('구독 상태', () => (subscribed ? '구독 중' : '해제됨'));
page.row('네트워크 호출', () => `${networkCalls()}회`);
page.row(
  'window.stateRefDraft',
  () => typeof (window as { stateRefDraft?: unknown }).stateRefDraft
);
page.row(
  'window.stateRefBatch',
  () => typeof (window as { stateRefBatch?: unknown }).stateRefBatch
);

page.action('도시 → 부산', () => {
  ref.city.value = '부산';
});
page.action('count +1', () => {
  ref.count.value = ref.count.value + 1;
});
page.action('두 경로 연속 쓰기', () => {
  // No batch helper here: each write notifies on its own, which is the
  // default core contract the combined page contrasts with.
  ref.city.value = '대전';
  ref.count.value = ref.count.value + 10;
});
page.action('구독 해제', () => {
  if (!subscribed) {
    page.log('이미 해제했다.');
    return;
  }
  ending.abort();
  subscribed = false;
  page.log('구독을 해제했다. 이후 쓰기에는 알림이 없다.');
});

page.paint();
