import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const CreateStoreKo = mount(() => {
  return () => (
    <div>
      <h1>createStore</h1>

      <p>
        <code>createStore</code> 함수는 StateRef에서 반응형 상태 스토어를 생성하는 주요 방법입니다.
        초기값을 받아서 상태에 접근하고 구독할 수 있는 <code>watch</code> 함수를 반환합니다.
      </p>

      <h2>기본 사용법</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

// 초기값으로 스토어 생성
const watch = createStore({ count: 0, name: 'StateRef' });`}
      />

      <h2>문법</h2>

      <CodeBlock
        language="typescript"
        code={`createStore<T>(initialValue: T): Watch<T>`}
      />

      <h3>매개변수</h3>

      <ul>
        <li>
          <code>initialValue</code> - 초기 상태 값. 객체, 배열, 원시 타입 등 모든 타입 가능
        </li>
      </ul>

      <h3>반환값</h3>

      <p>
        <code>Watch</code> 함수를 반환하며, 두 가지 용도로 사용됩니다:
      </p>

      <ul>
        <li>
          <strong>인자 없이 호출</strong>: 값을 읽고 쓰기 위한 <code>StateRefStore</code> 참조 반환
        </li>
        <li>
          <strong>콜백과 함께 호출</strong>: 변경 사항을 구독하고 추적되는 <code>StateRefStore</code> 참조 반환
        </li>
      </ul>

      <h2>객체 스토어 생성</h2>

      <p>
        객체 스토어가 가장 일반적인 사용 사례입니다. 복잡한 중첩 상태를 관리할 수 있습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: {
    name: 'John',
    age: 30,
    settings: {
      theme: 'dark',
      notifications: true
    }
  },
  todos: [
    { id: 1, text: 'StateRef 배우기', done: false },
    { id: 2, text: '앱 만들기', done: false }
  ]
});

// 중첩된 값 접근
const store = watch();
console.log(store.user.name.value); // 'John'
console.log(store.todos[0].text.value); // 'StateRef 배우기'

// 중첩된 값 업데이트
store.user.settings.theme.value = 'light';
store.todos[0].done.value = true;`}
      />

      <h2>원시 타입 스토어 생성</h2>

      <p>
        StateRef는 숫자, 문자열, 불리언 같은 원시 타입과도 완벽하게 작동합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// 숫자 스토어
const countWatch = createStore(0);
const count = countWatch();
count.value = 10;

// 문자열 스토어
const nameWatch = createStore('StateRef');
const name = nameWatch();
name.value = '업데이트된 이름';

// 불리언 스토어
const toggleWatch = createStore(false);
const toggle = toggleWatch();
toggle.value = true;`}
      />

      <h2>TypeScript 타입 추론</h2>

      <p>
        StateRef는 자동 타입 추론과 함께 완전한 TypeScript 지원을 제공합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// 초기값으로부터 타입 추론
const watch = createStore({ count: 0 });
// watch: Watch<{ count: number }>

// 명시적 타입 지정
const watch = createStore<{ count: number }>({ count: 0 });

// 제네릭 타입
interface User {
  id: number;
  name: string;
  email: string;
}

const userWatch = createStore<User>({
  id: 1,
  name: 'John',
  email: 'john@example.com'
});`}
      />

      <h2>반환된 Watch 함수 사용하기</h2>

      <p>
        <code>createStore</code>가 반환하는 <code>watch</code> 함수가 스토어의 핵심 인터페이스입니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });

// 구독 없이 참조 얻기
const store = watch();
store.count.value = 10;

// 변경 사항 구독
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('첫 실행?', isFirst);
});

// 두 형태를 함께 사용 가능
const trackedStore = watch((store) => {
  console.log('Count 변경됨:', store.count.value);
});

// 이 업데이트는 구독을 트리거합니다
trackedStore.count.value = 20;`}
      />

      <h2>자동 동기화 모드</h2>

      <p>
        기본적으로 <code>createStore</code>는 <strong>자동 동기화</strong> 모드로 동작하며,
        변경 사항이 즉시 구독을 트리거합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });

watch((store) => {
  console.log('Count:', store.count.value);
});

const store = watch();
store.count.value = 1; // ✓ 즉시 구독 트리거
store.count.value = 2; // ✓ 즉시 구독 트리거`}
      />

      <p>
        업데이트 전파 시점을 수동으로 제어하려면 <a href="#/ko/guide/manual-sync">수동 동기화 (Flux)</a>를 참고하세요.
      </p>

      <h2>배열 다루기</h2>

      <p>
        배열은 copy-on-write 의미론과 함께 완전히 지원됩니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  items: [1, 2, 3, 4, 5]
});

const store = watch();

// 배열 요소 접근
console.log(store.items[0].value); // 1

// 배열 요소 업데이트
store.items[0].value = 10;

// 전체 배열 교체 (새 참조 생성)
store.items.value = [10, 20, 30];

// 배열 메서드는 .value에서 작동
store.items.value.push(40);
store.items.value = [...store.items.value]; // 업데이트 트리거`}
      />

      <h2>모범 사례</h2>

      <ul>
        <li>
          <strong>스토어를 집중되게 유지</strong> - 애플리케이션의 다른 도메인에 대해 별도의 스토어 생성
        </li>
        <li>
          <strong>TypeScript 사용</strong> - 더 나은 IDE 지원과 타입 안전성을 위해 스토어에 타입 지정
        </li>
        <li>
          <strong>완전한 상태로 초기화</strong> - 적절한 타입 추론을 위해 초기값에 모든 속성 제공
        </li>
        <li>
          <strong>렌더 함수에서 스토어 생성 금지</strong> - 모듈 레벨이나 훅에서 스토어 생성
        </li>
      </ul>

      <h2>일반적인 패턴</h2>

      <h3>단일 스토어 모듈</h3>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStore } from 'state-ref';

export const appWatch = createStore({
  user: null as User | null,
  theme: 'light' as 'light' | 'dark',
  isLoading: false
});`}
      />

      <h3>여러 스토어</h3>

      <CodeBlock
        language="typescript"
        code={`// stores/user.ts
export const userWatch = createStore<User | null>(null);

// stores/settings.ts
export const settingsWatch = createStore({
  theme: 'light',
  language: 'ko'
});

// stores/todos.ts
export const todosWatch = createStore<Todo[]>([]);`}
      />

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/watch">Watch 함수</a> - watch 함수 이해하기
        </li>
        <li>
          <a href="#/ko/guide/state-ref-store">StateRefStore</a> - 스토어 참조 다루기
        </li>
        <li>
          <a href="#/ko/guide/manual-sync">수동 동기화</a> - Flux 패턴을 위한 createStoreManualSync
        </li>
      </ul>
    </div>
  );
});
