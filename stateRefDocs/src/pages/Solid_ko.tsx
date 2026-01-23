import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SolidKo = mount(() => {
  return () => (
    <div>
      <h1>Solid 연동</h1>

      <p>
        <code>@stateref/connect-solid</code>를 사용하여 StateRef 스토어를 Solid.js에 연결합니다.
        Solid의 세밀한 반응성과 통합되는 Solid <code>Signal</code> 쌍을 반환합니다.
      </p>

      <h2>설치</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-solid`}
      />

      <h2>기본 사용법</h2>

      <p>
        Solid 커넥터는 스토어에서 추적할 부분을 선택하기 위해 콜백 패턴을 사용합니다:
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

      <p>
        Solid 커넥터는 StateRef와 Solid의 시그널 시스템을 연결합니다:
      </p>

      <ul>
        <li>
          <code>connectSolid(watch)</code>는 셀렉터 콜백을 받는 함수를 반환합니다
        </li>
        <li>
          셀렉터는 StateRefStore를 받아서 추적할 특정 프로퍼티를 반환합니다
        </li>
        <li>
          Solid <code>Signal</code> 쌍을 반환합니다: <code>[getter, setter]</code>
        </li>
        <li>
          getter 함수를 호출하여 값을 읽습니다: <code>name()</code>
        </li>
        <li>
          setter 함수를 사용하여 값을 업데이트합니다: <code>setName('Jane')</code>
        </li>
        <li>
          양방향 바인딩: Solid 변경이 StateRef로, 그리고 그 반대로도 동기화됩니다
        </li>
        <li>
          <code>onCleanup</code>을 통해 자동으로 정리됩니다
        </li>
      </ul>

      <h2>프로퍼티 선택하기</h2>

      <p>
        셀렉터 콜백을 사용하여 특정 프로퍼티를 선택합니다:
      </p>

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

      <p>
        전체 객체를 선택할 수도 있습니다:
      </p>

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
        <code>createStoreManualSync</code>를 사용하면 쓰기는 액션에서 처리합니다:
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

      <p>
        파생 값을 위해 Solid의 반응형 프리미티브와 결합합니다:
      </p>

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

      <p>
        Solid에서 입력 바인딩을 처리합니다:
      </p>

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

      <p>
        커넥터는 스토어의 타입을 유지합니다:
      </p>

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

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/create-store">createStore</a> - 스토어 생성
        </li>
        <li>
          <a href="#/ko/guide/manual-sync">수동 동기화 (Flux)</a> - 액션 기반 업데이트
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
