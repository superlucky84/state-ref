import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ComputedKo = mount(() => {
  return () => (
    <div>
      <h1>createComputed</h1>

      <p>
        <code>createComputed</code>는 여러 watch를 결합하여 새로운 계산된(파생) 값을 생성하는
        헬퍼 함수입니다. 계산된 값이 변경될 때마다 콜백 함수를 실행합니다.
      </p>

      <p>
        <code>createComputed</code>로 생성된 watch는 다른 watch처럼 사용할 수 있으며,
        <code>connectReact</code>나 <code>connectPreact</code> 같은 연동에서도 사용할 수 있습니다.
      </p>

      <h2>기본 사용법</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore, createComputed } from 'state-ref';

const watch1 = createStore(10);
const watch2 = createStore(20);

// 두 스토어에서 계산된 watch 생성
const sumWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);

// 계산된 값 가져오기
const sumRef = sumWatch();
console.log(sumRef.value);  // 30

// 소스 스토어 업데이트
const num1 = watch1();
num1.value = 15;
console.log(sumRef.value);  // 35`}
      />

      <h2>문법</h2>

      <CodeBlock
        language="typescript"
        code={`createComputed<W extends readonly Watch<any>[], R>(
  watches: W,
  callback: (refs: StateRefsTuple<W>) => R
): (computedCallback?: (proxy: { value: R }, isFirst: boolean) => void) => { value: R }`}
      />

      <h3>매개변수</h3>

      <ul>
        <li>
          <code>watches</code> - 결합할 watch 함수 배열
        </li>
        <li>
          <code>callback</code> - 스토어 참조를 받아 계산된 값을 반환하는 함수
        </li>
      </ul>

      <h3>반환값</h3>

      <p>
        콜백 유무에 따라 호출할 수 있는 watch와 유사한 함수를 반환합니다:
      </p>

      <ul>
        <li>
          <strong>콜백 없이</strong>: <code>.value</code>를 가진 읽기 전용 프록시 반환
        </li>
        <li>
          <strong>콜백과 함께</strong>: 변경 사항을 구독하고 동일한 프록시 반환
        </li>
      </ul>

      <h2>계산된 값 구독</h2>

      <p>
        콜백을 전달하여 계산된 값 변경을 구독합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch1 = createStore(100);
const watch2 = createStore(50);

const diffWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value - ref2.value
);

// 계산된 값 변경 구독
diffWatch((computedRef, isFirst) => {
  console.log('차이:', computedRef.value);
  console.log('첫 실행?', isFirst);
});
// 로그: 차이: 50, 첫 실행? true

// 업데이트가 재계산 트리거
const num1 = watch1();
num1.value = 200;
// 로그: 차이: 150, 첫 실행? false`}
      />

      <h2>읽기 전용 값</h2>

      <p>
        계산된 값은 읽기 전용입니다. 값을 설정하려고 하면 경고가 표시됩니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch1 = createStore(10);
const watch2 = createStore(20);

const sumWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);

const sumRef = sumWatch();

// 읽기는 작동함
console.log(sumRef.value);  // 30

// 쓰기는 경고 표시
sumRef.value = 100;  // 콘솔 경고: "Can not setting"
console.log(sumRef.value);  // 여전히 30`}
      />

      <h2>복잡한 계산된 값</h2>

      <p>
        계산 콜백은 객체를 포함한 모든 타입을 반환할 수 있습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const userWatch = createStore({ firstName: 'John', lastName: 'Doe' });
const settingsWatch = createStore({ showFullName: true });

const displayNameWatch = createComputed(
  [userWatch, settingsWatch],
  ([user, settings]) => {
    if (settings.showFullName.value) {
      return {
        name: \`\${user.firstName.value} \${user.lastName.value}\`,
        initials: \`\${user.firstName.value[0]}\${user.lastName.value[0]}\`
      };
    }
    return {
      name: user.firstName.value,
      initials: user.firstName.value[0]
    };
  }
);

const displayRef = displayNameWatch();
console.log(displayRef.value);
// { name: 'John Doe', initials: 'JD' }`}
      />

      <h2>여러 스토어 결합</h2>

      <p>
        단일 computed에서 여러 스토어를 결합할 수 있습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const priceWatch = createStore(100);
const quantityWatch = createStore(3);
const taxRateWatch = createStore(0.1);
const discountWatch = createStore(10);

const totalWatch = createComputed(
  [priceWatch, quantityWatch, taxRateWatch, discountWatch],
  ([price, quantity, taxRate, discount]) => {
    const subtotal = price.value * quantity.value;
    const tax = subtotal * taxRate.value;
    const total = subtotal + tax - discount.value;
    return {
      subtotal,
      tax,
      discount: discount.value,
      total
    };
  }
);

const total = totalWatch();
console.log(total.value);
// { subtotal: 300, tax: 30, discount: 10, total: 320 }`}
      />

      <h2>프레임워크 커넥터와 사용</h2>

      <p>
        계산된 watch는 프레임워크 커넥터와 원활하게 작동합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore, createComputed } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

// 소스 스토어
const widthWatch = createStore(10);
const heightWatch = createStore(20);

// 계산된 스토어
const areaWatch = createComputed(
  [widthWatch, heightWatch],
  ([width, height]) => width.value * height.value
);

// 계산된 watch에서 React 훅 생성
const useArea = connectReact(areaWatch);

function AreaDisplay() {
  const area = useArea();

  return <div>면적: {area.value}</div>;
}`}
      />

      <h2>계산된 값 체이닝</h2>

      <p>
        계산된 watch를 다른 계산된 watch의 입력으로 사용할 수 있습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const baseWatch = createStore(100);
const multiplierWatch = createStore(2);

// 첫 번째 computed
const multipliedWatch = createComputed(
  [baseWatch, multiplierWatch],
  ([base, mult]) => base.value * mult.value
);

// 첫 번째를 사용하는 두 번째 computed
const formattedWatch = createComputed(
  [multipliedWatch],
  ([multiplied]) => \`결과: \${multiplied.value}\`
);

const formatted = formattedWatch();
console.log(formatted.value);  // "결과: 200"

// base 값 업데이트
const base = baseWatch();
base.value = 50;
console.log(formatted.value);  // "결과: 100"`}
      />

      <h2>TypeScript 지원</h2>

      <p>
        <code>createComputed</code>는 완전한 TypeScript 추론을 제공합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore, createComputed } from 'state-ref';
import type { Watch } from 'state-ref';

interface User {
  name: string;
  age: number;
}

const userWatch = createStore<User>({ name: 'John', age: 30 });
const multiplierWatch = createStore<number>(2);

// 반환 타입이 자동으로 추론됨
const computedWatch = createComputed(
  [userWatch, multiplierWatch],
  ([user, mult]) => ({
    userName: user.name.value,        // string
    doubleAge: user.age.value * mult.value  // number
  })
);

const result = computedWatch();
// result.value는 { userName: string; doubleAge: number } 타입`}
      />

      <h2>성능 고려사항</h2>

      <ul>
        <li>
          <strong>계산된 값은 캐시됨</strong> - 콜백은 소스 값이 변경될 때만 실행됨
        </li>
        <li>
          <strong>세밀한 업데이트</strong> - 접근한 프로퍼티만 재계산을 트리거함
        </li>
        <li>
          <strong>무거운 계산 피하기</strong> - 콜백 함수를 효율적으로 유지하기
        </li>
      </ul>

      <CodeBlock
        language="typescript"
        code={`// 좋음: 간단한 계산
const simpleComputed = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);

// 주의: 무거운 계산 - 메모이제이션 고려
const heavyComputed = createComputed(
  [itemsWatch, filterWatch],
  ([items, filter]) => {
    // 매 변경마다 실행됨
    return items.value
      .filter(item => item.name.includes(filter.value))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
);`}
      />

      <h2>combineWatch와 비교</h2>

      <p>
        <code>createComputed</code>와 <code>combineWatch</code>는 다른 목적을 가지고 있습니다:
      </p>

      <ul>
        <li>
          <strong>createComputed</strong> - 여러 스토어에서 <em>새로운 값</em>을 파생
        </li>
        <li>
          <strong>combineWatch</strong> - 여러 스토어를 <em>튜플 구조</em>로 그룹화
        </li>
      </ul>

      <CodeBlock
        language="typescript"
        code={`import { createStore, createComputed, combineWatch } from 'state-ref';

const watch1 = createStore(10);
const watch2 = createStore(20);

// createComputed: 파생된 값 반환
const sumWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);
const sum = sumWatch();
console.log(sum.value);  // 30 (단일 값)

// combineWatch: 그룹화된 스토어 반환
const combinedWatch = combineWatch([watch1, watch2]);
const combined = combinedWatch();
console.log(combined[0].value);  // 10
console.log(combined[1].value);  // 20`}
      />

      <h2>모범 사례</h2>

      <ul>
        <li>
          <strong>순수한 계산 유지</strong> - 콜백에서 사이드 이펙트 없이
        </li>
        <li>
          <strong>필요한 값만 접근</strong> - 사용하지 않는 프로퍼티는 읽지 않기
        </li>
        <li>
          <strong>파생 상태에 사용</strong> - 다른 상태에 의존하는 값에 완벽
        </li>
        <li>
          <strong>수동 구독보다 선호</strong> - 더 깔끔하고 효율적
        </li>
      </ul>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/create-store">createStore</a> - 소스 스토어 생성
        </li>
        <li>
          <a href="#/ko/guide/combine-watch">combineWatch</a> - 여러 watch 그룹화
        </li>
        <li>
          <a href="#/ko/guide/subscription">구독</a> - 구독 이해하기
        </li>
        <li>
          <a href="#/ko/guide/react">React 연동</a> - React와 함께 사용
        </li>
      </ul>
    </div>
  );
});
