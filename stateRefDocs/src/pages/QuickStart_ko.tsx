import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const QuickStartKo = mount(() => {
  return () => (
    <div>
      <h1>빠른 시작</h1>

      <p>
        이 가이드는 몇 분 안에 StateRef를 시작할 수 있도록 도와줍니다.
        스토어 생성, 변경 사항 구독, 값 업데이트 방법을 배워보세요.
      </p>

      <h2>설치</h2>

      <p>먼저 코어 라이브러리를 설치합니다:</p>

      <CodeBlock
        language="bash"
        code={`$ npm install state-ref`}
      />

      <h2>첫 번째 스토어 만들기</h2>

      <p>
        <code>createStore()</code>를 사용하여 초기값과 함께 반응형 스토어를 생성합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

// 객체로 스토어 생성
const watch = createStore({ count: 0, name: 'StateRef' });

// 또는 원시 타입 값으로 생성
const numberWatch = createStore(42);`}
      />

      <h2>값 읽기와 쓰기</h2>

      <p>
        <code>.value</code> 속성을 사용하여 값에 접근하고 수정합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// 스토어 참조 얻기
const store = watch();

// 값 읽기
console.log(store.count.value); // 0

// 값 쓰기
store.count.value = 10;
store.name.value = '업데이트됨';`}
      />

      <h2>변경 사항 구독하기</h2>

      <p>
        <code>watch()</code>에 콜백 함수를 전달하여 상태 변경을 구독합니다.
        콜백은 스토어 참조와 <code>isFirst</code> 플래그를 받습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('첫 실행?', isFirst);
  // 첫 실행: Count: 0, 첫 실행? true
});

// 업데이트가 콜백을 트리거합니다
const store = watch();
store.count.value = 5;
// 로그: Count: 5, 첫 실행? false`}
      />

      <h2>참조 이해하기</h2>

      <p>
        <code>watch</code> 함수는 콜백과 함께 호출하든 안하든 같은 참조를 반환합니다.
        반환된 참조(<code>outerRef</code>)와 콜백 인자(<code>innerRef</code>) 모두
        의존성을 추적합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ x: 1, y: 2 });

// 구독하고 추적된 참조 얻기
const outerRef = watch((innerRef, isFirst) => {
  // innerRef와 outerRef는 같은 참조입니다
  console.log(innerRef.x.value);
});

// 둘 다 구독을 트리거합니다
outerRef.x.value = 10;  // ✓ 콜백 트리거
innerRef.x.value = 20;  // ✓ 콜백 트리거

// 추적되지 않는 참조
const anotherRef = watch();
anotherRef.y.value = 5;  // ✗ 콜백 트리거 안 함`}
      />

      <h3>핵심 포인트</h3>

      <ul>
        <li><strong>구독된 참조</strong>를 통해 접근한 값만 업데이트를 트리거합니다</li>
        <li>콜백과 함께 생성된 경우 <code>innerRef</code>와 <code>outerRef</code> 모두 추적됩니다</li>
        <li>콜백 없이 생성된 참조는 <strong>추적되지 않습니다</strong></li>
      </ul>

      <h2>구독 취소하기</h2>

      <p>
        <code>AbortController</code>를 사용하여 변경 사항 구독을 해제합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const abortController = new AbortController();

watch((store) => {
  console.log('Count:', store.count.value);
  return abortController.signal;
});

// 나중에 구독 취소
abortController.abort();`}
      />

      <h2>원시 타입 다루기</h2>

      <p>
        StateRef는 숫자나 문자열 같은 원시 타입과도 완벽하게 작동합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const numberWatch = createStore(100);

numberWatch((store) => {
  console.log('Number:', store.value);
});

const numStore = numberWatch();
numStore.value = 200; // 콜백 트리거`}
      />

      <h2>다음 단계</h2>

      <p>
        이제 기본을 이해했으니, 다음 주제들을 탐색해보세요:
      </p>

      <ul>
        <li>
          <a href="#/ko/guide/create-store">createStore API</a> - 스토어 생성 깊이 알아보기
        </li>
        <li>
          <a href="#/ko/guide/watch">Watch 함수</a> - 고급 watch 패턴
        </li>
        <li>
          <a href="#/ko/guide/react">React 연동</a> - React와 함께 StateRef 사용하기
        </li>
        <li>
          <a href="#/ko/guide/computed">createComputed</a> - 여러 스토어에서 값 파생하기
        </li>
      </ul>
    </div>
  );
});
