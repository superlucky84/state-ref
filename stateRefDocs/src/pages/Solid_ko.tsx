import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SolidKo = mount(() => {
  return () => (
    <div>
      <h1>Solid 연동</h1>

      <p>
        <code>@stateref/connect-solid</code>를 사용하여 StateRef 스토어를
        Solid.js에 연결합니다. Solid의 세밀한 반응성과 통합되는 Solid{' '}
        <code>Signal</code> 쌍을 반환합니다.
      </p>

      <h2>설치</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-solid`}
      />

      <p>
        ESM 전용 <code>@stateref/connect-solid/sync</code> 진입점(아래
        &quot;컴포넌트 조회&quot;)을 쓰려면 선택 의존성인{' '}
        <code>@stateref/sync</code> 0.3 이상도 설치합니다.
      </p>

      <CodeBlock language="bash" code={`pnpm add @stateref/sync`} />

      <h2>지원 버전</h2>

      <p>
        Solid 1.9(<code>solid-js ^1.9.1</code>).
      </p>

      <h2>기본 사용법</h2>

      <p>
        Solid 커넥터는 스토어에서 추적할 부분을 선택하기 위해 콜백 패턴을
        사용합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStore } from 'state-ref';
import { connectSolid } from '@stateref/connect-solid';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectSolid(watch);`}
      />

      <CodeBlock
        language="tsx"
        code={`import { useProfile } from './store';

function ProfileCard() {
  // [getter, setter] Signal 쌍 반환
  const [name, setName] = useProfile(store => store.name);
  const [age, setAge] = useProfile(store => store.age);

  return (
    <div>
      <p>{name()}</p>
      <button onClick={() => setAge(prev => prev + 1)}>
        나이: {age()}
      </button>
    </div>
  );
}`}
      />

      <h2>작동 방식</h2>

      <p>Solid 커넥터는 StateRef와 Solid의 시그널 시스템을 연결합니다:</p>

      <ul>
        <li>
          <code>connectSolid(watch)</code>는 셀렉터 콜백을 받는 함수를
          반환합니다
        </li>
        <li>
          셀렉터는 StateRefStore를 받아서 추적할 특정 프로퍼티를 반환합니다
        </li>
        <li>
          Solid <code>Signal</code> 쌍을 반환합니다:{' '}
          <code>[getter, setter]</code>
        </li>
        <li>
          getter 함수를 호출하여 값을 읽습니다: <code>name()</code>
        </li>
        <li>
          setter 함수를 사용하여 값을 업데이트합니다:{' '}
          <code>setName('Jane')</code>
        </li>
        <li>
          양방향 바인딩: Solid 변경이 StateRef로, 그리고 그 반대로도
          동기화됩니다
        </li>
        <li>
          <code>onCleanup</code>을 통해 자동으로 정리됩니다
        </li>
      </ul>

      <h2>프로퍼티 선택하기</h2>

      <p>셀렉터 콜백을 사용하여 특정 프로퍼티를 선택합니다:</p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'ko' }
});

const useStore = connectSolid(watch);`}
      />

      <CodeBlock
        language="tsx"
        code={`import { useStore } from './store';

function Settings() {
  const [userName, setUserName] = useStore(store => store.user.name);
  const [userAge, setUserAge] = useStore(store => store.user.age);
  const [theme, setTheme] = useStore(store => store.settings.theme);

  return (
    <div>
      {/* getter 함수로 값 접근 */}
      <p>이름: {userName()}</p>
      <p>테마: {theme()}</p>

      {/* setter 함수로 값 업데이트 */}
      <button onClick={() => setUserName('Jane')}>이름 변경</button>
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
        테마 토글
      </button>
    </div>
  );
}`}
      />

      <h2>객체 다루기</h2>

      <p>전체 객체를 선택할 수도 있습니다:</p>

      <CodeBlock
        language="tsx"
        code={`import { useStore } from './store';

function UserCard() {
  // 전체 user 객체 선택
  const [user, setUser] = useStore(store => store.user);

  return (
    <div>
      {/* 중첩된 값 접근 */}
      <p>이름: {user().name}</p>
      <p>나이: {user().age}</p>

      {/* 전체 객체 교체 */}
      <button onClick={() => setUser({ name: 'Jane', age: 25 })}>
        사용자 업데이트
      </button>
    </div>
  );
}`}
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
import { connectSolid } from '@stateref/connect-solid';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectSolid(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}
      />

      <CodeBlock
        language="tsx"
        code={`import { useCounter, increment } from './store';

function Counter() {
  const [count] = useCounter(store => store.count);

  return (
    <button onClick={increment}>
      Count: {count()}
    </button>
  );
}`}
      />

      <h2>Solid의 반응형 프리미티브와 함께 사용</h2>

      <p>파생 값을 위해 Solid의 반응형 프리미티브와 결합합니다:</p>

      <CodeBlock
        language="tsx"
        code={`import { createMemo } from 'solid-js';
import { useStore } from './store';

function FullName() {
  const [firstName] = useStore(store => store.firstName);
  const [lastName] = useStore(store => store.lastName);

  // createMemo로 파생 값 생성
  const fullName = createMemo(() => \`\${firstName()} \${lastName()}\`);

  return <p>전체 이름: {fullName()}</p>;
}`}
      />

      <h2>입력 바인딩 패턴</h2>

      <p>Solid에서 입력 바인딩을 처리합니다:</p>

      <CodeBlock
        language="tsx"
        code={`import { useStore } from './store';

function Form() {
  const [name, setName] = useStore(store => store.name);
  const [email, setEmail] = useStore(store => store.email);

  return (
    <div>
      <input
        value={name()}
        onInput={(e) => setName(e.currentTarget.value)}
        placeholder="이름"
      />
      <input
        value={email()}
        onInput={(e) => setEmail(e.currentTarget.value)}
        type="email"
        placeholder="이메일"
      />

      <p>이름: {name()}</p>
      <p>이메일: {email()}</p>
    </div>
  );
}`}
      />

      <h2>TypeScript 팁</h2>

      <p>커넥터는 스토어의 타입을 유지합니다:</p>

      <CodeBlock
        language="typescript"
        code={`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectSolid(watch);

// TypeScript가 타입을 알고 있음
const [title, setTitle] = useTodo(store => store.title);
// title은 Accessor<string>, setTitle은 Setter<string>

const [done, setDone] = useTodo(store => store.done);
// done은 Accessor<boolean>, setDone은 Setter<boolean>`}
      />

      <h2>컴포넌트 조회</h2>

      <p>
        컴포넌트 코드의 서버 데이터에는 컴포넌트 본문에서{' '}
        <code>@stateref/connect-solid/sync</code>의 <code>createSyncQuery</code>
        를 부릅니다. 컴포넌트는 자기 owner가 살아 있는 동안 조회를 소유합니다.
        처음 선택할 때 불러오고, props의 key를 따라가며, 같은 key를 보는 다른
        컴포넌트와 진행 중인 READ를 공유하고, 그중 마지막이 정리된 뒤
        해제됩니다.
      </p>

      <CodeBlock
        language="tsx"
        code={`import { Show } from 'solid-js';
import { createSyncQuery } from '@stateref/connect-solid/sync';
import { client } from './client'; // createSyncClient(), 앱당 하나
import { readShip } from './api'; // (id, signal) => Promise<Ship>

export function ShipPanel(props: { id: number }) {
  const [ship, q] = createSyncQuery(client, () => {
    const id = props.id;
    return {
      queryKey: ['ship', id],
      queryFn: ({ signal }) => readShip(id, signal),
      staleTime: 30_000,
    };
  });
  const status = ship(ref => ref.status.value);
  const loaded = ship(ref => ref.loaded.value);
  const name = ship(ref => ref.data.name.value);

  const rename = (value: string) => {
    const handle = q.handle();
    if (handle?.status.value.loaded) handle.ref.name.value = value; // 로컬 편집
  };

  return (
    <Show when={status() !== 'pending'} fallback={<p>불러오는 중…</p>}>
      <Show when={loaded()} fallback={<p role="alert">우주선을 불러오지 못했습니다.</p>}>
        <input
          value={name() ?? ''}
          onInput={event => rename(event.currentTarget.value)}
        />
        <button onClick={() => void q.refetch().catch(() => {})}>새로고침</button>
        <button onClick={() => q.invalidate()}>다시 확인</button>
      </Show>
    </Show>
  );
}`}
      />

      <p>
        <code>ship(select)</code>는 조회의 읽기 전용 표시 상태(
        <code>status</code>, <code>fetchStatus</code>, <code>loaded</code>,{' '}
        <code>error</code>, <code>data</code>, <code>dirty</code>,{' '}
        <code>queryKey</code> 등)에서 <code>select</code>가 읽은 값을{' '}
        <code>Accessor&lt;V&gt;</code>로 돌려줍니다. 리프는 <code>select</code>{' '}
        안에서 <code>.value</code>로 읽습니다. 첫 선택이 조회를 붙이고, 모든
        선택이 그 조회를 공유합니다. <code>q</code>는 컴포넌트 수명 동안 같은
        객체입니다.
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

      <p>Solid에서는:</p>

      <ul>
        <li>
          props나 signal을 따라가려면 accessor를 넘깁니다. 새 옵션은 표시를 읽는
          계산이 돌기 전에 동기적으로 확정됩니다. 평범한 옵션 객체는 컴포넌트
          수명 동안 고정입니다.
        </li>
        <li>
          owner가 정리되면 매크로태스크 하나 뒤에 조회가 해제되므로, 라우트
          교체가 READ를 취소하거나 반복하지 않습니다.
        </li>
        <li>
          서버 렌더(<code>isServer</code>)는 구독하지도, 붙지도, READ하지도 않고
          읽기만 합니다. 요청마다 만든{' '}
          <code>createSyncClient({'{ ssr: true }'})</code>를 렌더 전에{' '}
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
        <code>connectSolidView</code>는{' '}
        <a href="#/ko/guide/sync-view">@stateref/sync</a>의 읽기 전용 조회
        view를 연결합니다. 컴포넌트 밖에서 소유하는 명시적 핸들, 곧 store나
        서비스가 <code>client.query(...)</code>로 열고 직접 로드·dispose하는
        조회에 씁니다. <code>connectSolid</code>와 같은 <code>Watch</code>{' '}
        모양을 받지만 setter는 내주지 않습니다. 표시는 선택된 값일 수도, 서버에
        존재한 적 없는 placeholder일 수도 있기 때문입니다.
      </p>

      <CodeBlock
        language="tsx"
        code={`function CityDisplay() {
  const view = connectSolidView(live.watchDisplay);
  const city = view(ref => ref.data.value);
  return <span>{city() ?? '-'}</span>;
}`}
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
          setter는 스토어에 직접, <strong>즉시</strong> 씁니다. 함수형 갱신도
          됩니다:{' '}
          <code>setUser(prev =&gt; ({"{ ...prev, name: 'Jane' }"}))</code>.
        </li>
        <li>
          <strong>accessor는 객체·배열의 얼린 복사본을 돌려줍니다.</strong>{' '}
          <code>user().name = 'x'</code>나 <code>prev</code>를 바꿔 그대로
          돌려주는 함수형 갱신은 TypeError를 내고 스토어는 바뀌지 않습니다 — 둘
          다 커넥터를 지나가지 않기 때문입니다. setter에 새 값을 돌려주세요.
        </li>
        <li>
          서버 렌더는 <code>isServer</code>로 판정하고 아무것도 구독하지
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
        <li>
          <a href="#/ko/guide/svelte">Svelte</a> - Svelte 연동
        </li>
      </ul>
    </div>
  );
});
