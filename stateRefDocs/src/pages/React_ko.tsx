import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ReactKo = mount(() => {
  return () => (
    <div>
      <h1>React 연동</h1>

      <p>
        <code>@stateref/connect-react</code>를 사용하면 StateRef 스토어를
        React에 연결할 수 있습니다. 변경이 발생하면 컴포넌트가 자동으로
        리렌더링됩니다.
      </p>

      <h2>설치</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-react`}
      />

      <p>
        ESM 전용 <code>@stateref/connect-react/sync</code> 진입점(아래
        &quot;컴포넌트 조회&quot;)을 쓰려면 선택 의존성인{' '}
        <code>@stateref/sync</code> 0.3 이상도 설치합니다.
      </p>

      <CodeBlock language="bash" code={`pnpm add @stateref/sync`} />

      <h2>지원 버전</h2>

      <p>
        React 18과 19(<code>react ^18.0.0 || ^19.0.0</code>). 패키지 메이저는
        지원하는 가장 새 React를 따르므로 <code>@stateref/connect-react</code>{' '}
        19.x는 React 18에서도 동작합니다.
      </p>

      <h2>기본 사용법</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

// watch로 React 훅 생성
export const useProfileStore = connectReact(watch);`}
      />

      <CodeBlock
        language="tsx"
        code={`import { useProfileStore } from './profileStore';

export function ProfileCard() {
  const { name, age } = useProfileStore();

  return (
    <div>
      <p>{name.value}</p>
      <button onClick={() => (age.value += 1)}>
        Age: {age.value}
      </button>
    </div>
  );
}`}
      />

      <h2>업데이트 동작</h2>

      <ul>
        <li>훅은 마운트 시 구독하고, 추적된 값이 바뀌면 리렌더링됩니다</li>
        <li>
          렌더에서 <code>.value</code>를 읽는 것이 추적의 기준입니다
        </li>
        <li>언마운트 시 자동으로 정리됩니다 (AbortController)</li>
      </ul>

      <h2>수동 동기화 + 액션</h2>

      <p>
        <code>createStoreManualSync</code>를 사용할 때는 액션에서 업데이트하고{' '}
        <code>sync()</code>로 전파하세요.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStoreManualSync } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectReact(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}
      />

      <CodeBlock
        language="tsx"
        code={`import { useCounterStore, increment } from './counterStore';

export function Counter() {
  const { count } = useCounterStore();
  return <button onClick={increment}>{count.value}</button>;
}`}
      />

      <h2>TypeScript 팁</h2>

      <p>
        <code>createStore</code>의 타입이 훅으로 그대로 전달되므로 컴포넌트에서
        타입이 안전하게 유지됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectReact(watch);

// useTodo()는 StateRefStore<Todo> 반환`}
      />

      <h2>컴포넌트 조회</h2>

      <p>
        컴포넌트 코드의 서버 데이터에는{' '}
        <code>@stateref/connect-react/sync</code>의 <code>useSyncQuery</code>를
        씁니다. 컴포넌트는 마운트된 동안 조회를 소유합니다. 커밋 뒤 불러오고,
        props의 key를 따라가며, 같은 key를 보는 다른 컴포넌트와 진행 중인 READ를
        나누고, 그중 마지막이 언마운트된 뒤 해제됩니다.
      </p>

      <CodeBlock
        language="tsx"
        code={`import { useSyncQuery } from '@stateref/connect-react/sync';
import { client } from './client'; // createSyncClient(), 앱당 하나
import { readShip } from './api'; // (id, signal) => Promise<Ship>

export function ShipPanel({ id }: { id: number }) {
  const [ship, q] = useSyncQuery(client, {
    queryKey: ['ship', id],
    queryFn: ({ signal }) => readShip(id, signal),
    staleTime: 30_000,
  });

  if (ship.status.value === 'pending') return <p>불러오는 중…</p>;
  if (!ship.loaded.value) return <p role="alert">우주선을 불러오지 못했습니다.</p>;

  const rename = (name: string) => {
    const handle = q.handle();
    if (handle?.status.value.loaded) handle.ref.name.value = name; // 로컬 편집
  };

  return (
    <section>
      <input
        value={ship.data.name.value ?? ''}
        onChange={event => rename(event.target.value)}
      />
      <button onClick={() => void q.refetch().catch(() => {})}>새로고침</button>
      <button onClick={() => q.invalidate()}>다시 확인</button>
    </section>
  );
}`}
      />

      <p>
        <code>ship</code>은 조회의 읽기 전용 표시 상태(<code>status</code>,{' '}
        <code>fetchStatus</code>, <code>loaded</code>, <code>error</code>,{' '}
        <code>data</code>, <code>dirty</code>, <code>queryKey</code> 등)입니다.
        리프는 <code>.value</code>로 읽고, 렌더가 읽은 경로가 바뀔 때만 다시
        렌더됩니다. <code>q</code>는 컴포넌트 수명 동안 같은 객체입니다.
      </p>

      <ul>
        <li>
          <code>q.refetch()</code>는 다시 읽고 Promise를 돌려줍니다. 마운트 전,
          비활성 상태, 서버에서는{' '}
          <code>This query observer is not attached.</code>로 거절됩니다.
        </li>
        <li>
          <code>q.invalidate()</code>는 key를 stale로 표시하고, 마운트되어 있고
          활성 상태면 다시 읽습니다. <code>client.invalidate(key)</code>는 stale
          표시만 합니다.
        </li>
        <li>
          <code>q.handle()</code>은 조회 자신의 핸들을 돌려주고, 마운트 전,
          비활성 상태, 서버에서는 <code>null</code>을 돌려줍니다. 로드된 뒤{' '}
          <code>handle.ref</code>로 편집하고 mutation <code>links</code>에
          넘기되, dispose하지는 마세요. 훅이 소유합니다.
        </li>
      </ul>

      <p>React에서는:</p>

      <ul>
        <li>
          렌더마다 평범한 옵션 객체를 넘깁니다. props를 넣어도 되고, 인라인{' '}
          <code>queryFn</code>·<code>select</code> 리터럴은 조회를 다시 열지
          않습니다.
        </li>
        <li>
          렌더는 아무것도 만들지 않습니다. 해제는 매크로태스크 하나를 기다리므로{' '}
          <code>&lt;StrictMode&gt;</code>나 한 커밋 안의 라우트 교체가 READ를
          취소하거나 반복하지 않습니다.{' '}
          <code>&lt;Activity mode=&quot;hidden&quot;&gt;</code> 안에서는 숨겨진
          동안 조회가 해제됩니다.
        </li>
        <li>
          client는 컴포넌트 수명 동안 고정입니다. 다른 client를 넘기면{' '}
          <code>This query observer is bound to another client.</code>를
          던집니다.
        </li>
        <li>
          서버에서 훅은 붙지도 READ하지도 않습니다. 요청마다 만든{' '}
          <code>createSyncClient({'{ ssr: true }'})</code>를{' '}
          <code>await client.prefetch(options)</code>로 채워 렌더하고{' '}
          <code>client.dehydrate()</code>를 보낸 뒤, 브라우저 client에서{' '}
          <code>hydrateRoot</code> 전에 <code>client.hydrate(snapshot)</code>을
          부릅니다.
        </li>
      </ul>

      <p>
        조회 수명, 의존 조회, 서버 렌더는{' '}
        <a href="#/ko/guide/sync-query">query와 resource</a>에서 더 다룹니다.
      </p>

      <h2>읽기 전용 조회 view</h2>

      <p>
        <code>connectReactView</code>는{' '}
        <a href="#/ko/guide/sync-view">@stateref/sync</a>의 읽기 전용 조회
        view를 연결합니다. 컴포넌트 밖에서 소유하는 명시적 핸들, 곧 store나
        서비스가 <code>client.query(...)</code>로 열고 직접 로드·dispose하는
        조회에 씁니다. <code>connectReact</code>와 같은 <code>Watch</code>{' '}
        모양을 받지만 setter는 내주지 않습니다. 표시는 선택된 값일 수도, 서버에
        존재한 적 없는 placeholder일 수도 있기 때문입니다.
      </p>

      <CodeBlock
        language="tsx"
        code={`const useLive = connectReactView(live.watchDisplay);

function CityDisplay() {
  const state = useLive();
  if (state.status.value === 'pending') return <span>불러오는 중…</span>;
  return <span>{state.data.value ?? '-'}</span>;
}`}
      />

      <p>
        실제 데이터는 로드된 뒤 <code>live.ref</code>로 편집하세요. 표시로 하지
        않습니다. 이 컴포넌트의 언마운트는 <strong>자기 구독만</strong> 끝냅니다
        — view 자체는 소유자가 <code>live.dispose()</code>로 놓으므로, 같은
        view를 보는 둘째 화면은 계속 동작합니다.
      </p>

      <h2>훅이 구독하는 방식</h2>

      <ul>
        <li>
          React가 외부 스토어에 정한 계약인 <code>useSyncExternalStore</code>{' '}
          위에 있습니다. 구독은 커밋 뒤에 만들어지고 React가 끝내므로,{' '}
          <code>&lt;StrictMode&gt;</code>나 React가 버린 렌더가 아무것도 남기지
          않습니다.
        </li>
        <li>
          <strong>마운트는 두 번 렌더됩니다.</strong> state-ref는 구독된 참조로
          렌더하는 동안 무엇을 읽는지 알아내는데, 첫 커밋 전에는 그런 참조가
          없습니다. 첫 렌더는 올바른 값으로 그리고, 두 번째 렌더가 구독된 참조로
          읽어 경로를 모읍니다. 그 뒤로는 읽은 경로가 바뀔 때만 다시 렌더됩니다.
        </li>
        <li>
          서버 렌더는 <code>getServerSnapshot</code>을 쓰고 아무것도 구독하지
          않습니다.
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
      </ul>
    </div>
  );
});
