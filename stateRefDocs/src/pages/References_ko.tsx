import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ReferencesKo = mount(() => {
  return () => (
    <div>
      <h1>참조 이해하기</h1>

      <p>
        StateRef는 참조 기반 추적 시스템을 사용하여 어떤 상태 변경이 구독을 트리거해야 하는지 결정합니다.
        <strong>innerRef</strong>, <strong>outerRef</strong>, <strong>언바운드 참조</strong>의 차이를
        이해하는 것은 효과적인 상태 관리에 필수적입니다.
      </p>

      <h2>세 가지 참조 타입</h2>

      <p>
        StateRef를 사용할 때 세 가지 타입의 참조를 만나게 됩니다:
      </p>

      <ul>
        <li>
          <strong>innerRef</strong> - 구독 콜백의 첫 번째 파라미터로 전달되는 참조
        </li>
        <li>
          <strong>outerRef</strong> - 구독 시 <code>watch()</code>가 반환하는 참조
        </li>
        <li>
          <strong>언바운드 참조</strong> - 콜백 없이 <code>watch()</code>를 호출하여 생성된 참조
        </li>
      </ul>

      <h2>InnerRef와 OuterRef: 동일한 참조</h2>

      <p>
        이해해야 할 가장 중요한 개념은 <strong>innerRef와 outerRef가 동일한 참조</strong>라는 것입니다.
        둘 다 구독에 바인딩되어 있으며 변경 사항이 추적됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

const watch = createStore({ rowCount: 5, columnCount: 10 });

const subscribeCallback = (innerRef, isFirst) => {
  const matrixCount = innerRef.rowCount.value * innerRef.columnCount.value;
  console.log('매트릭스 개수:', matrixCount);
};

// outerRef: watch()가 반환, subscribeCallback에 바인딩됨
const outerRef = watch(subscribeCallback);

// 핵심 인사이트: innerRef와 outerRef는 동일한 참조입니다
// 둘 다 구독에 의해 추적됩니다`}
      />

      <h2>핵심 원칙: 추적은 읽기 기반이지, 쓰기 기반이 아닙니다</h2>

      <p>
        가장 중요한 개념: <strong>중요한 것은 구독 중에 어떤 참조로 프로퍼티를 읽었는가(READ)이며,
        나중에 어떤 참조로 쓰는가(WRITE)는 상관없습니다</strong>.
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ x: 1, y: 2 });

const anotherRef = watch();  // 언바운드 참조

const outerRef = watch((innerRef) => {
  // innerRef로 x 읽기 → x가 추적됨
  console.log('x 변경됨:', innerRef.x.value);

  // anotherRef로 y 읽기 → y는 추적되지 않음
  console.log('y 값:', anotherRef.y.value);
});

// 둘 다 콜백 트리거 (x는 innerRef로 읽었음)
outerRef.x.value = 10;    // ✓ 콜백 트리거
anotherRef.x.value = 20;  // ✓ 콜백 트리거 (x가 추적되기 때문!)

// 둘 다 콜백 트리거 안 함 (y는 anotherRef로 읽었음)
outerRef.y.value = 10;    // ✗ 트리거 안 함 (y 추적 안 됨)
anotherRef.y.value = 20;  // ✗ 트리거 안 함 (y 추적 안 됨)`}
      />

      <h2>언바운드 참조</h2>

      <p>
        언바운드 참조는 콜백 없이 <code>watch()</code>를 호출하여 생성됩니다.
        이러한 참조는 상태를 읽고 쓸 수 있지만 추적을 등록하지 않습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0, name: 'StateRef' });

// 언바운드 참조 - 추적 없음
const unboundRef = watch();

// 값 읽기
console.log(unboundRef.count.value);  // 0

// 값 쓰기 - 상태는 업데이트하지만 구독을 트리거하지 않음
unboundRef.count.value = 10;

// 이 참조는 어떤 구독과도 독립적으로 존재합니다`}
      />

      <h2>선택적 프로퍼티 추적</h2>

      <p>
        구독 콜백 내에서 <strong>추적되는 참조(innerRef/outerRef)를 통해 읽은</strong> 프로퍼티만 추적됩니다.
        프로퍼티가 일단 추적되면, <strong>어떤 참조로든 수정하면 콜백이 트리거됩니다</strong>.
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  rowCount: 5,
  columnCount: 10,
  etcCount: 3
});

// 구독 전에 언바운드 참조 생성
const anotherRef = watch();

const subscribeCallback = (innerRef, isFirst) => {
  const result =
    innerRef.rowCount.value *      // ← innerRef로 읽음 → 추적됨
    innerRef.columnCount.value *   // ← innerRef로 읽음 → 추적됨
    anotherRef.etcCount.value;     // ← 언바운드 참조로 읽음 → 추적 안 됨

  console.log('결과:', result);
};

const outerRef = watch(subscribeCallback);

// 둘 다 트리거 (rowCount는 innerRef로 읽었음 → 추적됨)
anotherRef.rowCount.value = 10;     // ✓ 트리거
outerRef.rowCount.value = 15;       // ✓ 트리거

// 둘 다 트리거 (columnCount는 innerRef로 읽었음 → 추적됨)
anotherRef.columnCount.value = 5;   // ✓ 트리거
outerRef.columnCount.value = 8;     // ✓ 트리거

// 둘 다 트리거 안 함 (etcCount는 언바운드 참조로 읽었음 → 추적 안 됨)
anotherRef.etcCount.value = 2;      // ✗ 트리거 안 함
outerRef.etcCount.value = 7;        // ✗ 트리거 안 함`}
      />

      <p>
        <strong>핵심 원칙</strong>: 추적은 <em>구독 중에 어떤 참조로 프로퍼티를 읽었는지(READ)</em>에 의해 결정되며,
        나중에 어떤 참조로 쓰는지(WRITE)는 상관없습니다. 일단 추적되면, 어떤 쓰기든 콜백을 트리거합니다.
      </p>

      <h2>왜 이런 디자인인가?</h2>

      <p>
        이 참조 기반 추적 시스템은 여러 이점을 제공합니다:
      </p>

      <ul>
        <li>
          <strong>세밀한 제어</strong> - 어떤 프로퍼티가 업데이트를 트리거할지 정확하게 결정
        </li>
        <li>
          <strong>성능</strong> - 추적된 프로퍼티만 리렌더링을 발생시킴
        </li>
        <li>
          <strong>유연성</strong> - 동일한 콜백에서 추적되는 접근과 추적되지 않는 접근을 혼합
        </li>
        <li>
          <strong>UI 통합</strong> - OuterRef가 컴포넌트 통합을 원활하게 만듦
        </li>
      </ul>

      <h2>실용 예제: 컴포넌트 통합</h2>

      <p>
        outerRef 디자인은 UI 라이브러리 통합을 특히 우아하게 만듭니다.
        가상의 컴포넌트 프레임워크를 사용한 예제입니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

const watch = createStore({ count: 0 });

const Component = mount((renew) => {
  // renew를 구독 콜백으로 전달
  // 컴포넌트에서 사용할 outerRef를 반환
  const countRef = watch(renew);

  const increment = () => {
    // outerRef를 통한 업데이트 - renew 트리거
    countRef.value += 1;
  };

  return () => (
    <button onClick={increment}>
      Count: {countRef.value}
    </button>
  );
});`}
      />

      <h2>여러 독립적인 구독</h2>

      <p>
        각 구독은 콜백 중에 읽은(READ) 프로퍼티에 기반한 자체 추적 컨텍스트를 가집니다.
        여러 구독이 독립적으로 공존할 수 있습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ x: 1, y: 2 });

// 첫 번째 구독: x 읽음 → x 추적
const ref1 = watch((innerRef) => {
  console.log('구독 1 - x:', innerRef.x.value);
});

// 두 번째 구독: y 읽음 → y 추적
const ref2 = watch((innerRef) => {
  console.log('구독 2 - y:', innerRef.y.value);
});

// 첫 번째 구독만 트리거 (구독 1만 x를 추적)
ref1.x.value = 10;  // 로그: "구독 1 - x: 10"
ref2.x.value = 15;  // 역시 로그: "구독 1 - x: 15"

// 두 번째 구독만 트리거 (구독 2만 y를 추적)
ref2.y.value = 20;  // 로그: "구독 2 - y: 20"
ref1.y.value = 25;  // 역시 로그: "구독 2 - y: 25"

// 각 구독은 독립적인 추적을 가집니다`}
      />

      <h2>일반적인 패턴</h2>

      <h3>의도하지 않은 추적 방지</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ config: { theme: 'dark' }, data: [] });

// config를 위한 언바운드 참조 생성 (읽기 전용, 업데이트를 트리거하면 안 됨)
const configRef = watch();

const dataRef = watch((innerRef) => {
  // data 변경만 추적, config는 추적하지 않음
  console.log('데이터 업데이트됨:', innerRef.data.value);
  console.log('현재 테마:', configRef.config.theme.value);
});

// 콜백 트리거 (data가 추적됨)
dataRef.data.value = [1, 2, 3];

// 콜백 트리거하지 않음 (config는 언바운드 참조를 통해 접근됨)
configRef.config.theme.value = 'light';`}
      />

      <h3>혼합 추적 전략</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  settings: { lang: 'ko', notifications: true },
  user: { name: 'John', email: 'john@example.com' }
});

const settingsRef = watch();  // 언바운드 - 정적 설정용

const userRef = watch((innerRef) => {
  // user 변경 추적
  console.log('사용자:', innerRef.name.value, innerRef.email.value);

  // 추적 없이 settings 접근
  console.log('언어:', settingsRef.settings.lang.value);
});

// 콜백 트리거
userRef.name.value = 'Jane';

// 콜백 트리거하지 않음
settingsRef.settings.lang.value = 'en';`}
      />

      <h2>시각적 요약</h2>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ a: 1, b: 2, c: 3 });

// ┌──────────────────────────────────────────┐
// │  구독 콜백                               │
// ├──────────────────────────────────────────┤
// │  innerRef.a.value  ← innerRef로 읽음     │
// │  innerRef.b.value  ← innerRef로 읽음     │
// │  (c는 읽지 않음)                         │
// └──────────────────────────────────────────┘
//         ↓
// ┌──────────────────────────────────────────┐
// │  추적 결과                               │
// │  - 'a'가 추적됨                          │
// │  - 'b'가 추적됨                          │
// │  - 'c'는 추적 안 됨                      │
// └──────────────────────────────────────────┘
//         ↓
// ┌──────────────────────────────────────────┐
// │  추적된 프로퍼티에 대한 모든 쓰기는      │
// │  콜백을 트리거합니다                     │
// │                                          │
// │  outerRef.a.value = 10   ✓ 트리거        │
// │  unboundRef.a.value = 10 ✓ 트리거        │
// │  outerRef.b.value = 20   ✓ 트리거        │
// │  unboundRef.b.value = 20 ✓ 트리거        │
// │                                          │
// │  outerRef.c.value = 30   ✗ 트리거 안 함  │
// │  unboundRef.c.value = 30 ✗ 트리거 안 함  │
// └──────────────────────────────────────────┘

const outerRef = watch((innerRef) => {
  console.log(innerRef.a.value, innerRef.b.value);
});

const unboundRef = watch();

// 둘 다 트리거 ('a'는 innerRef로 읽었음)
unboundRef.a.value = 10;  // ✓ 트리거
outerRef.a.value = 20;    // ✓ 트리거`}
      />

      <h2>모범 사례</h2>

      <ul>
        <li>
          <strong>추적하려면 innerRef로 읽기</strong> - innerRef/outerRef로 읽은 프로퍼티는 추적됨; 추적을 피하려면 언바운드 참조로 읽기
        </li>
        <li>
          <strong>정적 데이터에 언바운드 참조 사용</strong> - 설정이나 상수는 언바운드 참조로 읽어서 업데이트를 트리거하지 않도록 하기
        </li>
        <li>
          <strong>추적에 대해 명시적으로</strong> - 읽기에 올바른 참조를 선택하여 어떤 프로퍼티가 추적되는지 명확히 하기
        </li>
        <li>
          <strong>기억하기: 읽기(READ)가 추적을 결정, 쓰기(WRITE)는 아님</strong> - 어떤 참조든 추적된 프로퍼티에 대한 업데이트를 트리거 가능
        </li>
        <li>
          <strong>컴포넌트에 outerRef 활용</strong> - UI 라이브러리 통합을 자연스럽게 만듦
        </li>
        <li>
          <strong>추적 컨텍스트 이해</strong> - 각 구독은 독립적인 추적을 가짐
        </li>
      </ul>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/watch">Watch 함수</a> - watch 함수 API 이해하기
        </li>
        <li>
          <a href="#/ko/guide/subscription">구독</a> - 고급 구독 패턴
        </li>
        <li>
          <a href="#/ko/guide/state-ref-store">StateRefStore</a> - 스토어 참조 다루기
        </li>
        <li>
          <a href="#/ko/guide/create-store">createStore</a> - 스토어 생성
        </li>
      </ul>
    </div>
  );
});
