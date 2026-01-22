import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const WatchKo = mount(() => {
  return () => (
    <div>
      <h1>Watch 함수</h1>

      <p>
        <code>watch</code> 함수는 <code>createStore()</code>가 반환하는 핵심 인터페이스입니다.
        상태 참조 접근과 상태 변경 구독이라는 두 가지 목적으로 사용됩니다.
      </p>

      <h2>개요</h2>

      <p>
        <code>createStore()</code>를 호출하면 두 가지 방식으로 사용할 수 있는 <code>watch</code> 함수를 반환합니다:
      </p>

      <ul>
        <li>
          <strong>인자 없이 호출</strong>: 값을 읽고 쓰기 위한 <code>StateRefStore</code> 참조 반환
        </li>
        <li>
          <strong>콜백과 함께 호출</strong>: 변경 사항을 구독하고 추적되는 <code>StateRefStore</code> 참조 반환
        </li>
      </ul>

      <h2>기본 사용법</h2>

      <h3>참조 얻기 (구독 없음)</h3>

      <p>
        인자 없이 <code>watch()</code>를 호출하여 상태를 읽고 쓰기 위한 참조를 얻습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });

// 구독 없이 참조 얻기
const store = watch();

// 값 읽기
console.log(store.count.value); // 0
console.log(store.name.value);  // 'StateRef'

// 값 쓰기
store.count.value = 10;
store.name.value = '업데이트됨';`}
      />

      <h3>변경 사항 구독하기</h3>

      <p>
        콜백 함수와 함께 <code>watch()</code>를 호출하여 상태 변경을 구독합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });

// 변경 사항 구독
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('첫 실행?', isFirst);
});

// 업데이트는 콜백을 트리거합니다
const store = watch();
store.count.value = 1; // 로그: "Count: 1" 및 "첫 실행? false"`}
      />

      <h2>콜백 시그니처</h2>

      <p>
        구독 콜백은 두 개의 파라미터를 받습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`type RenewCallback<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => void | AbortSignal;`}
      />

      <h3>파라미터</h3>

      <ul>
        <li>
          <code>store</code> - 자동으로 추적되는 <code>StateRefStore</code> 참조 (innerRef)
        </li>
        <li>
          <code>isFirst</code> - 콜백의 첫 실행인지 나타내는 불리언 값
        </li>
      </ul>

      <h3>반환값</h3>

      <p>
        콜백은 선택적으로 <code>AbortSignal</code>을 반환하여 시그널이 중단되면 구독을 취소할 수 있습니다.
      </p>

      <h2>isFirst 파라미터 이해하기</h2>

      <p>
        <code>isFirst</code> 파라미터는 초기 콜백 실행과 이후 업데이트를 구분하는 데 도움이 됩니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });

watch((store, isFirst) => {
  if (isFirst) {
    console.log('초기 설정, count:', store.count.value);
  } else {
    console.log('Count 업데이트됨:', store.count.value);
  }
});

// 출력: "초기 설정, count: 0"

const store = watch();
store.count.value = 5;
// 출력: "Count 업데이트됨: 5"`}
      />

      <h2>InnerRef vs OuterRef</h2>

      <p>
        innerRef와 outerRef를 이해하는 것이 중요합니다: 둘은 <strong>동일한 참조</strong>이며,
        둘 다 구독에 바인딩되어 있습니다. 중요한 것은 콜백 중에 <strong>어떤 참조로 프로퍼티를 읽는가(READ)</strong>입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ x: 1, y: 2 });

const anotherRef = watch();  // 언바운드 참조

// 콜백은 innerRef를 받습니다
const outerRef = watch((innerRef, isFirst) => {
  // innerRef로 x 읽기 → x가 추적됨
  console.log('x 변경됨:', innerRef.x.value);

  // 언바운드 참조로 y 읽기 → y는 추적되지 않음
  console.log('y 값:', anotherRef.y.value);
});

// 둘 다 콜백 트리거 (x는 innerRef로 읽었음)
outerRef.x.value = 10;
// ✓ 로그: "x 변경됨: 10"

anotherRef.x.value = 20;
// ✓ 로그: "x 변경됨: 20" (x가 추적되어 있음!)

// 둘 다 콜백 트리거 안 함 (y는 언바운드 참조로 읽었음)
outerRef.y.value = 10;    // ✗ 트리거 안 함
anotherRef.y.value = 20;  // ✗ 트리거 안 함`}
      />

      <p>
        <strong>핵심 원칙</strong>: 추적은 구독 중에 어떤 참조로 프로퍼티를 읽었는가(READ)에 기반하며,
        나중에 어떤 참조로 쓰는가(WRITE)는 상관없습니다.
      </p>

      <h2>AbortController로 구독 취소하기</h2>

      <p>
        <code>AbortController</code>를 사용하여 구독을 취소합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });
const controller = new AbortController();

// 콜백에서 abort 시그널 반환
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  return controller.signal;
});

const store = watch();
store.count.value = 1; // ✓ 콜백 트리거

// 구독 취소
controller.abort();

store.count.value = 2; // ✗ 콜백 트리거하지 않음 (구독 취소됨)`}
      />

      <h2>여러 구독</h2>

      <p>
        동일한 스토어에 여러 독립적인 구독을 만들 수 있습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });

// 첫 번째 구독
const ref1 = watch((store) => {
  console.log('구독 1:', store.count.value);
});

// 두 번째 구독
const ref2 = watch((store) => {
  console.log('구독 2:', store.count.value);
});

// 두 구독은 독립적입니다
ref1.count.value = 10;
// 출력:
// "구독 1: 10"

ref2.count.value = 20;
// 출력:
// "구독 2: 20"`}
      />

      <h2>참조 접근과 구독 결합하기</h2>

      <p>
        구독 콜백은 추적되는 참조를 반환하며, 즉시 사용할 수 있습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0, name: 'StateRef' });

// 구독하고 추적되는 참조 얻기
const trackedStore = watch((store) => {
  console.log('상태 변경됨:', store.count.value);
});

// 다른 작업을 위해 추적되지 않는 참조도 얻기
const untrackedStore = watch();

// 추적되는 참조를 통한 업데이트 - 콜백 트리거
trackedStore.count.value = 5;
// ✓ 로그: "상태 변경됨: 5"

// 추적되지 않는 참조를 통한 업데이트 - 콜백 트리거하지 않음
untrackedStore.count.value = 10;
// ✗ 아무것도 로그하지 않음`}
      />

      <h2>선택적 프로퍼티 추적</h2>

      <p>
        구독은 콜백 내에서 접근된 프로퍼티만 추적합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ x: 1, y: 2, z: 3 });

const store = watch((innerRef) => {
  // x만 접근하므로, x 변경만 이 콜백을 트리거합니다
  console.log('x 변경됨:', innerRef.x.value);
});

store.x.value = 10; // ✓ 콜백 트리거
store.y.value = 20; // ✗ 트리거하지 않음 (y는 접근하지 않음)
store.z.value = 30; // ✗ 트리거하지 않음 (z는 접근하지 않음)`}
      />

      <h2>일반적인 패턴</h2>

      <h3>컴포넌트 통합</h3>

      <CodeBlock
        language="typescript"
        code={`// UI 프레임워크 컴포넌트에서
const MyComponent = () => {
  const store = appWatch((innerRef) => {
    // count 변경 시 리렌더링 트리거
    console.log('Count 업데이트됨:', innerRef.count.value);

    // 컴포넌트의 정리 시그널 반환
    return cleanupSignal;
  });

  return <div>{store.count.value}</div>;
};`}
      />

      <h3>파생 상태</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ firstName: 'John', lastName: 'Doe' });

watch((store) => {
  const fullName = \`\${store.firstName.value} \${store.lastName.value}\`;
  console.log('전체 이름:', fullName);
});

const store = watch();
store.firstName.value = 'Jane';
// 로그: "전체 이름: Jane Doe"`}
      />

      <h3>사이드 이펙트</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ userId: null });

watch((store, isFirst) => {
  if (!isFirst && store.userId.value) {
    // userId 변경 시 사용자 데이터 가져오기
    fetchUserData(store.userId.value);
  }
});`}
      />

      <h2>모범 사례</h2>

      <ul>
        <li>
          <strong>초기화에 isFirst 사용</strong> - 설정 로직과 업데이트 로직 구분
        </li>
        <li>
          <strong>정리를 위해 AbortSignal 반환</strong> - 컴포넌트에서 항상 구독 정리
        </li>
        <li>
          <strong>추적에 주의</strong> - outerRef(구독이 반환한 참조)만 추적됨
        </li>
        <li>
          <strong>필요한 프로퍼티만 접근</strong> - 구독은 접근된 프로퍼티만 추적
        </li>
        <li>
          <strong>루프에서 참조 생성 금지</strong> - 모듈 또는 컴포넌트 레벨에서 watch 참조 생성
        </li>
      </ul>

      <h2>타입 안전성</h2>

      <p>
        watch 함수는 TypeScript와 완전히 타입이 지정됩니다:
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

// 타입 안전한 참조 접근
const store = watch();
store.name.value = 'Jane';      // ✓ OK
store.age.value = 30;            // ✗ 에러: 프로퍼티 'age'가 존재하지 않음

// 타입 안전한 구독
watch((innerRef) => {
  const name: string = innerRef.name.value;  // ✓ 타입이 올바르게 추론됨
  const id: number = innerRef.id.value;      // ✓ 타입이 올바르게 추론됨
});`}
      />

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/create-store">createStore</a> - watch 함수를 반환하는 스토어 생성
        </li>
        <li>
          <a href="#/ko/guide/references">참조 이해하기</a> - innerRef, outerRef, 언바운드 참조 심층 분석
        </li>
        <li>
          <a href="#/ko/guide/subscription">구독</a> - 고급 구독 패턴
        </li>
        <li>
          <a href="#/ko/guide/state-ref-store">StateRefStore</a> - 스토어 참조 다루기
        </li>
      </ul>
    </div>
  );
});
