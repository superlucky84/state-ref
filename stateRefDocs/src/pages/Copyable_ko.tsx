import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const CopyableKo = mount(() => {
  return () => (
    <div>
      <h1>copyable</h1>

      <p>
        <code>copyable</code>는 프로퍼티 접근으로 경로를 구성하고,
        <code>writeCopy</code>로 copy-on-write 업데이트를 수행해 새로운
        루트 객체를 반환합니다. StateRef 스토어 밖에서 불변 업데이트가
        필요할 때 유용합니다.
      </p>

      <h2>기본 사용법</h2>

      <CodeBlock
        language="typescript"
        code={`import { copyable } from 'state-ref';

type State = {
  user: { name: string; age: number };
  settings: { theme: string };
};

const state: State = {
  user: { name: 'Lee', age: 20 },
  settings: { theme: 'light' }
};

const c = copyable(state);

// 프로퍼티 접근으로 경로 구성 후 write
const next = c.user.name.writeCopy('Min');

console.log(state.user.name); // 'Lee'
console.log(next.user.name);  // 'Min'`}
      />

      <h2>깊은 업데이트 (배열 포함)</h2>

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

const c = copyable(state);
const next = c.todos[1].done.writeCopy(true);

console.log(next.todos[1].done); // true`}
      />

      <h2>읽기 전용 프록시</h2>

      <p>
        직접 할당은 허용되지 않습니다. 변경은 반드시
        <code>writeCopy</code>로 수행하세요.
      </p>

      <CodeBlock
        language="typescript"
        code={`const state = { count: 0 };
const c = copyable(state);

// ✗ 불가
c.count = 1; // Error: Property modification is not supported

// ✓ 가능
const next = c.count.writeCopy(1);`}
      />

      <h2>Copy-On-Write 동작</h2>

      <p>
        업데이트 경로만 얕은 복사가 일어나며, 나머지 브랜치는 동일한
        참조를 유지합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const state = {
  user: { name: 'Lee' },
  settings: { theme: 'light' }
};

const c = copyable(state);
const next = c.user.name.writeCopy('Min');

console.log(next !== state); // true
console.log(next.user !== state.user); // true
console.log(next.settings === state.settings); // true`}
      />

      <h2>중요: 최신 루트 사용</h2>

      <p>
        <code>copyable</code>은 전달한 루트 객체를 기준으로 업데이트합니다.
        새 루트가 만들어졌다면 다시 <code>copyable</code>을 호출하세요.
      </p>

      <CodeBlock
        language="typescript"
        code={`let state = { count: 0 };

let c = copyable(state);
state = c.count.writeCopy(1);

// 최신 루트로 재생성
c = copyable(state);
state = c.count.writeCopy(2);`}
      />

      <h2>API 요약</h2>

      <CodeBlock
        language="typescript"
        code={`copyable<T>(orig: T): Copyable<T>

type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(v: V) => Root;
};`}
      />

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/lens">Lens 패턴</a> - 경로 기반 불변 업데이트
        </li>
        <li>
          <a href="#/ko/guide/clone-deep">cloneDeep</a> - 전체 깊은 복사
        </li>
        <li>
          <a href="#/ko/guide/state-ref-store">StateRefStore</a> - 스토어 프록시 업데이트
        </li>
      </ul>
    </div>
  );
});
