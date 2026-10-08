import { createStore } from 'state-ref';
import { provideShared } from 'state-ref/shared';
import { SUBS, createPanel, demo, sharedClient, todosOptions } from './common';
import type { Subs } from './common';

/**
 * The bundle that owns the `subs` store (docs/shared-store, M-SH-01).
 *
 * It is built on its own, so it carries its own copy of state-ref. It makes
 * the store, says when its data can be used, and is the only bundle that
 * fills it.
 */
const panel = createPanel('provider');

const subsWatch = createStore<Subs>({ loaded: false, mySubs: [] });
provideShared(SUBS, subsWatch, { ready: ref => ref.loaded.value });

let notices = 0;
const subs = subsWatch(ref => {
  void ref.mySubs.value;
  void ref.loaded.value;
  notices += 1;
  panel.repaint();
});

let duplicate = '(시도 전)';

panel.action('provider-load', '구독 정보 로딩 완료', () => {
  subs.mySubs.value = [{ id: 1 }, { id: 2 }];
  subs.loaded.value = true;
});
panel.action('provider-unload', '준비 신호 내리기', () => {
  subs.loaded.value = false;
});
panel.action('provider-again', '같은 이름으로 다시 제공', () => {
  const returned = provideShared(
    SUBS,
    createStore<Subs>({ loaded: true, mySubs: [] })
  );
  duplicate = returned === subsWatch ? '첫 등록 유지' : '교체됨';
});

panel.row('providerCount', '제공 쪽 mySubs 수', () =>
  String(subs.mySubs.value.length)
);
panel.row('providerNotices', '제공 쪽 구독 알림 수', () => String(notices));
panel.row('duplicate', '중복 제공 결과', () => duplicate);

// A sync client nobody owns: the same line as in the consumer bundle.
const client = sharedClient('provider');
const todos = client.query(todosOptions);

panel.action('provider-query-load', '제공 쪽 query load', () => todos.load());
panel.row('providerTodos', '제공 쪽 todos', () =>
  todos.status.loaded.value ? todos.ref.value.join(',') : '(로드 전)'
);
panel.row('clientMakers', '클라이언트를 만든 번들', () =>
  demo().clientMakers.join(',')
);
