import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const PreactKo = mount(() => {
  return () => (
    <div>
      <h1>Preact 연동</h1>

      <p>
        <code>@stateref/connect-preact</code>를 사용하여 StateRef 스토어를
        Preact에 연결합니다. 변경 사항이 있을 때 자동으로 리렌더링되는 훅을
        제공합니다.
      </p>

      <h2>설치</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-preact`}
      />

      <p>
        ESM 전용 <code>@stateref/connect-preact/sync</code> 진입점(아래
        &quot;컴포넌트 조회&quot;)을 쓰려면 선택 의존성인{' '}
        <code>@stateref/sync</code> 0.3 이상도 설치합니다.
      </p>

      <CodeBlock language="bash" code={`pnpm add @stateref/sync`} />

      <h2>지원 버전</h2>

      <p>
        Preact 10(<code>preact ^10.0.0</code>). <code>preact/hooks</code>만 쓰고{' '}
        <code>preact/compat</code>은 필요 없습니다.
      </p>

      <h2>기본 사용법</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import { connectPreact } from '@stateref/connect-preact';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

// watch로 Preact 훅 생성
export const useProfileStore = connectPreact(watch);`}
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
        나이: {age.value}
      </button>
    </div>
  );
}`}
      />

      <h2>업데이트 동작 방식</h2>

      <ul>
        <li>훅은 마운트 시 구독하고 추적된 값이 변경되면 리렌더링합니다</li>
        <li>
          업데이트는 렌더링에서 <code>.value</code>를 읽는 것으로 구동됩니다
        </li>
        <li>언마운트 시 자동으로 정리됩니다 (AbortController)</li>
      </ul>

      <h2>Preact vs React</h2>

      <p>
        Preact 커넥터는 React 버전과 거의 동일합니다. 주요 차이점은 React의
        hooks 대신 <code>preact/hooks</code>를 사용한다는 것입니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// React
import { connectReact } from '@stateref/connect-react';

// Preact
import { connectPreact } from '@stateref/connect-preact';

// 사용법은 동일
const useStore = connectPreact(watch);`}
      />

      <h2>액션과 함께 수동 동기화</h2>

      <p>
        <code>createStoreManualSync</code>를 사용하는 경우 쓰기는 액션에서
        처리하고 업데이트 후 <code>sync()</code>를 호출합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStoreManualSync } from 'state-ref';
import { connectPreact } from '@stateref/connect-preact';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectPreact(watch);

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
        훅은 <code>createStore</code>의 타입을 유지하므로 컴포넌트에서 강력한
        타입의 참조를 얻을 수 있습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectPreact(watch);

// useTodo()는 StateRefStore<Todo>를 반환`}
      />

      <h2>컴포넌트 조회</h2>

      <p>
        컴포넌트 코드의 서버 데이터에는{' '}
        <code>@stateref/connect-preact/sync</code>의 <code>useSyncQuery</code>를
        씁니다. 컴포넌트는 마운트된 동안 조회를 소유합니다. 커밋 뒤 불러오고,
        props의 key를 따라가며, 같은 key를 보는 다른 컴포넌트와 진행 중인 READ를
        나누고, 그중 마지막이 언마운트된 뒤 해제됩니다.
      </p>

      <CodeBlock
        language="tsx"
        code={`import { useSyncQuery } from '@stateref/connect-preact/sync';
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
        onInput={event => rename(event.currentTarget.value)}
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

      <p>Preact에서는:</p>

      <ul>
        <li>
          렌더마다 평범한 옵션 객체를 넘깁니다. props를 넣어도 되고, 인라인{' '}
          <code>queryFn</code>·<code>select</code> 리터럴은 조회를 다시 열지
          않습니다.
        </li>
        <li>
          렌더는 아무것도 만들지 않습니다. Preact는 effect를 paint 뒤에 돌리므로
          해제는 다음 paint를 기다립니다(프레임이 오지 않으면 200ms 타이머가
          대신합니다). 그래서 한 key를 다른 컴포넌트에 넘기는 라우트 교체가
          READ를 취소하거나 반복하지 않습니다. 테스트는 핸들이 사라졌는지
          확인하기 전에 이 해제를 기다립니다.
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
        <code>connectPreactView</code>는{' '}
        <a href="#/ko/guide/sync-view">@stateref/sync</a>의 읽기 전용 조회
        view를 연결합니다. 컴포넌트 밖에서 소유하는 명시적 핸들, 곧 store나
        서비스가 <code>client.query(...)</code>로 열고 직접 로드·dispose하는
        조회에 씁니다. <code>connectPreact</code>와 같은 <code>Watch</code>{' '}
        모양을 받지만 setter는 내주지 않습니다. 표시는 선택된 값일 수도, 서버에
        존재한 적 없는 placeholder일 수도 있기 때문입니다.
      </p>

      <CodeBlock
        language="tsx"
        code={`const useLive = connectPreactView(live.watchDisplay);

function CityDisplay() {
  const state = useLive();
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
          구독은 커밋 뒤 effect에서 만들어지고 그 정리 함수가 놓습니다.
          suspend된 렌더는 커밋되지 않으므로 아무것도 남기지 않습니다.
        </li>
        <li>
          <strong>마운트는 두 번 렌더됩니다.</strong> React 커넥터와 같은
          이유입니다. 첫 렌더는 올바른 값으로 그리고, 두 번째 렌더가 컴포넌트가
          읽는 경로를 모읍니다.
        </li>
        <li>
          서버 렌더는 effect를 돌리지 않으므로 아무것도 구독하지 않습니다.
        </li>
      </ul>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/shared">번들 간 공유</a> - 따로 빌드된 번들이 같은
          스토어를 쓰기
        </li>
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
          <a href="#/ko/guide/react">React</a> - React 연동 (거의 동일한 API)
        </li>
      </ul>
    </div>
  );
});
