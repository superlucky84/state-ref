import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SvelteKo = mount(() => {
  return () => (
    <div>
      <h1>Svelte 연동</h1>

      <p>
        <code>@stateref/connect-svelte</code>를 사용하여 StateRef 스토어를
        Svelte에 연결합니다. Svelte의 반응성과 통합되는 Svelte{' '}
        <code>Writable</code> 스토어를 반환합니다.
      </p>

      <h2>설치</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-svelte`}
      />

      <p>
        ESM 전용 <code>@stateref/connect-svelte/sync</code> 진입점(아래
        &quot;컴포넌트 조회&quot;)을 쓰려면 선택 의존성인{' '}
        <code>@stateref/sync</code> 0.3 이상도 설치합니다.
      </p>

      <CodeBlock language="bash" code={`pnpm add @stateref/sync`} />

      <h2>지원 버전</h2>

      <p>
        Svelte 4와 5(<code>svelte ^4.0.0 || ^5.0.0</code>). 패키지 메이저는
        지원하는 가장 새 Svelte를 따르므로 <code>@stateref/connect-svelte</code>{' '}
        5.x는 Svelte 4에서도 동작합니다. 아래의 store API는 두 버전 모두에서
        쓰고, Svelte 5에는 runes 진입점도 있습니다(아래 &quot;Svelte 5
        runes&quot;).
      </p>

      <h2>기본 사용법</h2>

      <p>
        Svelte 커넥터는 스토어에서 추적할 부분을 선택하기 위해 콜백 패턴을
        사용합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStore } from 'state-ref';
import { connectSvelte } from '@stateref/connect-svelte';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectSvelte(watch);`}
      />

      <CodeBlock
        language="html"
        code={`<script lang="ts">
  import { useProfile } from './store';

  // 추적할 프로퍼티 선택 - Svelte Writable 반환
  const name = useProfile(store => store.name);
  const age = useProfile(store => store.age);
</script>

<div>
  <p>{$name}</p>
  <button on:click={() => $age += 1}>
    나이: {$age}
  </button>
</div>`}
      />

      <h2>작동 방식</h2>

      <p>Svelte 커넥터는 StateRef와 Svelte의 스토어 시스템을 연결합니다:</p>

      <ul>
        <li>
          <code>connectSvelte(watch)</code>는 셀렉터 콜백을 받는 함수를
          반환합니다
        </li>
        <li>
          셀렉터는 StateRefStore를 받아서 추적할 특정 프로퍼티를 반환합니다
        </li>
        <li>
          Svelte <code>Writable</code> 스토어를 반환합니다
        </li>
        <li>
          <code>$</code> 접두사를 사용하여 값을 반응적으로 접근하고
          업데이트합니다
        </li>
        <li>
          양방향 바인딩: Svelte 변경이 StateRef로, 그리고 그 반대로도
          동기화됩니다
        </li>
        <li>컴포넌트 파괴 시 자동으로 정리됩니다</li>
      </ul>

      <h2>프로퍼티 선택하기</h2>

      <p>셀렉터 콜백을 사용하여 특정 프로퍼티를 선택합니다:</p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'ko' }
});

const useStore = connectSvelte(watch);`}
      />

      <CodeBlock
        language="html"
        code={`<script>
  import { useStore } from './store';

  const userName = useStore(store => store.user.name);
  const userAge = useStore(store => store.user.age);
  const theme = useStore(store => store.settings.theme);
</script>

<!-- $ 접두사로 값 접근 -->
<p>이름: {$userName}</p>
<p>테마: {$theme}</p>

<!-- 값 업데이트 -->
<button on:click={() => $userName = 'Jane'}>이름 변경</button>
<button on:click={() => $theme = 'light'}>테마 토글</button>`}
      />

      <h2>객체 다루기</h2>

      <p>전체 객체를 선택할 수도 있습니다:</p>

      <CodeBlock
        language="html"
        code={`<script>
  import { useStore } from './store';

  // 전체 user 객체 선택
  const user = useStore(store => store.user);
</script>

<!-- 중첩된 값 접근 -->
<p>이름: {$user.name}</p>
<p>나이: {$user.age}</p>

<!-- 전체 객체 교체 -->
<button on:click={() => $user = { name: 'Jane', age: 25 }}>
  사용자 업데이트
</button>`}
      />

      <h2>액션과 함께 수동 동기화</h2>

      <p>
        <code>createStoreManualSync</code>를 사용하면 쓰기는 액션에서
        처리합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectSvelte } from '@stateref/connect-svelte';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectSvelte(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}
      />

      <CodeBlock
        language="html"
        code={`<script>
  import { useCounter, increment } from './store';

  const count = useCounter(store => store.count);
</script>

<button on:click={increment}>
  Count: {$count}
</button>`}
      />

      <h2>Svelte의 반응형 구문과 함께 사용</h2>

      <p>파생 값을 위해 Svelte의 반응형 구문과 결합합니다:</p>

      <CodeBlock
        language="html"
        code={`<script>
  import { useStore } from './store';

  const firstName = useStore(store => store.firstName);
  const lastName = useStore(store => store.lastName);

  // 반응형 파생 값
  $: fullName = \`\${$firstName} \${$lastName}\`;
</script>

<p>전체 이름: {fullName}</p>
<input bind:value={$firstName} placeholder="이름" />
<input bind:value={$lastName} placeholder="성" />`}
      />

      <h2>bind:value와 양방향 바인딩</h2>

      <p>Svelte의 양방향 바인딩이 원활하게 작동합니다:</p>

      <CodeBlock
        language="html"
        code={`<script>
  import { useStore } from './store';

  const name = useStore(store => store.name);
  const email = useStore(store => store.email);
</script>

<!-- 양방향 바인딩 -->
<input bind:value={$name} placeholder="이름" />
<input bind:value={$email} type="email" placeholder="이메일" />

<p>이름: {$name}</p>
<p>이메일: {$email}</p>`}
      />

      <h2>TypeScript 팁</h2>

      <p>커넥터는 스토어의 타입을 유지합니다:</p>

      <CodeBlock
        language="typescript"
        code={`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectSvelte(watch);

// TypeScript가 타입을 알고 있음
const title = useTodo(store => store.title);
// title은 Writable<string>

const done = useTodo(store => store.done);
// done은 Writable<boolean>`}
      />

      <h2>컴포넌트 조회</h2>

      <p>
        컴포넌트 코드의 서버 데이터에는 컴포넌트 초기화 중에{' '}
        <code>@stateref/connect-svelte/sync</code>의{' '}
        <code>createSyncQuery</code>를 부릅니다. 컴포넌트는 사라질 때까지 조회를
        소유합니다. 처음 선택할 때 불러오고, 옵션 store의 key를 따라가며, 같은
        key를 보는 다른 컴포넌트와 진행 중인 READ를 공유하고, 그중 마지막이
        사라진 뒤 해제됩니다.
      </p>

      <CodeBlock
        language="html"
        code={`<script lang="ts">
  import { writable } from 'svelte/store';
  import type { ObserveOptions } from '@stateref/sync';
  import { createSyncQuery } from '@stateref/connect-svelte/sync';
  import { client } from './client'; // createSyncClient(), 앱당 하나
  import { readShip, type Ship } from './api'; // (id, signal) => Promise<Ship>

  export let id: number;

  const shipQuery = (id: number): ObserveOptions<Ship> => ({
    queryKey: ['ship', id],
    queryFn: ({ signal }) => readShip(id, signal),
    staleTime: 30_000,
  });
  const options = writable(shipQuery(id));
  $: options.set(shipQuery(id));

  const [ship, q] = createSyncQuery(client, options);
  const status = ship(ref => ref.status.value);
  const loaded = ship(ref => ref.loaded.value);
  const name = ship(ref => ref.data.name.value);

  function rename(event: Event) {
    const handle = q.handle();
    if (handle?.status.value.loaded)
      handle.ref.name.value = (event.target as HTMLInputElement).value; // 로컬 편집
  }
</script>

{#if $status === 'pending'}
  <p>불러오는 중…</p>
{:else if !$loaded}
  <p role="alert">우주선을 불러오지 못했습니다.</p>
{:else}
  <input value={$name ?? ''} on:input={rename} />
  <button on:click={() => q.refetch().catch(() => {})}>새로고침</button>
  <button on:click={() => q.invalidate()}>다시 확인</button>
{/if}`}
      />

      <p>
        <code>ship(select)</code>는 조회의 읽기 전용 표시 상태(
        <code>status</code>, <code>fetchStatus</code>, <code>loaded</code>,{' '}
        <code>error</code>, <code>data</code>, <code>dirty</code>,{' '}
        <code>queryKey</code> 등)에서 <code>select</code>가 읽은 값을 Svelte{' '}
        <code>Readable&lt;V&gt;</code>로 돌려줍니다. 리프는 <code>select</code>{' '}
        안에서 <code>.value</code>로, store는 <code>$name</code>으로 읽습니다.
        선택은 만들어질 때 구독하므로 첫 선택이 조회를 붙이고, 모든 선택이 그
        조회를 공유합니다. <code>q</code>는 컴포넌트 수명 동안 같은 객체입니다.
      </p>

      <ul>
        <li>
          <code>q.refetch()</code>는 다시 읽고 Promise를 돌려줍니다. 첫 선택 전,
          비활성 상태, 서버에서는{' '}
          <code>This query observer is not attached.</code>로 거절됩니다.
        </li>
        <li>
          <code>q.invalidate()</code>는 key를 stale로 표시하고, 붙어 있고 활성
          상태면 다시 읽습니다. <code>client.invalidate(key)</code>는 stale
          표시만 합니다.
        </li>
        <li>
          <code>q.handle()</code>은 조회 자신의 핸들을 돌려주고, 첫 선택 전,
          비활성 상태, 서버에서는 <code>null</code>을 돌려줍니다. 로드된 뒤{' '}
          <code>handle.ref</code>로 편집하고 mutation <code>links</code>에
          넘기되, dispose하지는 마세요. 훅이 소유합니다.
        </li>
      </ul>

      <p>Svelte에서는:</p>

      <ul>
        <li>
          조회는 Svelte 4와 5 모두 store API를 씁니다. 조회용 runes 진입점은
          없습니다. 선택도 컴포넌트 초기화 중에 만듭니다. 각 선택은 컴포넌트가
          사라질 때 끝납니다.
        </li>
        <li>
          옵션은 컴포넌트 수명 동안 고정되는 평범한 객체이거나,{' '}
          <code>writable</code>·<code>derived</code> 같은 <code>Readable</code>{' '}
          옵션 store입니다. 평범한 getter는 추적되지 않습니다.
        </li>
        <li>
          컴포넌트가 사라지면 매크로태스크 하나 뒤에 조회가 해제되므로, 라우트
          교체가 READ를 취소하거나 반복하지 않습니다.
        </li>
        <li>
          <strong>
            서버 렌더에는 요청마다 만든{' '}
            <code>createSyncClient({'{ ssr: true }'})</code>가 필요합니다.
          </strong>{' '}
          store API는 서버 렌더 중에도 구독하므로, 평범한 client라면 렌더가
          조회를 붙이고 READ를 시작합니다. <code>ssr: true</code> client는
          붙지도 READ하지도 않습니다. 렌더 전에{' '}
          <code>await client.prefetch(options)</code>로 채우고{' '}
          <code>client.dehydrate()</code>를 보낸 뒤, 브라우저 client에서 hydrate
          전에 <code>client.hydrate(snapshot)</code>을 부릅니다.
        </li>
      </ul>

      <p>
        조회 수명, 의존 조회, 서버 렌더는{' '}
        <a href="#/ko/guide/sync-query">query와 resource</a>에서 더 다룹니다.
      </p>

      <h2>읽기 전용 조회 view</h2>

      <p>
        <code>connectSvelteView</code>는{' '}
        <a href="#/ko/guide/sync-view">@stateref/sync</a>의 읽기 전용 조회
        view를 연결합니다. 컴포넌트 밖에서 소유하는 명시적 핸들, 곧 store나
        서비스가 <code>client.query(...)</code>로 열고 직접 로드·dispose하는
        조회에 씁니다. <code>connectSvelte</code>와 같은 <code>Watch</code>{' '}
        모양을 받지만 setter는 내주지 않습니다. 표시는 선택된 값일 수도, 서버에
        존재한 적 없는 placeholder일 수도 있기 때문입니다.
      </p>

      <CodeBlock
        language="html"
        code={`<script lang="ts">
  const view = connectSvelteView(live.watchDisplay);
  const city = view(ref => ref.data.value);
</script>

<span>{$city ?? '-'}</span>`}
      />

      <p>
        실제 데이터는 로드된 뒤 <code>live.ref</code>로 편집하세요. 표시로 하지
        않습니다. 이 컴포넌트의 언마운트는 <strong>자기 구독만</strong> 끝냅니다
        — view 자체는 소유자가 <code>live.dispose()</code>로 놓으므로, 같은
        view를 보는 둘째 화면은 계속 동작합니다.
      </p>

      <h2>쓰기 규칙</h2>

      <ul>
        <li>
          <code>$user.name = 'Jane'</code>은 실제 스토어 쓰기입니다. Svelte가
          이것을 <code>user.set(...)</code>으로 컴파일해 커넥터를 지나가게 하고,
          커넥터는 Svelte에 복사본을 주므로 스토어는 그 <code>set</code>이
          도착할 때 올바른 <code>before</code>와 함께 바뀝니다.
        </li>
        <li>컴포넌트가 사라지면 스토어로의 되쓰기도 멈춥니다.</li>
      </ul>

      <h2>Svelte 5 runes</h2>

      <p>
        <code>@stateref/connect-svelte/runes</code>는 Svelte 5용 별도 진입점이고
        ESM 전용입니다(Svelte 4에는 <code>svelte/reactivity</code>가 없습니다).
        선택은 <code>.value</code>를 가진 객체입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStore } from 'state-ref';
import { connectSvelteRunes } from '@stateref/connect-svelte/runes';

export const watch = createStore({ user: { name: 'John', age: 30 } });
export const useStore = connectSvelteRunes(watch);`}
      />

      <CodeBlock
        language="html"
        code={`<script lang="ts">
  import { useStore } from './store';

  const name = useStore(s => s.user.name);
  const user = useStore(s => s.user);
</script>

<p>{name.value} ({user.value.age})</p>
<button onclick={() => (name.value = 'Jane')}>Rename</button>
<button onclick={() => (user.value = { ...user.value, age: 31 })}>Age</button>`}
      />

      <ul>
        <li>
          템플릿, <code>$effect</code>, <code>$derived</code>가{' '}
          <code>.value</code>를 읽는 동안 구독하고, 마지막 읽는 쪽이 사라지면
          놓습니다.
        </li>
        <li>
          <code>.value</code>에 대입하면 스토어에 즉시 씁니다. 선택한
          객체·배열은 얼린 복사본이라 <code>user.value.age = 31</code>은 오류가
          납니다 — 커넥터를 지나가지 않기 때문입니다.
        </li>
        <li>
          <strong>컴포넌트에 묶이지 않습니다.</strong> 모듈 수준에서 만든 선택도
          동작하고, 그것을 통한 쓰기는 언제나 스토어에 닿습니다. 컴포넌트가
          사라지면 되쓰기를 멈추는 store API와 다른 점입니다.
        </li>
      </ul>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/create-store">createStore</a> - 스토어 생성
        </li>
        <li>
          <a href="#/ko/guide/manual-sync">수동 동기화 (Flux)</a> - 액션 기반
          업데이트
        </li>
        <li>
          <a href="#/ko/guide/watch">Watch 함수</a> - 구독 동작
        </li>
        <li>
          <a href="#/ko/guide/vue">Vue</a> - Vue 연동 (유사한 패턴)
        </li>
      </ul>
    </div>
  );
});
