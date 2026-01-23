import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const LensKo = mount(() => {
  return () => (
    <div>
      <h1>Lens 패턴</h1>

      <p>
        <code>lens</code> 헬퍼는 데이터 경로를 설명해 불변 업데이트를
        수행합니다. StateRef 내부도 동일한 렌즈 패턴을 사용하며, 직접
        사용하면 커스텀 불변 업데이트를 만들 수 있습니다.
      </p>

      <h2>기본 사용법</h2>

      <CodeBlock
        language="typescript"
        code={`import { lens } from 'state-ref';

type State = {
  user: { name: string; age: number };
  settings: { theme: string };
};

const state: State = {
  user: { name: 'Lee', age: 20 },
  settings: { theme: 'light' }
};

const nameLens = lens<State>().chain('user').chain('name');

// 읽기
const name = nameLens.get(state); // 'Lee'

// 업데이트 (새 루트 객체 반환)
const next = nameLens.set('Min')(state);
console.log(next.user.name); // 'Min'`}
      />

      <h2>깊은 경로 체이닝</h2>

      <p>
        <code>chain</code>은 객체 키와 배열 인덱스를 모두 사용할 수 있습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type State = {
  todos: { title: string; done: boolean }[];
};

const state: State = {
  todos: [
    { title: 'Write docs', done: false },
    { title: 'Ship', done: false }
  ]
};

const firstTitle = lens<State>().chain('todos').chain(0).chain('title');
const next = firstTitle.set('Review docs')(state);

console.log(next.todos[0].title); // 'Review docs'`}
      />

      <h2>재사용 가능한 렌즈</h2>

      <p>
        기본 렌즈에서 파생하여 여러 경로를 쉽게 구성할 수 있습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type State = { user: { name: string; email: string } };

const userLens = lens<State>().chain('user');
const userNameLens = userLens.chain('name');
const userEmailLens = userLens.chain('email');`}
      />

      <h2>불변성 (Copy-On-Write)</h2>

      <p>
        <code>set()</code>은 경로에 해당하는 부분만 얕은 복사를 수행하며,
        나머지 경로는 동일한 참조를 유지합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type State = {
  user: { name: string };
  settings: { theme: string };
};

const state: State = {
  user: { name: 'Lee' },
  settings: { theme: 'light' }
};

const nameLens = lens<State>().chain('user').chain('name');
const next = nameLens.set('Min')(state);

console.log(next !== state); // true
console.log(next.user !== state.user); // true
console.log(next.settings === state.settings); // true`}
      />

      <h2>TypeScript 지원</h2>

      <p>
        <code>lens</code>는 <code>chain</code>을 통해 타입 정보를 유지하므로
        <code>get</code>/<code>set</code>이 안전하게 추론됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type State = { user: { name: string; age: number } };

const nameLens = lens<State>().chain('user').chain('name');

const name: string = nameLens.get({ user: { name: 'Lee', age: 20 } });
const next = nameLens.set('Min')({ user: { name: 'Lee', age: 20 } });`}
      />

      <h2>사용 시점</h2>

      <ul>
        <li>
          <strong>커스텀 불변 업데이트</strong>가 필요할 때
        </li>
        <li>
          <strong>통합 코드</strong>에서 예측 가능한 깊은 업데이트가 필요할 때
        </li>
        <li>
          <strong>공통 업데이트 로직</strong>을 재사용하고 싶을 때
        </li>
      </ul>

      <h2>API 요약</h2>

      <CodeBlock
        language="typescript"
        code={`lens<T>(sceneList?: (string | number | symbol)[]): Lens<T, T>

class Lens<Root, Focus> {
  chain(prop: string | number | symbol): Lens<Root, any>;
  get(target: Root): Focus;
  set(value: Focus): (target: Root) => Root;
}`}
      />

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/create-store">createStore</a> - 스토어 생성
        </li>
        <li>
          <a href="#/ko/guide/state-ref-store">StateRefStore</a> - 프록시 참조
        </li>
        <li>
          <a href="#/ko/guide/computed">createComputed</a> - 파생 값
        </li>
      </ul>
    </div>
  );
});
