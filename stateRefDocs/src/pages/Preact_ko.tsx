import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const PreactKo = mount(() => {
  return () => (
    <div>
      <h1>Preact 연동</h1>

      <p>
        <code>@stateref/connect-preact</code>를 사용하여 StateRef 스토어를 Preact에 연결합니다.
        변경 사항이 있을 때 자동으로 리렌더링되는 훅을 제공합니다.
      </p>

      <h2>설치</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-preact`}
      />

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
        <li>
          훅은 마운트 시 구독하고 추적된 값이 변경되면 리렌더링합니다
        </li>
        <li>
          업데이트는 렌더링에서 <code>.value</code>를 읽는 것으로 구동됩니다
        </li>
        <li>
          언마운트 시 자동으로 정리됩니다 (AbortController)
        </li>
      </ul>

      <h2>Preact vs React</h2>

      <p>
        Preact 커넥터는 React 버전과 거의 동일합니다. 주요 차이점은
        React의 hooks 대신 <code>preact/hooks</code>를 사용한다는 것입니다:
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
        <code>createStoreManualSync</code>를 사용하는 경우 쓰기는 액션에서 처리하고
        업데이트 후 <code>sync()</code>를 호출합니다.
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
        훅은 <code>createStore</code>의 타입을 유지하므로
        컴포넌트에서 강력한 타입의 참조를 얻을 수 있습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectPreact(watch);

// useTodo()는 StateRefStore<Todo>를 반환`}
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
          <a href="#/ko/guide/react">React</a> - React 연동 (거의 동일한 API)
        </li>
      </ul>
    </div>
  );
});
