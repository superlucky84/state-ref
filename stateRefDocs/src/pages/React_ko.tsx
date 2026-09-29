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

      <h2>읽기 전용 조회 view</h2>

      <p>
        <code>connectReactView</code>는{' '}
        <a href="#/ko/guide/sync-view">@stateref/sync</a>의 읽기 전용 조회
        view를 연결합니다. <code>connectReact</code>와 같은 <code>Watch</code>{' '}
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
