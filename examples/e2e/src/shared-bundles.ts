import type { BundleRun } from './bundles';

/**
 * `state-ref/shared` between two bundles that were built separately
 * (docs/shared-store/MANUAL_TEST_CHECKLIST.md, M-SH-01 and M-SH-02).
 *
 * `examples/bundles` builds a provider bundle and a consumer bundle as two
 * library-mode builds. Each inlines its own copy of state-ref and of
 * @stateref/sync, and three static pages load them with plain script tags in
 * different orders. The unit tests could only imitate this by evaluating one
 * UMD build twice in jsdom; here the two copies come out of a real bundler and
 * run in real Chromium.
 *
 * Every string below was measured from the page first and copied out of the
 * reading, never written from what the value ought to be.
 */
const page = (name: string) => ({
  name: `shared/${name}`,
  path: `/shared/${name}.html`,
});

const NOT_PROVIDED =
  'state-ref/shared: "demo.subs" is not provided yet, so it has no "mySubs". Check isProvided(ref) or isReady(ref) before reading it.';

export const SHARED_RUNS: readonly BundleRun[] = [
  {
    ...page('provider-first'),
    steps: [
      {
        note: '제공 번들이 먼저 로드됐다. 소비 번들의 구독은 첫 실행부터 스토어를 보고(실행 1회), 데이터는 아직이라 loading이다. sync 클라이언트는 먼저 실행된 제공 번들이 만들었고 하나뿐이다 (M-SH-01)',
        expect: {
          stage: 'loading',
          stageRuns: '1',
          badge: 'loading',
          whenReadyRuns: '0',
          pending: '(없음)',
          providerNotices: '1',
          clientMakers: 'provider',
          clients: '1',
        },
      },
      { press: 'provider-load' },
      {
        note: '제공 번들이 데이터를 채우고 준비 신호를 올리면, 다른 사본의 소비 번들 구독과 Preact 컴포넌트가 스스로 다시 실행된다. loading 단계의 구독은 준비 조건만 읽었으므로 mySubs 쓰기에는 깨지 않고 한 번만 더 실행된다 (1 → 2). whenReady는 1회 (M-SH-01 둘째, M-SH-02 첫째)',
        expect: {
          stage: 'ready:2',
          stageRuns: '2',
          badge: '2',
          whenReadyRuns: '1',
          providerCount: '2',
          providerNotices: '3',
        },
      },
      { press: 'consumer-add' },
      {
        note: '소비 번들이 가드 뒤에 쓰면 제공 번들의 스토어가 바뀌고 제공 번들의 구독이 실행된다 (3 → 4) (M-SH-01 셋째)',
        expect: {
          addResult: '씀',
          providerCount: '3',
          providerNotices: '4',
          stage: 'ready:3',
          badge: '3',
        },
      },
      { press: 'provider-unload' },
      {
        note: '준비 신호가 내려가면 isReady 구독과 컴포넌트는 loading으로 돌아간다',
        expect: { stage: 'loading', badge: 'loading', whenReadyRuns: '1' },
      },
      { press: 'provider-load' },
      {
        note: '다시 준비되면 isReady 구독은 다시 실행되고 whenReady는 다시 실행되지 않는다 — 1에 머문다 (M-SH-02 둘째)',
        expect: { stage: 'ready:2', badge: '2', whenReadyRuns: '1' },
      },
      { press: 'provider-again' },
      {
        note: '같은 이름으로 다른 스토어를 제공하면 첫 등록이 유지된다. 이때 console.warn이 한 번 찍히는데, 이 runner는 error만 실패로 본다 (M-SH-02 다섯째)',
        expect: { duplicate: '첫 등록 유지', stage: 'ready:2' },
      },
      { press: 'consumer-unguarded' },
      {
        note: '제공된 뒤에는 가드 없이 읽어도 값이 나온다 — 가드는 제공 전을 막는 장치다',
        expect: { unguarded: '읽힘: 2' },
      },
      { press: 'provider-query-load' },
      {
        note: '제공 번들이 query를 load하면 소비 번들의 같은 key query도 로드된 것으로 보인다 — 두 사본이 ensureShared로 얻은 클라이언트가 하나이고 캐시가 하나다. READ 1회',
        expect: { providerTodos: 'a', consumerTodos: 'a', reads: '1' },
      },
      { press: 'consumer-query-load' },
      {
        note: '이미 로드된 key를 나중에 다시 load하면 READ가 한 번 더 나간다 (1 → 2). "같은 key는 한 번만 읽는다"는 동시에 겹친 load에 대한 말이고 그것은 단위 테스트가 확인한다',
        expect: { reads: '2' },
      },
      { press: 'consumer-mutate' },
      {
        note: '소비 번들이 평소의 sync API로 mutation을 실행하고 재조회하면, 아무것도 하지 않은 제공 번들의 query가 새 값을 본다. WRITE 1회',
        expect: {
          consumerTodos: 'a,b',
          providerTodos: 'a,b',
          writes: '1',
          reads: '3',
          clients: '1',
        },
      },
    ],
  },
  {
    ...page('consumer-first'),
    steps: [
      {
        note: '소비 번들이 먼저 로드됐다. 구독은 제공 전에 한 번, 스토어가 도착할 때 한 번 실행됐다 (실행 2회). 클라이언트는 이번에는 소비 번들이 만들었고 여전히 하나다 (M-SH-01 첫째)',
        expect: {
          stage: 'loading',
          stageRuns: '2',
          badge: 'loading',
          whenReadyRuns: '0',
          pending: '(없음)',
          providerNotices: '1',
          clientMakers: 'consumer',
          clients: '1',
        },
      },
      { press: 'provider-load' },
      {
        note: '로드 순서가 반대여도 결과는 같다',
        expect: {
          stage: 'ready:2',
          badge: '2',
          whenReadyRuns: '1',
          providerCount: '2',
        },
      },
      { press: 'consumer-add' },
      {
        note: '소비 번들의 쓰기가 제공 번들에 도달한다',
        expect: {
          addResult: '씀',
          providerCount: '3',
          providerNotices: '4',
          badge: '3',
        },
      },
      { press: 'consumer-query-load' },
      {
        note: '이번에는 소비 번들이 먼저 load한다. 제공 번들의 query가 같은 캐시 항목을 본다',
        expect: { consumerTodos: 'a', providerTodos: 'a', reads: '1' },
      },
      { press: 'consumer-mutate' },
      {
        note: 'mutation과 재조회가 양쪽에 반영된다',
        expect: {
          consumerTodos: 'a,b',
          providerTodos: 'a,b',
          writes: '1',
          clients: '1',
        },
      },
    ],
  },
  {
    ...page('late-provider'),
    steps: [
      {
        note: '제공 번들이 페이지에 없다. 페이지는 예외 없이 뜨고, 구독은 pending으로 한 번 실행됐고, pendingShared()가 기다리는 이름을 보여 준다 (M-SH-02 셋째)',
        expect: {
          stage: 'pending',
          stageRuns: '1',
          badge: 'none',
          whenReadyRuns: '0',
          pending: 'demo.subs',
          clients: '1',
        },
      },
      { press: 'consumer-unguarded' },
      {
        note: '가드 없이 제공 전 ref의 경로를 읽으면 가드 이름이 적힌 오류가 난다 (M-SH-02 넷째)',
        expect: { unguarded: NOT_PROVIDED },
      },
      { press: 'consumer-add' },
      {
        note: 'isProvided 가드가 제공 전의 쓰기를 막는다',
        expect: { addResult: '제공 전이라 쓰지 않음', stage: 'pending' },
      },
      { press: 'consumer-query-load' },
      {
        note: 'ensureShared로 얻은 클라이언트는 제공 번들 없이도 바로 쓸 수 있다 — 주인이 필요 없는 값이다',
        expect: { consumerTodos: 'a', reads: '1' },
      },
      { press: 'load-provider-bundle' },
      {
        note: '제공 번들을 나중에 로드하면 구독과 컴포넌트가 스스로 다음 단계로 넘어간다 (실행 1 → 2). 대기 이름이 사라진다. 제공 번들의 query는 load하지 않았는데도 소비 번들이 채운 캐시를 본다 — 나중에 온 사본이 먼저 온 사본의 클라이언트를 받았다',
        expect: {
          stage: 'loading',
          stageRuns: '2',
          badge: 'loading',
          pending: '(없음)',
          providerTodos: 'a',
          clientMakers: 'consumer',
          clients: '1',
          reads: '1',
        },
      },
      { press: 'provider-load' },
      {
        note: '늦게 온 제공 번들이 데이터를 채우면 준비 단계가 된다. whenReady가 그제야 한 번 실행된다',
        expect: { stage: 'ready:2', badge: '2', whenReadyRuns: '1' },
      },
      { press: 'consumer-add' },
      {
        note: '이제는 같은 버튼이 쓴다',
        expect: { addResult: '씀', providerCount: '3', badge: '3' },
      },
      { press: 'consumer-mutate' },
      {
        note: '소비 번들의 mutation이 제공 번들의 query에 반영된다',
        expect: { consumerTodos: 'a,b', providerTodos: 'a,b', writes: '1' },
      },
    ],
  },
];
