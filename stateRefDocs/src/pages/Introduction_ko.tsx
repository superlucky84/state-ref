import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const IntroductionKo = mount(() => {
  return () => (
    <div>
      <h1>소개</h1>

      <p>
        StateRef는 데이터 불변성에 초점을 맞춘 범용 상태 관리 라이브러리입니다.
        프록시와 함수형 프로그래밍 렌즈 패턴을 결합하여 깊게 중첩된 데이터를
        효율적이고 안전하게 접근하고 수정합니다.
      </p>

      <h2>왜 StateRef인가?</h2>

      <p>
        현대 애플리케이션은 복잡하고 깊게 중첩된 상태를 다루는 경우가 많습니다.
        StateRef는 불변성과 세밀한 반응성을 유지하면서 이러한 상태를 관리할 수
        있는 간단하면서도 강력한 방법을 제공합니다.
      </p>

      <h3>주요 기능</h3>

      <ul>
        <li>
          <strong>프록시 기반 반응성</strong> - JavaScript 프록시를 사용한 자동
          의존성 추적
        </li>
        <li>
          <strong>불변 업데이트</strong> - Copy-on-write 패턴으로 안전한 상태
          수정 보장
        </li>
        <li>
          <strong>렌즈 패턴</strong> - 깊은 업데이트를 위한 우아한 함수형 렌즈
        </li>
        <li>
          <strong>프레임워크 독립적</strong> - React, Vue, Svelte, Solid 등과
          쉽게 통합
        </li>
        <li>
          <strong>TypeScript 지원</strong> - 완전한 타입 안전성과 추론
        </li>
        <li>
          <strong>경량</strong> - 의존성 없이 작은 번들 크기
        </li>
      </ul>

      <h2>핵심 개념</h2>

      <h3>Watch 함수</h3>

      <p>
        <code>Watch</code> 함수는 StateRef의 기본 추상화입니다. 두 가지 용도로
        사용됩니다:
      </p>

      <ul>
        <li>
          인자 없이 호출: 값을 읽고 쓰기 위한 <code>StateRefStore</code> 반환
        </li>
        <li>
          콜백과 함께 호출: 변경 사항 구독 (콜백은 <code>StateRefStore</code>와{' '}
          <code>isFirst</code> 불리언을 받음)
        </li>
      </ul>

      <h3>StateRefStore</h3>

      <p>
        <code>StateRefStore</code>는 <code>.value</code> 속성을 통해 값에
        접근할 수 있는 프록시 참조입니다. 프록시는 구독 콜백 동안 접근되는
        속성을 자동으로 추적하여 세밀한 반응성을 가능하게 합니다.
      </p>

      <h3>Copy-on-Write</h3>

      <p>
        모든 변경은 수정된 경로에 새로운 객체 참조를 생성하고 변경되지 않은
        하위 트리는 공유합니다. 이를 통해 참조 동등성을 통한 효율적인 불변성
        검사가 가능합니다.
      </p>

      <h2>설치</h2>

      <CodeBlock
        language="bash"
        code={`# 코어 라이브러리
$ npm install state-ref

# 프레임워크 커넥터 (필요한 것만 선택)
$ npm install @stateref/connect-react
$ npm install @stateref/connect-vue
$ npm install @stateref/connect-svelte
$ npm install @stateref/connect-solid`}
      />

      <h2>기본 예제</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

// 스토어 생성
const watch = createStore({ count: 0 });

// 변경 사항 구독
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  // 첫 실행: Count: 0
});

// 값 업데이트
const store = watch();
store.count.value = 1;
// 로그: Count: 1`}
      />

      <h2>React와 함께 사용하기</h2>

      <p>
        StateRef는 <code>connectReact</code> 헬퍼를 사용하여 React와 쉽게 통합할 수 있습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const watch = createStore({ count: 0 });
export const useCountStore = connectReact(watch);`}
      />

      <CodeBlock
        language="tsx"
        code={`// Counter.tsx
import { useCountStore } from './store';

function Counter() {
  const { count } = useCountStore();

  return (
    <button onClick={() => count.value++}>
      Count: {count.value}
    </button>
  );
}`}
      />

      <p>
        <code>count.value</code>가 변경되면 컴포넌트가 자동으로 다시 렌더링됩니다.
        자세한 내용은 <a href="#/ko/guide/react">React 연동</a> 가이드를 참고하세요.
      </p>

      <h2>다음 단계</h2>

      <p>
        더 자세히 알아볼 준비가 되셨나요? <a href="#/ko/guide/quick-start">빠른 시작</a>{' '}
        가이드를 확인하여 프로젝트에서 StateRef를 사용하는 방법을 배워보세요.
      </p>
    </div>
  );
});
