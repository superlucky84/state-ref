import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const StateRefStoreKo = mount(() => {
  return () => (
    <div>
      <h1>StateRefStore</h1>

      <p>
        <code>StateRefStore</code>는 <code>watch()</code> 함수가 반환하는 프록시 참조 타입입니다.
        상태를 Proxy로 감싸서 반응형 추적을 가능하게 하며 <code>.value</code> 프로퍼티를 통해
        값에 접근할 수 있도록 합니다.
      </p>

      <h2>.value 프로퍼티</h2>

      <p>
        StateRef의 모든 상태 접근은 <code>.value</code> 프로퍼티를 통해 이루어집니다.
        이것은 상태를 읽고 쓰는 기본 인터페이스입니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });
const store = watch();

// .value를 통해 값 읽기
const currentCount = store.count.value;      // 0
const currentName = store.name.value;        // 'StateRef'

// .value를 통해 값 쓰기
store.count.value = 10;
store.name.value = '업데이트됨';

console.log(store.count.value);  // 10`}
      />

      <h2>프록시 기반 반응성</h2>

      <p>
        StateRefStore는 JavaScript Proxy를 사용하여 프로퍼티 접근을 가로챕니다.
        프로퍼티에 접근하면 중첩된 값을 감싼 또 다른 프록시를 얻게 됩니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: {
    profile: {
      name: 'John',
      age: 30
    }
  }
});

const store = watch();

// 각 프로퍼티 접근은 프록시를 반환합니다
console.log(store);              // 전체 상태를 감싼 Proxy
console.log(store.user);         // user 객체를 감싼 Proxy
console.log(store.user.profile); // profile 객체를 감싼 Proxy

// .value만 실제 값을 줍니다
console.log(store.user.profile.name.value);  // 'John' (실제 문자열)`}
      />

      <h2>깊은 중첩 접근</h2>

      <p>
        StateRefStore는 임의로 깊은 중첩을 지원합니다. 각 레벨은 새 프록시를 반환하여
        자연스러운 체인 프로퍼티 접근을 가능하게 합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  company: {
    departments: {
      engineering: {
        teams: {
          frontend: {
            members: ['Alice', 'Bob']
          }
        }
      }
    }
  }
});

const store = watch();

// 깊은 중첩 읽기
const members = store.company.departments.engineering.teams.frontend.members.value;
console.log(members);  // ['Alice', 'Bob']

// 깊은 중첩 쓰기
store.company.departments.engineering.teams.frontend.members.value = [
  'Alice', 'Bob', 'Charlie'
];`}
      />

      <h2>객체 다루기</h2>

      <p>
        객체 프로퍼티로 작업할 때 개별 필드를 업데이트하거나 전체 객체를 교체할 수 있습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: {
    name: 'John',
    age: 30,
    email: 'john@example.com'
  }
});

const store = watch();

// 개별 프로퍼티 업데이트
store.user.name.value = 'Jane';
store.user.age.value = 31;

// 전체 객체 교체
store.user.value = {
  name: 'Bob',
  age: 25,
  email: 'bob@example.com'
};`}
      />

      <h2>배열 다루기</h2>

      <p>
        배열은 StateRefStore와 원활하게 작동하며, 인덱스 접근과 배열 교체를 모두 지원합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  todos: [
    { id: 1, text: 'StateRef 배우기', done: false },
    { id: 2, text: '앱 만들기', done: false }
  ]
});

const store = watch();

// 인덱스로 배열 요소 접근
console.log(store.todos[0].text.value);  // 'StateRef 배우기'

// 배열 요소 프로퍼티 업데이트
store.todos[0].done.value = true;

// 전체 배열 요소 업데이트
store.todos[1].value = { id: 2, text: '멋진 앱 만들기', done: true };

// 전체 배열 교체 (새 참조 생성)
store.todos.value = [
  { id: 1, text: '새 작업', done: false }
];

// 배열 메서드는 .value에서 작동
const currentTodos = store.todos.value;
currentTodos.push({ id: 3, text: '배포', done: false });
store.todos.value = [...currentTodos];  // 업데이트 트리거`}
      />

      <h2>Copy-on-Write 의미론</h2>

      <p>
        StateRef는 불변성을 유지하기 위해 copy-on-write를 사용합니다. 중첩된 프로퍼티를 업데이트하면
        해당 프로퍼티로의 경로만 복사되고 변경되지 않은 하위 트리는 공유됩니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  a: { b: { c: 1 }, d: 2 },
  e: 3
});

const store = watch();

// 원본 참조 저장
const originalA = store.a.value;
const originalB = store.a.b.value;

// 깊게 중첩된 값 업데이트
store.a.b.c.value = 10;

// 변경 경로는 새 참조를 가짐
console.log(store.a.value === originalA);      // false (새 참조)
console.log(store.a.b.value === originalB);    // false (새 참조)

// 변경되지 않은 브랜치는 참조 유지
const originalE = store.e.value;
console.log(store.e.value === originalE);      // true (같은 참조)`}
      />

      <h2>원시 타입</h2>

      <p>
        StateRefStore는 원시 타입(number, string, boolean)과도 작동합니다.
        원시 타입의 경우 스토어 자체가 <code>.value</code> 프로퍼티를 가집니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// 숫자 스토어
const countWatch = createStore(0);
const count = countWatch();
console.log(count.value);  // 0
count.value = 10;
console.log(count.value);  // 10

// 문자열 스토어
const nameWatch = createStore('StateRef');
const name = nameWatch();
console.log(name.value);   // 'StateRef'
name.value = '업데이트됨';

// 불리언 스토어
const toggleWatch = createStore(false);
const toggle = toggleWatch();
console.log(toggle.value);  // false
toggle.value = true;`}
      />

      <h2>TypeScript 타입 안전성</h2>

      <p>
        StateRefStore는 TypeScript와 완전히 타입이 지정되어 자동 완성과 타입 체크를 제공합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`interface User {
  id: number;
  name: string;
  email: string;
}

const watch = createStore<User>({
  id: 1,
  name: 'John',
  email: 'john@example.com'
});

const store = watch();

// TypeScript가 구조를 알고 있음
store.name.value = 'Jane';         // ✓ OK
store.email.value = 'jane@...';    // ✓ OK

store.age.value = 30;               // ✗ 에러: 프로퍼티 'age'가 존재하지 않음
store.name.value = 123;             // ✗ 에러: 타입 'number'는 'string'에 할당할 수 없음

// 타입 추론이 작동
const userName: string = store.name.value;  // ✓ string으로 올바르게 추론
const userId: number = store.id.value;      // ✓ number로 올바르게 추론`}
      />

      <h2>.value 없이 읽기</h2>

      <p>
        <code>.value</code> 없이 프로퍼티에 접근하면 실제 값이 아닌 프록시 자체를 얻게 됩니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 10 });
const store = watch();

// .value 없이 - 프록시 반환
const countProxy = store.count;
console.log(countProxy);        // Proxy 객체

// .value와 함께 - 실제 값 반환
const countValue = store.count.value;
console.log(countValue);        // 10

// 흔한 실수
if (store.count === 10) {       // ✗ 잘못됨: 프록시를 숫자와 비교
  // 예상대로 작동하지 않음
}

// 올바른 방법
if (store.count.value === 10) { // ✓ 올바름: 값을 숫자와 비교
  // 작동함
}`}
      />

      <h2>참조 동등성</h2>

      <p>
        StateRefStore는 변경되지 않은 객체에 대해 참조 동등성을 유지하며,
        이는 UI 프레임워크의 최적화에 중요합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: { name: 'John' },
  settings: { theme: 'dark' }
});

const store = watch();

// 참조 저장
const userRef1 = store.user.value;
const settingsRef1 = store.settings.value;

// settings 업데이트
store.settings.theme.value = 'light';

// 참조 다시 얻기
const userRef2 = store.user.value;
const settingsRef2 = store.settings.value;

// user 변경 없음 - 같은 참조
console.log(userRef1 === userRef2);      // true

// settings 변경됨 - 새 참조
console.log(settingsRef1 === settingsRef2);  // false`}
      />

      <h2>일반적인 패턴</h2>

      <h3>조건부 업데이트</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0, max: 10 });
const store = watch();

const increment = () => {
  if (store.count.value < store.max.value) {
    store.count.value += 1;
  }
};`}
      />

      <h3>배치 업데이트</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: { name: '', email: '', age: 0 }
});
const store = watch();

// 개별 업데이트 (각각 구독 트리거)
store.user.name.value = 'John';
store.user.email.value = 'john@example.com';
store.user.age.value = 30;

// 더 나음: 단일 업데이트 (한 번만 구독 트리거)
store.user.value = {
  name: 'John',
  email: 'john@example.com',
  age: 30
};`}
      />

      <h3>계산을 위한 읽기</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  width: 10,
  height: 20
});
const store = watch();

// 파생 값 계산
const area = store.width.value * store.height.value;
console.log(area);  // 200

// 업데이트 및 재계산
store.width.value = 15;
const newArea = store.width.value * store.height.value;
console.log(newArea);  // 300`}
      />

      <h2>성능 고려사항</h2>

      <ul>
        <li>
          <strong>프록시 오버헤드는 최소</strong> - 최신 JavaScript 엔진은 프록시 접근을 잘 최적화함
        </li>
        <li>
          <strong>Copy-on-write는 효율적</strong> - 변경된 경로만 복사되고 변경되지 않은 데이터는 공유됨
        </li>
        <li>
          <strong>참조 동등성이 최적화를 가능하게 함</strong> - UI 프레임워크가 변경되지 않은 하위 트리의 렌더링을 건너뛸 수 있음
        </li>
        <li>
          <strong>가능하면 배치 업데이트</strong> - 개별 프로퍼티 대신 전체 객체를 업데이트하여 구독 트리거 줄이기
        </li>
      </ul>

      <h2>모범 사례</h2>

      <ul>
        <li>
          <strong>실제 값에는 항상 .value 사용</strong> - .value 없는 프로퍼티 접근은 프록시를 반환한다는 것을 기억하기
        </li>
        <li>
          <strong>불변 업데이트 선호</strong> - 가능하면 객체/배열을 변경하지 말고 교체하기
        </li>
        <li>
          <strong>참조 동등성 활용</strong> - 최적화를 위해 엄격한 동등성 체크 사용
        </li>
        <li>
          <strong>스토어에 타입 지정</strong> - 더 나은 타입 안전성과 자동 완성을 위해 TypeScript 인터페이스 사용
        </li>
        <li>
          <strong>관련 업데이트 배치</strong> - 구독 트리거를 최소화하기 위해 전체 객체 업데이트
        </li>
      </ul>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/create-store">createStore</a> - StateRefStore 참조를 반환하는 스토어 생성
        </li>
        <li>
          <a href="#/ko/guide/watch">Watch 함수</a> - watch를 통해 StateRefStore 참조 얻기
        </li>
        <li>
          <a href="#/ko/guide/references">참조 이해하기</a> - StateRefStore 참조가 추적과 어떻게 작동하는지
        </li>
        <li>
          <a href="#/ko/guide/primitives">원시 타입</a> - 원시 타입 스토어 다루기
        </li>
      </ul>
    </div>
  );
});
