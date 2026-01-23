import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ManualSyncKo = mount(() => {
  return () => (
    <div>
      <h1>수동 동기화 (Flux)</h1>

      <p>
        <code>createStoreManualSync</code>는 업데이트를 언제 구독자에게
        전파할지 직접 제어합니다. Flux 스타일의 액션 흐름, 여러 변경을
        배치 처리, “뷰는 읽기 전용” 규칙을 적용할 때 유용합니다.
      </p>

      <h2>기본 사용법</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStoreManualSync } from 'state-ref';

const { watch, updateRef, sync } = createStoreManualSync({
  count: 0,
  user: { name: 'Lee' }
});

// 구독 (읽기가 추적됨)
watch((store, isFirst) => {
  console.log('Count:', store.count.value, 'First?', isFirst);
});

// 소비자용 읽기 전용 참조
const store = watch();
console.log(store.user.name.value); // 'Lee'

// updateRef로 변경
updateRef.count.value += 1;
updateRef.user.name.value = 'Min';

// 변경 사항 전파
sync();`}
      />

      <h2>동작 방식</h2>

      <ul>
        <li>
          <strong>watch</strong>는 수동 모드에서 읽기 전용 참조를 반환
        </li>
        <li>
          <strong>updateRef</strong>는 액션에서 사용하는 쓰기 전용 참조
        </li>
        <li>
          <strong>sync()</strong>가 변경을 플러시하고 구독을 트리거
        </li>
      </ul>

      <h2>뷰에서 읽기 전용</h2>

      <p>
        수동 동기화에서는 <code>watch()</code>로 받은 참조를 직접 수정할 수
        없습니다. 반드시 <code>updateRef</code>로 업데이트하세요.
      </p>

      <CodeBlock
        language="typescript"
        code={`const { watch, updateRef } = createStoreManualSync({ count: 0 });

const store = watch();

// ✗ 수동 동기화에서는 불가
store.count.value = 1; // Error: direct modification is not allowed

// ✓ 가능
updateRef.count.value = 1;`}
      />

      <h2>Flux 스타일 액션</h2>

      <p>
        변경 로직을 액션 함수로 모으고, 마지막에 <code>sync()</code>로
        전파하세요.
      </p>

      <CodeBlock
        language="typescript"
        code={`type Profile = { john: { age: number } };

const { watch, updateRef, sync } = createStoreManualSync<Profile>({
  john: { age: 20 }
});

export const changeJohnAge = (age: number) => {
  updateRef.john.age.value = age;
  sync();
};

// 뷰 레이어
watch(store => {
  console.log('John age:', store.john.age.value);
});`}
      />

      <h2>여러 변경 배치 처리</h2>

      <p>
        여러 값을 변경한 뒤 <code>sync()</code>를 한 번만 호출하면
        불필요한 렌더링이나 부수 효과를 줄일 수 있습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const { updateRef, sync } = createStoreManualSync({
  count: 0,
  theme: 'light',
  sidebar: true
});

updateRef.count.value += 1;
updateRef.theme.value = 'dark';
updateRef.sidebar.value = false;

// 한 번에 플러시
sync();`}
      />

      <h2>프레임워크 커넥터와 함께 사용</h2>

      <p>
        수동 동기화에서도 <code>watch</code>는 구독의 출발점이므로
        커넥터와 함께 사용할 수 있습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStoreManualSync } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectReact(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};

function Counter() {
  const { count } = useCounterStore();
  return <button onClick={increment}>{count.value}</button>;
}`}
      />

      <h2>API 요약</h2>

      <ul>
        <li>
          <code>createStoreManualSync(initial)</code> →{' '}
          <code>{`{ watch, updateRef, sync }`}</code>
        </li>
        <li>
          <code>watch(callback?)</code> - 구독 또는 읽기 전용 참조 획득
        </li>
        <li>
          <code>updateRef</code> - 액션에서 사용하는 쓰기 참조
        </li>
        <li>
          <code>sync()</code> - 변경 사항을 구독자에게 전파
        </li>
      </ul>

      <h2>모범 사례</h2>

      <ul>
        <li>
          <strong>쓰기 로직을 액션으로 중앙화</strong>
        </li>
        <li>
          <strong>여러 변경을 묶고</strong> <code>sync()</code>를 한 번 호출
        </li>
        <li>
          <strong>뷰는 읽기 전용</strong>으로 유지
        </li>
      </ul>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/create-store">createStore</a> - 자동 동기화 모드
        </li>
        <li>
          <a href="#/ko/guide/watch">Watch 함수</a> - 구독 기본
        </li>
        <li>
          <a href="#/ko/guide/subscription">구독</a> - 라이프사이클과 해제
        </li>
      </ul>
    </div>
  );
});
