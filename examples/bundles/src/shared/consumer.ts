import { h, render } from 'preact';
import { connectPreactView } from '@stateref/connect-preact';
import {
  isProvided,
  isReady,
  pendingShared,
  sharedWatch,
  whenReady,
} from 'state-ref/shared';
import { SUBS, createPanel, demo, sharedClient, todosOptions } from './common';
import type { Subs } from './common';

/**
 * A bundle that uses the `subs` store without owning it (docs/shared-store,
 * M-SH-01 and M-SH-02).
 *
 * Built on its own, with its own copy of state-ref. Everything below is at
 * module level and runs whether or not the provider bundle has loaded.
 */
const panel = createPanel('consumer');

const subsWatch = sharedWatch<Subs>(SUBS);

let stage = '';
let stageRuns = 0;
subsWatch(ref => {
  stageRuns += 1;
  stage = !isProvided(ref)
    ? 'pending'
    : !isReady(ref)
    ? 'loading'
    : `ready:${ref.mySubs.value.length}`;
  panel.repaint();
});

let whenReadyRuns = 0;
whenReady(SUBS, () => {
  whenReadyRuns += 1;
  panel.repaint();
});

// A hook made at module level, before any provider is in sight.
const useSubs = connectPreactView(subsWatch);
function Badge() {
  const subs = useSubs();
  const text = !isProvided(subs)
    ? 'none'
    : !isReady(subs)
    ? 'loading'
    : String(subs.mySubs.value.length);
  // `data-row` is how the e2e harness reads a value off the page.
  const props: Record<string, string> = { 'data-row': 'badge' };
  return h('span', props, text);
}
const badgeRoot = document.getElementById('consumer-badge');
if (badgeRoot) render(h(Badge, null), badgeRoot);

let addResult = '(시도 전)';
let unguarded = '(시도 전)';

panel.action('consumer-add', '소비 쪽에서 구독 추가', () => {
  const ref = subsWatch();
  if (!isProvided(ref)) {
    addResult = '제공 전이라 쓰지 않음';
    return;
  }
  ref.mySubs.value = [...ref.mySubs.value, { id: 99 }];
  addResult = '씀';
});
panel.action('consumer-unguarded', '가드 없이 읽기', () => {
  try {
    const ref = subsWatch() as unknown as { mySubs: { value: unknown[] } };
    unguarded = `읽힘: ${ref.mySubs.value.length}`;
  } catch (error) {
    unguarded = (error as Error).message;
  }
});

panel.row('stage', '소비 쪽 구독이 본 단계', () => stage);
panel.row('stageRuns', '소비 쪽 구독 실행 수', () => String(stageRuns));
panel.row('whenReadyRuns', 'whenReady 실행 수', () => String(whenReadyRuns));
panel.row(
  'pending',
  'pendingShared()',
  () => pendingShared().join(',') || '(없음)'
);
panel.row('addResult', '소비 쪽 쓰기 결과', () => addResult);
panel.row('unguarded', '가드 없는 읽기 결과', () => unguarded);

// The same line as in the provider bundle, and the ordinary sync API after it.
const client = sharedClient('consumer');
const todos = client.query(todosOptions);
const addTodo = client.mutation({
  mutationFn: async (title: string) => {
    demo().writes += 1;
    demo().server.push(title);
    return title;
  },
  onSuccess: () => client.invalidate(['todos']),
});

panel.action('consumer-query-load', '소비 쪽 query load', () => todos.load());
panel.action('consumer-mutate', '소비 쪽 mutation', async () => {
  await addTodo.run('b');
  await todos.refetch();
});
panel.row('consumerTodos', '소비 쪽 todos', () =>
  todos.status.loaded.value ? todos.ref.value.join(',') : '(로드 전)'
);
panel.row('reads', 'READ 횟수', () => String(demo().reads));
panel.row('writes', 'WRITE 횟수', () => String(demo().writes));
panel.row('clients', '클라이언트 개수', () => String(demo().clients.size));
