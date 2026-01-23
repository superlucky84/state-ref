import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const PrimitivesKo = mount(() => {
  return () => (
    <div>
      <h1>원시 타입</h1>

      <p>
        StateRef는 숫자, 문자열, 불리언 같은 원시 타입과도 완벽하게 작동합니다.
        객체 스토어가 더 일반적이지만, 원시 타입 스토어는 간단한 카운터, 토글,
        또는 단일 값 상태에 유용합니다.
      </p>

      <h2>원시 타입 스토어 생성</h2>

      <p>
        <code>createStore()</code>에 원시 값을 전달하여 원시 타입 스토어를 생성합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

// 숫자 스토어
const countWatch = createStore(0);

// 문자열 스토어
const nameWatch = createStore('StateRef');

// 불리언 스토어
const toggleWatch = createStore(false);

// Null/undefined 스토어
const nullableWatch = createStore<string | null>(null);`}
      />

      <h2>값 읽기와 쓰기</h2>

      <p>
        원시 타입 스토어의 경우, 스토어 참조에서 <code>.value</code>를 통해 직접 값에 접근합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const countWatch = createStore(100);
const count = countWatch();

// 값 읽기
console.log(count.value);  // 100

// 값 쓰기
count.value = 200;
console.log(count.value);  // 200

// 증가
count.value += 1;
console.log(count.value);  // 201`}
      />

      <h2>변경 사항 구독</h2>

      <p>
        객체 스토어와 마찬가지로 원시 타입 스토어의 변경 사항을 구독합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const countWatch = createStore(0);

// 변경 사항 구독
countWatch((store, isFirst) => {
  console.log('Count:', store.value);
  console.log('첫 실행?', isFirst);
});

// 업데이트 트리거
const count = countWatch();
count.value = 10;  // 로그: Count: 10, 첫 실행? false
count.value = 20;  // 로그: Count: 20, 첫 실행? false`}
      />

      <h2>TypeScript 타입 추론</h2>

      <p>
        TypeScript는 초기값에서 자동으로 타입을 추론하거나,
        명시적으로 타입을 지정할 수 있습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// number로 타입 추론
const countWatch = createStore(0);

// string으로 타입 추론
const nameWatch = createStore('hello');

// 명시적 타입 지정
const scoreWatch = createStore<number>(0);

// 유니온 타입
const statusWatch = createStore<'idle' | 'loading' | 'done'>('idle');

// 널러블 타입
const userIdWatch = createStore<number | null>(null);`}
      />

      <h2>객체 스토어와의 비교</h2>

      <p>
        원시 타입과 객체 스토어의 주요 차이점은 접근 패턴입니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// 객체 스토어
const objWatch = createStore({ count: 0 });
const objStore = objWatch();
console.log(objStore.count.value);  // 중첩 프로퍼티 접근
objStore.count.value = 10;

// 원시 타입 스토어
const primWatch = createStore(0);
const primStore = primWatch();
console.log(primStore.value);  // 직접 값 접근
primStore.value = 10;`}
      />

      <h2>일반적인 사용 사례</h2>

      <h3>카운터</h3>

      <CodeBlock
        language="typescript"
        code={`const countWatch = createStore(0);

const increment = () => {
  const count = countWatch();
  count.value += 1;
};

const decrement = () => {
  const count = countWatch();
  count.value -= 1;
};

const reset = () => {
  const count = countWatch();
  count.value = 0;
};`}
      />

      <h3>토글</h3>

      <CodeBlock
        language="typescript"
        code={`const toggleWatch = createStore(false);

const toggle = () => {
  const state = toggleWatch();
  state.value = !state.value;
};

// 토글 변경 구독
toggleWatch((store) => {
  console.log('토글 상태:', store.value ? '켜짐' : '꺼짐');
});`}
      />

      <h3>텍스트 입력</h3>

      <CodeBlock
        language="typescript"
        code={`const inputWatch = createStore('');

// 컴포넌트에서
const handleChange = (e: Event) => {
  const input = inputWatch();
  input.value = (e.target as HTMLInputElement).value;
};

// 입력 변경 구독
inputWatch((store, isFirst) => {
  const value = store.value;
  if (isFirst) return;

  console.log('입력 변경됨:', value);
});`}
      />

      <h3>로딩 상태</h3>

      <CodeBlock
        language="typescript"
        code={`const loadingWatch = createStore(false);

const fetchData = async () => {
  const loading = loadingWatch();
  loading.value = true;

  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } finally {
    loading.value = false;
  }
};`}
      />

      <h2>AbortController 사용하기</h2>

      <p>
        <code>AbortController</code>를 사용하여 원시 타입 스토어의 구독을 취소합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const countWatch = createStore(0);
const controller = new AbortController();

countWatch((store) => {
  console.log('Count:', store.value);
  return controller.signal;
});

const count = countWatch();
count.value = 1;  // 로그: Count: 1

controller.abort();

count.value = 2;  // 로그 없음 (구독 취소됨)`}
      />

      <h2>createComputed와 결합하기</h2>

      <p>
        원시 타입 스토어는 파생 값을 위해 <code>createComputed</code>와 잘 작동합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore, createComputed } from 'state-ref';

const widthWatch = createStore(10);
const heightWatch = createStore(20);

// 두 원시 타입 스토어에서 계산된 면적
const areaWatch = createComputed(
  [widthWatch, heightWatch],
  ([width, height]) => width.value * height.value
);

// 계산된 값 구독
areaWatch((store) => {
  console.log('면적:', store.value);
});

// 업데이트가 계산된 값 재계산을 트리거
const width = widthWatch();
width.value = 15;  // 로그: 면적: 300`}
      />

      <h2>프레임워크 연동</h2>

      <p>
        원시 타입 스토어는 객체 스토어와 동일한 방식으로 UI 프레임워크와 연동됩니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// React 예제
import { connectReact } from '@stateref/connect-react';
import { createStore } from 'state-ref';

const countWatch = createStore(0);
const useCount = connectReact(countWatch);

function Counter() {
  const count = useCount();

  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick={() => count.value++}>증가</button>
    </div>
  );
}`}
      />

      <h2>모범 사례</h2>

      <ul>
        <li>
          <strong>간단한 상태에 원시 타입 스토어 사용</strong> - 카운터, 토글, 단일 값
        </li>
        <li>
          <strong>복잡한 상태에 객체 스토어 사용</strong> - 여러 관련 값
        </li>
        <li>
          <strong>스토어에 타입 지정</strong> - 특히 유니온 타입과 널러블 값에
        </li>
        <li>
          <strong>스토어 결합 고려</strong> - 원시 타입 스토어들이 함께 작동해야 할 때 <code>createComputed</code>나 <code>combineWatch</code> 사용
        </li>
      </ul>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/create-store">createStore</a> - 스토어 생성
        </li>
        <li>
          <a href="#/ko/guide/state-ref-store">StateRefStore</a> - 스토어 참조 다루기
        </li>
        <li>
          <a href="#/ko/guide/computed">createComputed</a> - 스토어에서 값 파생
        </li>
        <li>
          <a href="#/ko/guide/combine-watch">combineWatch</a> - 여러 스토어 결합
        </li>
      </ul>
    </div>
  );
});
