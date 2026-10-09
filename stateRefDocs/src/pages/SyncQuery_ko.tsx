import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncQueryKo = mount(() => {
  return () => (
    <div>
      <h1>query와 resource</h1>

      <p>
        조회 핸들은 두 가지를 동시에 듭니다. 마지막 READ가 확인한{' '}
        <strong>서버 기준</strong>과, 그 위에 올린 <strong>로컬 편집</strong>
        입니다. 이 둘을 갈라 두는 것이 저장되지 않은 필드와 낡은 필드를 구별하게
        해 줍니다.
      </p>

      <h2>컴포넌트의 조회</h2>
      <p>
        컴포넌트 코드에서는 조회를 컴포넌트가 소유하게 하세요. 커넥터마다 ESM
        전용 <code>/sync</code> 진입점이 있고 <code>@stateref/sync</code> 0.3
        이상이 필요합니다. 렌더는 아무것도 만들지 않습니다. 첫 구독이 조회를
        붙입니다(React·Preact·Lithent는 마운트, Vue·Solid·Svelte는 첫 선택).
        그때 조회를 열고, stale이면 불러오며, 그 key로 이미 진행 중인 READ는
        공유합니다. key는 옵션을 따라가고, 언마운트하면 핸들을 놓습니다.
      </p>
      <p>아래 예제는 client 하나와 옵션 helper를 함께 씁니다.</p>
      <CodeBlock
        language="typescript"
        code={`import { createSyncClient } from '@stateref/sync';
import type { ObserveOptions } from '@stateref/sync';

type Account = { name: string; city: string };
export const client = createSyncClient(); // 브라우저 앱당 하나

export const accountOptions = (id: number): ObserveOptions<Account> => ({
  queryKey: ['account', id],
  queryFn: ({ signal }) => api.readAccount(id, { signal }),
  staleTime: 30_000,
});`}
      />

      <h3>React와 Preact</h3>
      <p>
        렌더마다 일반 옵션 객체를 넘기세요. 그 안에서 props를 읽어도 됩니다.
        값은 <code>.value</code>로 읽고, 컴포넌트는 읽은 경로가 바뀔 때만 다시
        렌더합니다. <a href="#/ko/guide/react">React</a>와{' '}
        <a href="#/ko/guide/preact">Preact</a> 안내를 보세요.
      </p>
      <CodeBlock
        language="tsx"
        code={`import { useSyncQuery } from '@stateref/connect-react/sync';
// Preact: import { useSyncQuery } from '@stateref/connect-preact/sync';

function AccountCard({ id }: { id: number }) {
  const [account, q] = useSyncQuery(client, accountOptions(id));
  if (account.status.value === 'pending') return <p>Loading…</p>;
  return (
    <p>
      {account.data.name.value}
      <button onClick={() => q.invalidate()}>Reload</button>
    </p>
  );
}`}
      />

      <h3>Vue</h3>
      <p>
        props나 ref를 따라가려면 getter를 넘기세요. 일반 객체는 컴포넌트 수명
        동안 고정되고, 그 안의 ref는 풀지 않습니다. <code>.value</code>는 getter
        안에서 읽으세요. <code>account(select)</code>는 읽기 전용 Vue ref를
        반환합니다. <a href="#/ko/guide/vue">Vue 안내</a>를 보세요.
      </p>
      <CodeBlock
        language="vue"
        code={`<script setup lang="ts">
import { useSyncQuery } from '@stateref/connect-vue/sync';

const props = defineProps<{ id: number }>();
const [account, q] = useSyncQuery(client, () => accountOptions(props.id));
const status = account(ref => ref.status.value); // Readonly<Ref<...>>
const name = account(ref => ref.data.name.value);
</script>

<template>
  <p v-if="status === 'pending'">Loading…</p>
  <p v-else>{{ name }} <button @click="q.invalidate()">Reload</button></p>
</template>`}
      />

      <h3>Solid</h3>
      <p>
        props나 signal을 따라가려면 accessor를 넘기세요. 일반 객체는 고정됩니다.{' '}
        <code>account(select)</code>는 <code>Accessor</code>를 반환합니다.{' '}
        <a href="#/ko/guide/solid">Solid 안내</a>를 보세요.
      </p>
      <CodeBlock
        language="tsx"
        code={`import { Show } from 'solid-js';
import { createSyncQuery } from '@stateref/connect-solid/sync';

function AccountCard(props: { id: number }) {
  const [account, q] = createSyncQuery(client, () => accountOptions(props.id));
  const status = account(ref => ref.status.value); // Accessor<...>
  const name = account(ref => ref.data.name.value);
  return (
    <Show when={status() !== 'pending'} fallback={<p>Loading…</p>}>
      <p>
        {name()} <button onClick={() => q.invalidate()}>Reload</button>
      </p>
    </Show>
  );
}`}
      />

      <h3>Svelte</h3>
      <p>
        조회는 store API(Svelte 4·5)로 씁니다. 조회용 runes 진입점은 없습니다.{' '}
        <code>createSyncQuery</code>와 그 선택은 컴포넌트 초기화 중에
        호출하세요. 옵션은 일반 객체(고정)나 <code>Readable</code> 옵션
        store입니다. 일반 getter는 추적하지 않습니다.{' '}
        <code>account(select)</code>는 <code>Readable</code>을 반환합니다.{' '}
        <a href="#/ko/guide/svelte">Svelte 안내</a>를 보세요.
      </p>
      <CodeBlock
        language="html"
        code={`<script lang="ts">
  import { writable } from 'svelte/store';
  import { createSyncQuery } from '@stateref/connect-svelte/sync';

  export let id: number;
  const options = writable(accountOptions(id));
  $: options.set(accountOptions(id));

  const [account, q] = createSyncQuery(client, options);
  const status = account(ref => ref.status.value); // Readable<...>
  const name = account(ref => ref.data.name.value);
</script>

{#if $status === 'pending'}
  <p>Loading…</p>
{:else}
  <p>{$name} <button on:click={() => q.invalidate()}>Reload</button></p>
{/if}`}
      />

      <h3>Lithent</h3>
      <p>
        mounter에서 한 번 만드세요. props getter는 props를 따라가고 일반 객체는
        고정됩니다. 렌더에서 <code>account()</code>를 읽습니다.{' '}
        <a href="#/ko/guide/lithent">Lithent 안내</a>에는 편집·mutation
        links·SSR·선택적 concurrent 코어 사용도 있습니다.
      </p>
      <CodeBlock
        language="typescript"
        code={`import { h, mount } from 'lithent';
import { createSyncQuery } from '@stateref/connect-lithent/sync';

export const AccountCard = mount<{ id: number }>((_renew, props) => {
  const [account, q] = createSyncQuery(client, () => accountOptions(props.id));
  return () =>
    account().status.value === 'pending'
      ? h('p', {}, 'Loading…')
      : h('p', {}, account().data.name.value ?? '',
          h('button', { onClick: () => q.invalidate() }, 'Reload'));
});`}
      />

      <h3>표시 상태와 q</h3>
      <p>
        모든 진입점은 <a href="#/ko/guide/sync-view">표시와 반응형 key</a>의
        읽기 전용 표시 상태를 읽습니다. <code>status</code>,{' '}
        <code>fetchStatus</code>, <code>loaded</code>, <code>error</code>,{' '}
        <code>errorSource</code>, <code>data</code>, <code>dirty</code>,{' '}
        <code>queryKey</code>, <code>enabled</code>와 나머지 status 필드입니다.{' '}
        <code>q</code>는 컴포넌트 수명 동안 같은 객체입니다.
      </p>
      <ul>
        <li>
          <code>q.refetch()</code>는 강제로 READ하고 Promise를 반환합니다.
          조회가 붙기 전, 비활성 상태, 서버에서는{' '}
          <code>This query observer is not attached.</code>로 거부합니다.
        </li>
        <li>
          <code>q.invalidate()</code>는 key를 무효화하고, 붙어 있고 활성 상태면
          다시 읽습니다. <code>client.invalidate(key)</code>는 stale 표시만
          합니다.
        </li>
        <li>
          <code>q.handle()</code>은 조회 자신의 핸들을 반환하고, 붙기 전·비활성
          상태·서버에서는 <code>null</code>을 반환합니다.{' '}
          <code>handle.status.value.loaded</code>가 true가 된 뒤{' '}
          <code>handle.ref</code>로 편집하고, mutation <code>links</code>에도 이
          핸들을 넘기세요. dispose하지 마세요. 핸들은 훅이 소유합니다.
        </li>
      </ul>

      <h3>알아 둘 점</h3>
      <ul>
        <li>
          <strong>로딩 UI.</strong> <code>status === &apos;pending&apos;</code>
          으로 판단하세요. 첫 렌더는 캐시를 그대로 보여 주므로 곧 READ가
          시작되더라도 <code>fetchStatus</code>가 <code>&apos;idle&apos;</code>
          일 수 있습니다. 덕분에 서버 렌더와 첫 클라이언트 렌더가 일치합니다.
        </li>
        <li>
          <strong>key 변경.</strong> 새 key는 첫 렌더부터 보입니다(캐시된
          데이터나 pending). 이전 key의 데이터는 보이지 않고, 이전 key에 늦게
          도착한 응답도 보이지 않습니다.
        </li>
        <li>
          <strong>의존 조회.</strong> key에는 <code>undefined</code>를 넣을 수
          없으니{' '}
          <code>{"queryKey: ['user', id ?? null], enabled: id != null"}</code>
          처럼 쓰세요. 잘못된 key(<code>undefined</code>나 <code>.value</code>{' '}
          대신 state-ref ref를 담은 key)나 boolean이 아닌 <code>enabled</code>는
          렌더에서 던지지 않고 <code>status: &apos;error&apos;</code>,{' '}
          <code>errorSource: &apos;source&apos;</code>로 보입니다.{' '}
          <code>enabled: false</code>는 아무것도 소유하지 않고{' '}
          <code>status: &apos;pending&apos;</code>,{' '}
          <code>fetchStatus: &apos;idle&apos;</code>,{' '}
          <code>enabled: false</code>로 보이므로 로딩 표시 전에{' '}
          <code>enabled</code>를 확인하세요.
        </li>
        <li>
          <strong>옵션.</strong> 인라인 <code>queryFn</code>·<code>select</code>{' '}
          리터럴은 괜찮습니다. <code>staleTime</code>,{' '}
          <code>refetchInterval</code> 같은 원시 옵션을 바꾸면 같은 key를 다시
          열되 진행 중 READ는 취소하지 않습니다. Map·Set·클래스 인스턴스·함수를
          반환하는 <code>select</code>는 구조 공유가 되지 않아 커밋마다 다시
          발행합니다. 메모하거나 <code>equals</code>를 넘기세요.
        </li>
        <li>
          <strong>client 하나.</strong> client는 컴포넌트 수명 동안 고정입니다.
          React·Preact는 바뀌면{' '}
          <code>This query observer is bound to another client.</code>를 던지고,
          다른 진입점은 처음 client를 유지합니다. 바꾸려면 다시 마운트하세요.
        </li>
        <li>
          <strong>해제.</strong> 마지막 구독이 끝나면 짧은 해제
          일정(매크로태스크 하나, Preact는 다음 paint 뒤) 뒤에 핸들을 놓습니다.
          그래서 StrictMode나 한 커밋 안의 라우트 교체가 READ를 취소하거나
          반복하지 않습니다. 가짜 타이머를 쓰는 테스트에서는 핸들이 사라졌는지
          확인하기 전에 타이머를 진행하세요(
          <code>await vi.advanceTimersByTimeAsync(0)</code>, Preact는 200 ms).
        </li>
        <li>
          <strong>숨겨진 컴포넌트.</strong> React{' '}
          <code>&lt;Activity mode=&quot;hidden&quot;&gt;</code>는 숨겨진 동안
          조회를 놓고, 다시 보이면 stale인 key만 다시 읽습니다. Vue{' '}
          <code>&lt;KeepAlive&gt;</code>로 비활성화된 컴포넌트는 캐시에서
          빠지거나 언마운트될 때까지 붙어 있습니다.
        </li>
        <li>
          <strong>서버 렌더.</strong> 요청마다{' '}
          <code>{'createSyncClient({ ssr: true })'}</code>를 만드세요. 진입점은
          이 client에서 붙거나 READ하지 않으므로 렌더 전에 캐시를 채우고(
          <code>await client.prefetch(options)</code>나{' '}
          <code>client.ensure</code>) <code>client.dehydrate()</code>를 보낸 뒤,
          브라우저 client에서 렌더 전에 <code>client.hydrate(snapshot)</code>을
          호출하세요. Svelte의 store API는 서버 렌더에서도 구독하므로 일반
          client라면 거기서 조회를 열고 READ합니다.{' '}
          <a href="#/ko/guide/sync-persistence">영속화와 SSR</a>을 보세요.
        </li>
        <li>
          <strong>번들 간 공유.</strong>{' '}
          <a href="#/ko/guide/shared">state-ref/shared</a>로 client 하나를
          공유하는 번들들은 같은 <code>@stateref/sync</code>(0.3 이상)를 담아야
          합니다. 이전 버전의 client에는 <code>observe()</code>가 없어 진입점이{' '}
          <code>
            This sync client has no observe(); align the @stateref/sync versions
            of the bundles on this page.
          </code>
          를 던집니다.
        </li>
        <li>
          <strong>다른 프레임워크.</strong> 진입점은 <code>client.observe</code>{' '}
          위에 있습니다. 다른 프레임워크용 훅을 만들려면{' '}
          <a href="#/ko/api/sync">Sync API</a>를 보세요.
        </li>
      </ul>

      <h2>명시적 핸들</h2>

      <p>
        한 컴포넌트보다 오래 조회를 소유하는 store나 서비스는 핸들을 직접 열고{' '}
        <code>load()</code>와 <code>dispose()</code>를 호출합니다. 컴포넌트는 그
        핸들을 커넥터로 보여 줄 수 있습니다(아래).
      </p>

      <CodeBlock
        language="typescript"
        code={`const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
});

await account.load();      // 신선한 캐시가 있으면 그것을 쓴다
await account.refetch();   // 강제로 READ한다
account.invalidate();      // key를 stale로 만들고, 앞선 진행 중 응답을 배제한다
account.dispose();         // 이 핸들의 구독을 놓는다`}
      />

      <p>
        <code>account.status</code>는 첫 로드 전에도 읽을 수 있습니다.{' '}
        <code>account.ref</code>와 <code>account.watch</code>는 로드가 성공할
        때까지 <strong>던집니다</strong> — 내줄 기준이 없고, 가짜 기준을
        돌려주는 것이야말로 로딩 화면이 해서는 안 되는 일이기 때문입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const status = account.status.value;

status.status;      // 'pending' | 'success' | 'error'
status.fetchStatus; // 'idle' | 'fetching' | 'paused'
status.loaded;      // 기준이 있는가
status.error;
status.updatedAt;
status.invalidated;

// 로딩 축과 분리된 편집 축
status.dirty;
status.conflicts;
status.version;
status.pending;      // 진행 중인 연결 WRITE
status.unconfirmed;  // 끝내 확인되지 않은 WRITE 결과`}
      />

      <h2>컴포넌트에 연결하기</h2>

      <p>
        <code>account.watch</code>와 <code>account.watchStatus</code>는{' '}
        <code>state-ref</code>의 <code>Watch</code> 모양이라 커넥터가 그대로
        받습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const useAccount = connectReact(account.watch);
const useAccountStatus = connectReact(account.watchStatus);

function CityField() {
  const state = useAccount();
  return (
    <input
      value={state.address.city.value}
      onChange={event => (state.address.city.value = event.target.value)}
    />
  );
}`}
      />

      <p>
        값 쪽은 <code>loaded</code>가 true가 된 뒤에만 마운트하세요. ref 자신이
        그 전에는 거절하는 것과 같은 이유입니다.
      </p>

      <h2>편집은 로컬이다</h2>

      <p>
        ref 쓰기는 이 client의 resource를 바꾸고 그것으로 끝입니다. 어떤 요청도
        나가지 않습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.ref.address.city.value = 'Busan';

account.isDirty();  // true
account.changes();  // 한 줄: address.city, Seoul -> Busan
account.version();  // 로컬 리비전 카운터`}
      />

      <p>
        같은 client에서 같은 key를 쓰는 다른 핸들은 그 편집을 즉시 봅니다.
        핸들마다 복사본이 아니라 하나의 resource이기 때문입니다.
      </p>

      <h2>변경 목록</h2>

      <p>
        <code>changes()</code>는 <a href="#/ko/guide/draft">로컬 draft</a>가
        쓰는 것과 같은 변경 모델이고, 원본 자리에 서버 기준이 들어갑니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const [change] = account.changes();

change.path;      // ['address', 'city']
change.before;    // 서버 기준
change.after;     // 로컬 값
change.conflict;  // READ가 이 경로에 다른 값을 들고 왔을 때 true
change.id;`}
      />

      <p>
        배열은 <strong>하나의 원자적 필드</strong>로 추적됩니다. 원소 하나를
        고쳐도 배열 전체의 변경으로 기록됩니다. 인덱스는 정체성이 아니라
        위치이기 때문입니다.
      </p>

      <h2>READ는 덮어쓰지 않고 rebase한다</h2>

      <p>
        나중에 READ가 도착해도 로컬 편집은 남습니다. 서버가 밑에서 움직인 경로는
        조용히 교체되는 대신 충돌이 됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.ref.address.city.value = 'Busan'; // 로컬

await account.refetch();  // 서버는 이제 그 경로에 'Gwangju'라고 답한다

account.status.value.conflicts;      // 1
account.changes()[0].conflict;       // true
account.ref.address.city.value;      // 여전히 'Busan' — 편집이 지켜졌다`}
      />

      <p>
        조회 핸들에는 <code>resolve()</code>가 없습니다. 서버 값을 받거나, 내
        값을 저장해서 지키거나, 사람이 고르게 하는 방법은{' '}
        <a href="#/ko/guide/sync-lifecycle">편집의 생애</a>에 있습니다.
      </p>

      <h2>알려진 서버 값 수용</h2>

      <p>
        <code>acceptServer(value)</code>는 아무것도 보내지 않고 기준을 옮깁니다.
        캐시 전용 수용이고, 아직 떠 있는 앞선 READ를 배제합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.acceptServer(knownAccount);`}
      />

      <p>
        그 조회에 연결된 WRITE가 진행 중이면 거절합니다 — 아직 답하지 않은
        작업이 기준을 정하고 있는 중이기 때문입니다.
      </p>

      <h2>readonly 조회</h2>

      <p>
        절대 편집하지 않는 데이터나, 평범한 트리가 아닌 데이터(예:{' '}
        <code>Date</code>)에는 <code>editable: false</code>를 주세요. ref
        setter가 거절됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const settings = client.query({
  queryKey: ['settings'],
  queryFn: ({ signal }) => api.readSettings({ signal }),
  editable: false,
});

settings.ref.theme.value = 'dark'; // throws: This query is readonly.`}
      />

      <p>
        readonly 조회에도 <code>changes()</code>와 <code>version</code>은{' '}
        <strong>있습니다.</strong> 영원히 비어 있고 0일 뿐입니다. 거절하는 것은{' '}
        <code>capture()</code>입니다. 비어 있는 검토 표면과 존재하지 않는 표면은
        다른 사실이고, 그 빈 목록이 둘을 가릅니다.
      </p>

      <p>
        편집 가능한 조회에서 <code>capture()</code>가 무엇을 얼리고 저장 뒤
        편집이 어떻게 되는지는{' '}
        <a href="#/ko/guide/sync-lifecycle">편집의 생애</a>를 보세요. 조회에서
        난 충돌을 푸는 방법도 거기 있습니다.
      </p>

      <h2>resource가 받는 것</h2>

      <p>
        편집 가능한 데이터는 기본적으로 순환 없는 평범한 트리와 조밀한
        배열입니다. 예약된 프록시 키와, <code>.value</code>가 돌려준 객체를 직접
        변형하는 것은 거절합니다. <code>load/fetch/ensure</code>가 돌려주는
        결과는 얼린 복사본이므로 ref로 편집하세요.
      </p>

      <h2>캐시 준비하기</h2>

      <CodeBlock
        language="typescript"
        code={`await client.prefetch(options); // 성공하면 캐시하고, 로드 거절은 삼킨다
const fresh = await client.fetch(options);   // 신선한 캐시 또는 READ. 오류는 던진다
const cached = await client.ensure(options); // 확인된 캐시. stale이어도 준다

const seeded = client.query({ ...options, initialData: knownAccount });`}
      />

      <p>
        이들은 client의 캐시와 진행 중 READ를 key로 공유하고, 임시 옵션이 기존
        핸들의 옵션을 대체하지 않습니다. <code>initialData</code>는 완전하고
        확인된 서버 값에만 쓰세요 — 그것이 편집 기준이 됩니다.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/sync-mutation">mutation과 link</a> - 그 변경을
          보내기
        </li>
        <li>
          <a href="#/ko/guide/draft-conflicts">충돌과 해소</a> - 로컬 draft에서
          같은 충돌 모델
        </li>
        <li>
          <a href="#/ko/guide/sync-view">표시와 반응형 key</a> - 관찰자별 표시
          상태
        </li>
      </ul>
    </div>
  );
});
