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
        <li>
          훅은 마운트 시 구독하고, 추적된 값이 바뀌면 리렌더링됩니다
        </li>
        <li>
          렌더에서 <code>.value</code>를 읽는 것이 추적의 기준입니다
        </li>
        <li>
          언마운트 시 자동으로 정리됩니다 (AbortController)
        </li>
      </ul>

      <h2>수동 동기화 + 액션</h2>

      <p>
        <code>createStoreManualSync</code>를 사용할 때는 액션에서 업데이트하고
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
        <code>createStore</code>의 타입이 훅으로 그대로 전달되므로
        컴포넌트에서 타입이 안전하게 유지됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectReact(watch);

// useTodo()는 StateRefStore<Todo> 반환`}
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
      </ul>
    </div>
  );
});
