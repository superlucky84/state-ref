import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ApiCoreKo = mount(() => {
  return () => (
    <div>
      <h1>Core API</h1>

      <p>
        이 페이지는 <code>state-ref</code>에서 내보내는 핵심 함수들을 문서화합니다.
        이들은 상태 관리의 기본 구성 요소입니다.
      </p>

      <h2>createStore</h2>

      <p>
        주어진 초기값으로 반응형 스토어를 생성하고 watch 함수를 반환합니다.
      </p>

      <h3>시그니처</h3>

      <CodeBlock
        language="typescript"
        code={`function createStore<V>(initialValue: V): Watch<V>`}
      />

      <h3>매개변수</h3>

      <ul>
        <li>
          <code>initialValue: V</code> - 스토어의 초기값. 원시 타입(number, string, boolean)
          또는 객체/배열이 될 수 있습니다.
        </li>
      </ul>

      <h3>반환값</h3>

      <p>
        스토어에 접근하거나 변경을 구독할 수 있는 <code>Watch&lt;V&gt;</code> 함수를 반환합니다.
      </p>

      <h3>예제</h3>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

// 원시 타입 스토어
const countWatch = createStore(0);

// 객체 스토어
const userWatch = createStore({ name: 'John', age: 30 });

// 배열 스토어
const itemsWatch = createStore(['a', 'b', 'c']);

// 구독 없이 접근
const count = countWatch();
console.log(count.value);  // 0

// 구독과 함께 접근
countWatch((ref, isFirst) => {
  const value = ref.value;  // 구독을 위해 먼저 접근
  if (isFirst) return;
  console.log('Count 변경됨:', value);
});`}
      />

      <h2>createStoreManualSync</h2>

      <p>
        수동 동기화 제어가 있는 스토어를 생성합니다. <code>sync()</code>가 호출될 때까지
        업데이트가 구독자에게 자동으로 전파되지 않습니다.
      </p>

      <h3>시그니처</h3>

      <CodeBlock
        language="typescript"
        code={`function createStoreManualSync<V>(initialValue: V): ManualSyncStore<V>

type ManualSyncStore<V> = {
  watch: Watch<V>;           // 읽기 전용 구독
  updateRef: StateRefStore<V>;  // 업데이트용 참조
  sync: () => void;          // 동기화 트리거
}`}
      />

      <h3>매개변수</h3>

      <ul>
        <li>
          <code>initialValue: V</code> - 스토어의 초기값.
        </li>
      </ul>

      <h3>반환값</h3>

      <p>
        세 가지 프로퍼티를 가진 <code>ManualSyncStore&lt;V&gt;</code> 객체를 반환합니다:
      </p>

      <ul>
        <li>
          <code>watch</code> - 읽기 전용 구독을 위한 watch 함수
        </li>
        <li>
          <code>updateRef</code> - 값 업데이트를 위한 참조 (쓰기가 구독자를 트리거하지 않음)
        </li>
        <li>
          <code>sync()</code> - 모든 대기 중인 업데이트를 구독자에게 수동으로 트리거하는 함수
        </li>
      </ul>

      <h3>예제</h3>

      <CodeBlock
        language="typescript"
        code={`import { createStoreManualSync } from 'state-ref';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

// 변경 사항 구독
watch((ref, isFirst) => {
  const count = ref.count.value;
  if (isFirst) return;
  console.log('동기화된 count:', count);
});

// 값 업데이트 (아직 구독자 알림 없음)
updateRef.count.value = 10;
updateRef.count.value = 20;
updateRef.count.value = 30;

// 수동 동기화 - 구독자는 최종 값으로 한 번만 알림 받음
sync();
// 로그: "동기화된 count: 30"`}
      />

      <h2>createComputed</h2>

      <p>
        하나 이상의 watch에서 계산된(파생) 값을 생성합니다. 계산된 값은 읽기 전용이며
        소스 스토어가 변경되면 자동으로 업데이트됩니다.
      </p>

      <h3>시그니처</h3>

      <CodeBlock
        language="typescript"
        code={`function createComputed<W extends readonly Watch<any>[], R>(
  watches: W,
  callback: (refs: StateRefsTuple<W>) => R
): (computedCallback?: (proxy: { value: R }, isFirst: boolean) => void) => { value: R }`}
      />

      <h3>매개변수</h3>

      <ul>
        <li>
          <code>watches: W</code> - 결합할 watch 함수 배열
        </li>
        <li>
          <code>callback: (refs) =&gt; R</code> - 스토어 참조를 받아 계산된 값을 반환하는 함수
        </li>
      </ul>

      <h3>반환값</h3>

      <p>
        <code>.value</code>를 통해 계산된 값에 접근할 수 있는 watch 유사 함수를 반환합니다.
        반환된 값은 읽기 전용이며, 설정하려고 하면 경고가 표시됩니다.
      </p>

      <h3>예제</h3>

      <CodeBlock
        language="typescript"
        code={`import { createStore, createComputed } from 'state-ref';

const priceWatch = createStore(100);
const quantityWatch = createStore(3);

// 계산된 값 생성
const totalWatch = createComputed(
  [priceWatch, quantityWatch],
  ([price, quantity]) => price.value * quantity.value
);

// 계산된 값 접근
const total = totalWatch();
console.log(total.value);  // 300

// 계산된 값 변경 구독
totalWatch((ref, isFirst) => {
  const value = ref.value;
  if (isFirst) return;
  console.log('Total 변경됨:', value);
});

// 소스 업데이트가 재계산 트리거
const price = priceWatch();
price.value = 150;
// 로그: "Total 변경됨: 450"`}
      />

      <h2>combineWatch</h2>

      <p>
        여러 watch를 값을 튜플로 전달하는 단일 watch로 결합합니다.
        <code>createComputed</code>와 달리 개별 스토어 접근을 유지합니다.
      </p>

      <h3>시그니처</h3>

      <CodeBlock
        language="typescript"
        code={`function combineWatch<W extends readonly Watch<any>[]>(
  watches: [...W]
): Watch<CombinedValue<W>>`}
      />

      <h3>매개변수</h3>

      <ul>
        <li>
          <code>watches: W</code> - 결합할 watch 함수 배열
        </li>
      </ul>

      <h3>반환값</h3>

      <p>
        새로운 <code>Watch</code> 함수를 반환합니다. 반환된 스토어는 인덱스로 개별 스토어에
        접근할 수 있습니다 (예: <code>combined[0]</code>, <code>combined[1]</code>).
      </p>

      <h3>예제</h3>

      <CodeBlock
        language="typescript"
        code={`import { createStore, combineWatch } from 'state-ref';

const userWatch = createStore({ name: 'John' });
const settingsWatch = createStore({ theme: 'dark' });

// watch 결합
const combinedWatch = combineWatch([userWatch, settingsWatch]);

// 인덱스로 접근
const combined = combinedWatch();
console.log(combined[0].name.value);  // 'John'
console.log(combined[1].theme.value); // 'dark'

// 모든 변경 구독
combinedWatch(([user, settings], isFirst) => {
  const name = user.name.value;
  const theme = settings.theme.value;
  if (isFirst) return;
  console.log(\`사용자: \${name}, 테마: \${theme}\`);
});`}
      />

      <h2>Watch 함수</h2>

      <p>
        <code>Watch</code> 타입은 <code>createStore</code>가 반환하는 함수를 나타냅니다.
      </p>

      <h3>타입 정의</h3>

      <CodeBlock
        language="typescript"
        code={`type Watch<V> = (
  renew?: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean; editable?: boolean }
) => StateRefStore<V>`}
      />

      <h3>매개변수</h3>

      <ul>
        <li>
          <code>renew</code> (선택) - 상태 변경 시 호출되는 콜백 함수
        </li>
        <li>
          <code>userOption.cache</code> (선택, 기본값: <code>true</code>) - 동일한 renew 함수에
          대해 프록시를 캐시할지 여부
        </li>
        <li>
          <code>userOption.editable</code> (선택, 기본값: <code>true</code>) - 반환된 참조가
          스토어를 수정할 수 있는지 여부
        </li>
      </ul>

      <h3>Renew 콜백</h3>

      <CodeBlock
        language="typescript"
        code={`type Renew<G> = (
  store: G,
  isFirst: boolean
) => boolean | AbortSignal | void

// AbortSignal 사용 예제
const controller = new AbortController();

watch((ref, isFirst) => {
  const value = ref.value;
  if (isFirst) return controller.signal;
  console.log('Value:', value);
});

// 나중에 구독 취소
controller.abort();`}
      />

      <h2>StateRefStore</h2>

      <p>
        <code>StateRefStore</code> 타입은 watch 함수를 호출할 때 반환되는 프록시 객체를
        나타냅니다. <code>.value</code> 프로퍼티를 통해 상태에 대한 반응형 접근을 제공합니다.
      </p>

      <h3>타입 정의</h3>

      <CodeBlock
        language="typescript"
        code={`type StateRefStore<S> = S extends object
  ? {
      [K in keyof S]: StateRefStore<S[K]>;
    } & {
      value: S;
    }
  : { value: S }`}
      />

      <h3>동작</h3>

      <ul>
        <li>
          <strong>객체 타입</strong>: 중첩된 프로퍼티를 탐색할 수 있으며, 각각 자체 <code>.value</code>를 가짐
        </li>
        <li>
          <strong>원시 타입</strong>: <code>.value</code>로 접근 및 수정
        </li>
        <li>
          <strong><code>.value</code> 읽기</strong>: 해당 프로퍼티에 대한 구독 등록
        </li>
        <li>
          <strong><code>.value</code> 쓰기</strong>: 스토어를 업데이트하고 구독자에게 알림
        </li>
      </ul>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ user: { name: 'John', age: 30 } });
const ref = watch();

// 깊은 탐색
ref.user.name.value;           // 'John'
ref.user.age.value;            // 30
ref.user.value;                // { name: 'John', age: 30 }
ref.value;                     // { user: { name: 'John', age: 30 } }

// 업데이트
ref.user.name.value = 'Jane';  // 업데이트하고 알림
ref.user.value = { name: 'Bob', age: 25 };  // 전체 user 객체 교체`}
      />

      <h2>ManualSyncStore</h2>

      <p>
        <code>createStoreManualSync</code>가 반환하는 타입입니다.
      </p>

      <h3>타입 정의</h3>

      <CodeBlock
        language="typescript"
        code={`type ManualSyncStore<V> = {
  watch: Watch<V>;           // 변경 구독용
  updateRef: StateRefStore<V>;  // 값 업데이트용
  sync: () => void;          // 동기화 트리거용
}`}
      />

      <h2>요약 표</h2>

      <table>
        <thead>
          <tr>
            <th>함수</th>
            <th>목적</th>
            <th>자동 동기화</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>createStore</code></td>
            <td>반응형 스토어 생성</td>
            <td>예</td>
          </tr>
          <tr>
            <td><code>createStoreManualSync</code></td>
            <td>수동 동기화 제어가 있는 스토어 생성</td>
            <td>아니오</td>
          </tr>
          <tr>
            <td><code>createComputed</code></td>
            <td>스토어에서 새 값 파생</td>
            <td>예</td>
          </tr>
          <tr>
            <td><code>combineWatch</code></td>
            <td>스토어를 튜플로 그룹화</td>
            <td>예</td>
          </tr>
        </tbody>
      </table>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/create-store">createStore 가이드</a> - 상세 사용 가이드
        </li>
        <li>
          <a href="#/ko/guide/watch">Watch 함수 가이드</a> - watch 함수 이해하기
        </li>
        <li>
          <a href="#/ko/guide/manual-sync">수동 동기화 가이드</a> - 수동 동기화를 통한 Flux 패턴
        </li>
        <li>
          <a href="#/ko/api/helpers">헬퍼 API</a> - lens, copyable, cloneDeep
        </li>
        <li>
          <a href="#/ko/api/types">TypeScript 타입</a> - 전체 타입 정의
        </li>
      </ul>
    </div>
  );
});
