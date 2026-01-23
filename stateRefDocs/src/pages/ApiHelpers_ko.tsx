import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ApiHelpersKo = mount(() => {
  return () => (
    <div>
      <h1>Helper API</h1>

      <p>
        이 페이지는 <code>state-ref</code>에서 내보내는 헬퍼 함수들을 문서화합니다.
        이 유틸리티들은 불변 업데이트와 깊은 복사를 지원합니다.
      </p>

      <h2>lens</h2>

      <p>
        중첩된 데이터 구조를 탐색하고 불변하게 업데이트하기 위한 렌즈를 생성합니다.
        렌즈는 깊게 중첩된 프로퍼티에 접근하고 수정하는 함수형 접근 방식을 제공합니다.
      </p>

      <h3>시그니처</h3>

      <CodeBlock
        language="typescript"
        code={`function lens<T extends object>(
  sceneList?: (string | number | symbol)[]
): Lens<T, T>`}
      />

      <h3>매개변수</h3>

      <ul>
        <li>
          <code>sceneList</code> (선택) - 렌즈의 초기 경로 배열. 기본값은 빈 배열.
        </li>
      </ul>

      <h3>반환값</h3>

      <p>
        다음 메서드를 가진 <code>Lens</code> 인스턴스를 반환합니다:
      </p>

      <h3>Lens 클래스</h3>

      <CodeBlock
        language="typescript"
        code={`class Lens<Root extends object, Focus = Root> {
  // 중첩된 프로퍼티로 탐색
  chain<K extends keyof Focus>(prop: K): Lens<Root, Focus[K]>

  // 객체에서 포커스된 값 가져오기
  get(targetObject: Root): Focus

  // 불변 업데이트 함수 생성
  set(value: Focus): (targetObject: Root) => Root
}`}
      />

      <h3>메서드</h3>

      <table>
        <thead>
          <tr>
            <th>메서드</th>
            <th>설명</th>
            <th>반환값</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>chain(prop)</code></td>
            <td>중첩된 프로퍼티로 탐색</td>
            <td>해당 프로퍼티에 포커스된 새 <code>Lens</code></td>
          </tr>
          <tr>
            <td><code>get(obj)</code></td>
            <td>포커스된 값 추출</td>
            <td>포커스된 경로의 값</td>
          </tr>
          <tr>
            <td><code>set(value)</code></td>
            <td>업데이트 함수 생성</td>
            <td>업데이트가 적용된 새 객체를 반환하는 함수</td>
          </tr>
        </tbody>
      </table>

      <h3>예제</h3>

      <CodeBlock
        language="typescript"
        code={`import { lens } from 'state-ref';

interface State {
  user: {
    profile: {
      name: string;
      age: number;
    };
    settings: {
      theme: string;
    };
  };
}

const state: State = {
  user: {
    profile: { name: 'John', age: 30 },
    settings: { theme: 'dark' }
  }
};

// 렌즈를 생성하고 중첩된 프로퍼티로 탐색
const nameLens = lens<State>().chain('user').chain('profile').chain('name');

// 값 가져오기
console.log(nameLens.get(state));  // 'John'

// 값 설정 (새 객체 반환, 원본 변경 없음)
const newState = nameLens.set('Jane')(state);
console.log(newState.user.profile.name);  // 'Jane'
console.log(state.user.profile.name);     // 'John' (변경 없음)

// 배열에서도 작동
interface ListState {
  items: { id: number; name: string }[];
}

const listState: ListState = {
  items: [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ]
};

const firstItemNameLens = lens<ListState>()
  .chain('items')
  .chain(0)
  .chain('name');

console.log(firstItemNameLens.get(listState));  // 'Item 1'`}
      />

      <h2>copyable</h2>

      <p>
        객체를 감싸서 불변 업데이트를 위한 편리한 <code>writeCopy</code> 메서드를 제공합니다.
        렌즈 탐색과 플루언트 API를 결합합니다.
      </p>

      <h3>시그니처</h3>

      <CodeBlock
        language="typescript"
        code={`function copyable<T extends { [key: string | symbol]: unknown }>(
  origObj: T,
  lensInit?: Lens<T, any>
): Copyable<T>

type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(value: V) => Root;
}`}
      />

      <h3>매개변수</h3>

      <ul>
        <li>
          <code>origObj: T</code> - 감쌀 객체
        </li>
        <li>
          <code>lensInit</code> (선택) - 래퍼의 초기 렌즈
        </li>
      </ul>

      <h3>반환값</h3>

      <p>
        다음을 허용하는 <code>Copyable</code> 프록시를 반환합니다:
      </p>

      <ul>
        <li>프로퍼티 탐색 (일반 객체 접근처럼)</li>
        <li>불변 업데이트를 생성하는 <code>writeCopy(value)</code> 메서드</li>
      </ul>

      <h3>예제</h3>

      <CodeBlock
        language="typescript"
        code={`import { copyable } from 'state-ref';

const state = {
  user: {
    name: 'John',
    profile: {
      age: 30,
      city: 'Seoul'
    }
  }
};

// 탐색하고 불변하게 업데이트
const newState = copyable(state).user.profile.age.writeCopy(31);

console.log(newState.user.profile.age);  // 31
console.log(state.user.profile.age);     // 30 (변경 없음)

// 여러 번 업데이트
const state2 = copyable(newState).user.name.writeCopy('Jane');
console.log(state2.user.name);           // 'Jane'
console.log(state2.user.profile.age);    // 31

// 직접 프로퍼티 할당은 에러 발생
try {
  copyable(state).user.name = 'Jane';  // Error!
} catch (e) {
  console.log(e.message);
  // "Property modification is not supported on a copyable object..."
}`}
      />

      <h3>StateRef와 함께 사용</h3>

      <CodeBlock
        language="typescript"
        code={`import { createStore, copyable } from 'state-ref';

const watch = createStore({
  todos: [
    { id: 1, text: 'Learn StateRef', done: false },
    { id: 2, text: 'Build app', done: false }
  ]
});

const ref = watch();

// 중첩된 배열 항목을 불변하게 업데이트
ref.todos.value = copyable(ref.todos.value)[0].done.writeCopy(true);

console.log(ref.todos.value[0].done);  // true`}
      />

      <h2>cloneDeep</h2>

      <p>
        값의 깊은 복사본을 생성합니다. 객체와 배열을 재귀적으로 복제합니다.
      </p>

      <h3>시그니처</h3>

      <CodeBlock
        language="typescript"
        code={`function cloneDeep<T>(value: T): T`}
      />

      <h3>매개변수</h3>

      <ul>
        <li>
          <code>value: T</code> - 복제할 값
        </li>
      </ul>

      <h3>반환값</h3>

      <p>
        입력 값의 깊은 복사본을 반환합니다. 원시 타입은 그대로 반환합니다.
        객체와 배열은 재귀적으로 복제된 내용으로 새 인스턴스를 생성합니다.
      </p>

      <h3>동작</h3>

      <table>
        <thead>
          <tr>
            <th>입력 타입</th>
            <th>동작</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>null</code> / <code>undefined</code></td>
            <td>그대로 반환</td>
          </tr>
          <tr>
            <td>원시 타입 (number, string, boolean)</td>
            <td>그대로 반환</td>
          </tr>
          <tr>
            <td>배열</td>
            <td>복제된 요소로 새 배열 생성</td>
          </tr>
          <tr>
            <td>객체</td>
            <td>복제된 프로퍼티로 새 객체 생성</td>
          </tr>
        </tbody>
      </table>

      <h3>예제</h3>

      <CodeBlock
        language="typescript"
        code={`import { cloneDeep } from 'state-ref';

const original = {
  name: 'John',
  scores: [85, 90, 78],
  address: {
    city: 'Seoul',
    zip: '12345'
  }
};

const cloned = cloneDeep(original);

// 복제본 수정은 원본에 영향 없음
cloned.name = 'Jane';
cloned.scores.push(95);
cloned.address.city = 'Busan';

console.log(original.name);           // 'John'
console.log(original.scores);         // [85, 90, 78]
console.log(original.address.city);   // 'Seoul'

console.log(cloned.name);             // 'Jane'
console.log(cloned.scores);           // [85, 90, 78, 95]
console.log(cloned.address.city);     // 'Busan'

// 원시 타입
console.log(cloneDeep(42));           // 42
console.log(cloneDeep('hello'));      // 'hello'
console.log(cloneDeep(null));         // null`}
      />

      <h3>사용 사례</h3>

      <CodeBlock
        language="typescript"
        code={`import { createStore, cloneDeep } from 'state-ref';

const watch = createStore({
  items: [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ]
});

const ref = watch();

// 여러 변경 전에 복제
const newItems = cloneDeep(ref.items.value);
newItems[0].name = 'Updated Item 1';
newItems.push({ id: 3, name: 'Item 3' });

// 복제하고 수정한 배열 할당
ref.items.value = newItems;`}
      />

      <h2>요약 표</h2>

      <table>
        <thead>
          <tr>
            <th>함수</th>
            <th>목적</th>
            <th>원본 변경</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>lens</code></td>
            <td>중첩 구조 탐색 및 업데이트</td>
            <td>아니오</td>
          </tr>
          <tr>
            <td><code>copyable</code></td>
            <td>불변 업데이트를 위한 플루언트 API</td>
            <td>아니오</td>
          </tr>
          <tr>
            <td><code>cloneDeep</code></td>
            <td>값 깊은 복사</td>
            <td>아니오 (복사본 생성)</td>
          </tr>
        </tbody>
      </table>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/lens">Lens 패턴 가이드</a> - 상세 lens 사용 가이드
        </li>
        <li>
          <a href="#/ko/guide/copyable">copyable 가이드</a> - copyable 사용 가이드
        </li>
        <li>
          <a href="#/ko/guide/clone-deep">cloneDeep 가이드</a> - cloneDeep 사용 가이드
        </li>
        <li>
          <a href="#/ko/api/core">코어 API</a> - createStore, createComputed, combineWatch
        </li>
        <li>
          <a href="#/ko/api/types">TypeScript 타입</a> - 전체 타입 정의
        </li>
      </ul>
    </div>
  );
});
