import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ApiTypesKo = mount(() => {
  return () => (
    <div>
      <h1>TypeScript 타입</h1>

      <p>
        이 페이지는 <code>state-ref</code>에서 내보내는 TypeScript 타입들을 문서화합니다.
        이 타입들은 스토어 작업 시 완전한 타입 안전성을 제공합니다.
      </p>

      <h2>타입 가져오기</h2>

      <CodeBlock
        language="typescript"
        code={`import type {
  StateRefStore,
  Watch,
  Renew,
  ManualSyncStore,
  Copyable
} from 'state-ref';`}
      />

      <h2>핵심 타입</h2>

      <h3>StateRefStore&lt;S&gt;</h3>

      <p>
        watch 함수를 호출할 때 반환되는 프록시 타입입니다.
        <code>.value</code> 프로퍼티를 통해 상태에 대한 반응형 접근을 제공합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type StateRefStore<S> = S extends object
  ? {
      [K in keyof S]: StateRefStore<S[K]>;
    } & {
      value: S;
    }
  : { value: S };`}
      />

      <h4>동작</h4>

      <ul>
        <li>
          <strong>객체 타입</strong>: 각 프로퍼티가 중첩된 <code>StateRefStore</code>가 되고,
          전체 객체를 위한 <code>.value</code> 프로퍼티가 추가됨
        </li>
        <li>
          <strong>원시 타입</strong>: <code>.value</code> 프로퍼티만 있는 간단한 래퍼
        </li>
      </ul>

      <h4>예제</h4>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import type { StateRefStore } from 'state-ref';

// 객체 타입의 경우
interface User {
  name: string;
  age: number;
}

const userWatch = createStore<User>({ name: 'John', age: 30 });
const userRef: StateRefStore<User> = userWatch();

// 타입 구조:
// userRef.name        → StateRefStore<string>
// userRef.name.value  → string
// userRef.age         → StateRefStore<number>
// userRef.age.value   → number
// userRef.value       → User

// 원시 타입의 경우
const countWatch = createStore<number>(0);
const countRef: StateRefStore<number> = countWatch();

// 타입 구조:
// countRef.value → number`}
      />

      <h3>Watch&lt;V&gt;</h3>

      <p>
        <code>createStore</code>가 반환하는 함수 타입입니다.
        스토어에 접근하거나 변경을 구독하는 데 사용됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type Watch<V> = (
  renew?: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean; editable?: boolean }
) => StateRefStore<V>;`}
      />

      <h4>매개변수</h4>

      <table>
        <thead>
          <tr>
            <th>매개변수</th>
            <th>타입</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>renew</code></td>
            <td><code>Renew&lt;StateRefStore&lt;V&gt;&gt;</code></td>
            <td>구독을 위한 선택적 콜백</td>
          </tr>
          <tr>
            <td><code>userOption.cache</code></td>
            <td><code>boolean</code></td>
            <td>동일한 renew에 대해 프록시 캐시 (기본값: true)</td>
          </tr>
          <tr>
            <td><code>userOption.editable</code></td>
            <td><code>boolean</code></td>
            <td>수정 허용 (기본값: true)</td>
          </tr>
        </tbody>
      </table>

      <h4>예제</h4>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import type { Watch } from 'state-ref';

interface AppState {
  count: number;
  user: { name: string };
}

// Watch 타입이 추론됨
const watch = createStore<AppState>({ count: 0, user: { name: 'John' } });

// 명시적 타입 어노테이션
const typedWatch: Watch<AppState> = watch;

// 콜백 없이 호출 - 참조만 가져오기
const ref = typedWatch();

// 콜백과 함께 호출 - 변경 구독
typedWatch((store, isFirst) => {
  console.log(store.count.value);
});`}
      />

      <h3>Renew&lt;G&gt;</h3>

      <p>
        스토어 구독을 위한 콜백 함수 타입입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type Renew<G> = (
  store: G,
  isFirst: boolean
) => boolean | AbortSignal | void;`}
      />

      <h4>매개변수</h4>

      <table>
        <thead>
          <tr>
            <th>매개변수</th>
            <th>타입</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>store</code></td>
            <td><code>G</code></td>
            <td>StateRefStore 프록시</td>
          </tr>
          <tr>
            <td><code>isFirst</code></td>
            <td><code>boolean</code></td>
            <td>첫 번째 호출 시 true</td>
          </tr>
        </tbody>
      </table>

      <h4>반환값</h4>

      <table>
        <thead>
          <tr>
            <th>반환 타입</th>
            <th>효과</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>void</code></td>
            <td>구독 계속</td>
          </tr>
          <tr>
            <td><code>false</code></td>
            <td>즉시 구독 취소</td>
          </tr>
          <tr>
            <td><code>AbortSignal</code></td>
            <td>시그널 abort 시 구독 취소</td>
          </tr>
        </tbody>
      </table>

      <h4>예제</h4>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import type { Renew, StateRefStore } from 'state-ref';

interface Counter {
  value: number;
}

const watch = createStore<Counter>({ value: 0 });

// 명시적 renew 함수 타입
const callback: Renew<StateRefStore<Counter>> = (store, isFirst) => {
  const value = store.value.value;
  if (isFirst) return;

  console.log('값 변경됨:', value);

  // false 반환으로 구독 취소
  if (value >= 10) {
    return false;
  }
};

watch(callback);`}
      />

      <h3>ManualSyncStore&lt;V&gt;</h3>

      <p>
        <code>createStoreManualSync</code>의 반환 타입입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type ManualSyncStore<V> = {
  watch: Watch<V>;
  updateRef: StateRefStore<V>;
  sync: () => void;
};`}
      />

      <h4>프로퍼티</h4>

      <table>
        <thead>
          <tr>
            <th>프로퍼티</th>
            <th>타입</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>watch</code></td>
            <td><code>Watch&lt;V&gt;</code></td>
            <td>구독을 위한 watch 함수</td>
          </tr>
          <tr>
            <td><code>updateRef</code></td>
            <td><code>StateRefStore&lt;V&gt;</code></td>
            <td>값 업데이트를 위한 참조</td>
          </tr>
          <tr>
            <td><code>sync</code></td>
            <td><code>() =&gt; void</code></td>
            <td>동기화를 트리거하는 함수</td>
          </tr>
        </tbody>
      </table>

      <h4>예제</h4>

      <CodeBlock
        language="typescript"
        code={`import { createStoreManualSync } from 'state-ref';
import type { ManualSyncStore } from 'state-ref';

interface State {
  items: string[];
}

const store: ManualSyncStore<State> = createStoreManualSync({ items: [] });

const { watch, updateRef, sync } = store;

// 구독
watch((ref, isFirst) => {
  const items = ref.items.value;
  if (isFirst) return;
  console.log('항목 동기화됨:', items);
});

// 알림 없이 업데이트
updateRef.items.value = ['a', 'b', 'c'];

// 수동 동기화
sync();`}
      />

      <h2>헬퍼 타입</h2>

      <h3>Copyable&lt;T, Root&gt;</h3>

      <p>
        <code>copyable</code> 함수가 반환하는 타입입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(value: V) => Root;
};`}
      />

      <h4>예제</h4>

      <CodeBlock
        language="typescript"
        code={`import { copyable } from 'state-ref';
import type { Copyable } from 'state-ref';

interface State {
  user: {
    name: string;
    age: number;
  };
}

const state: State = { user: { name: 'John', age: 30 } };

// Copyable이 타입을 감쌈
const wrapped: Copyable<State> = copyable(state);

// 탐색하고 writeCopy 가져오기
const newState: State = wrapped.user.name.writeCopy('Jane');`}
      />

      <h3>StateRefsTuple&lt;W&gt;</h3>

      <p>
        Watch 타입 배열을 StateRefStore 타입 배열로 변환하는 유틸리티 타입입니다.
        <code>createComputed</code>와 <code>combineWatch</code>에서 내부적으로 사용됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type StateRefsTuple<W extends readonly Watch<any>[]> = {
  -readonly [K in keyof W]: W[K] extends Watch<infer T>
    ? StateRefStore<T>
    : never;
};`}
      />

      <h4>예제</h4>

      <CodeBlock
        language="typescript"
        code={`import { createStore, createComputed } from 'state-ref';

const watch1 = createStore(10);      // Watch<number>
const watch2 = createStore('hello'); // Watch<string>

// createComputed 콜백에서 refs는 StateRefsTuple<[Watch<number>, Watch<string>]>
// 이는 [StateRefStore<number>, StateRefStore<string>]와 같음
const computed = createComputed(
  [watch1, watch2],
  ([numRef, strRef]) => {
    // numRef: StateRefStore<number>
    // strRef: StateRefStore<string>
    return \`\${strRef.value}: \${numRef.value}\`;
  }
);`}
      />

      <h3>CombinedValue&lt;W&gt;</h3>

      <p>
        Watch 타입 배열에서 값 타입을 추출하는 유틸리티 타입입니다.
        <code>combineWatch</code> 반환 타입에서 사용됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type CombinedValue<W extends readonly Watch<any>[]> = {
  [K in keyof W]: W[K] extends Watch<infer T> ? T : never;
};`}
      />

      <h4>예제</h4>

      <CodeBlock
        language="typescript"
        code={`import { createStore, combineWatch } from 'state-ref';

const numWatch = createStore(10);       // Watch<number>
const strWatch = createStore('hello');  // Watch<string>

// combineWatch는 Watch<CombinedValue<[Watch<number>, Watch<string>]>> 반환
// 이는 Watch<[number, string]>와 같음
const combined = combineWatch([numWatch, strWatch]);

// 스토어 타입은 StateRefStore<[number, string]>
const store = combined();`}
      />

      <h2>내부 타입</h2>

      <p>
        이 타입들은 내부적으로 사용되며 일반적인 사용에는 필요하지 않습니다.
      </p>

      <h3>StoreType&lt;V&gt;</h3>

      <CodeBlock
        language="typescript"
        code={`type StoreType<V> = { root: V };`}
      />

      <p>스토어 값에 root 프로퍼티를 추가하는 내부 래퍼입니다.</p>

      <h3>Run</h3>

      <CodeBlock
        language="typescript"
        code={`type Run = null | ((isFirst?: boolean) => boolean | AbortSignal | void);`}
      />

      <p>구독자 함수를 위한 내부 타입입니다.</p>

      <h3>RunInfo&lt;A&gt;</h3>

      <CodeBlock
        language="typescript"
        code={`type RunInfo<A> = {
  value: A;
  getNextValue: () => A;
  key: string;
  primitiveSetter?: (newValue: A) => void;
};`}
      />

      <p>구독 정보를 추적하기 위한 내부 타입입니다.</p>

      <h3>StoreRenderList&lt;A&gt;</h3>

      <CodeBlock
        language="typescript"
        code={`type RenderListSub<A> = Map<string, RunInfo<A>>;
type StoreRenderList<A> = Map<Run, RenderListSub<A>>;`}
      />

      <p>구독자 목록을 관리하기 위한 내부 타입입니다.</p>

      <h2>타입 요약</h2>

      <table>
        <thead>
          <tr>
            <th>타입</th>
            <th>목적</th>
            <th>자주 사용</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>StateRefStore&lt;S&gt;</code></td>
            <td>프록시 스토어 타입</td>
            <td>예</td>
          </tr>
          <tr>
            <td><code>Watch&lt;V&gt;</code></td>
            <td>Watch 함수 타입</td>
            <td>예</td>
          </tr>
          <tr>
            <td><code>Renew&lt;G&gt;</code></td>
            <td>구독 콜백 타입</td>
            <td>예</td>
          </tr>
          <tr>
            <td><code>ManualSyncStore&lt;V&gt;</code></td>
            <td>수동 동기화 스토어 타입</td>
            <td>예</td>
          </tr>
          <tr>
            <td><code>Copyable&lt;T&gt;</code></td>
            <td>Copyable 래퍼 타입</td>
            <td>가끔</td>
          </tr>
          <tr>
            <td><code>StateRefsTuple&lt;W&gt;</code></td>
            <td>computed용 유틸리티</td>
            <td>드물게</td>
          </tr>
          <tr>
            <td><code>CombinedValue&lt;W&gt;</code></td>
            <td>combine용 유틸리티</td>
            <td>드물게</td>
          </tr>
        </tbody>
      </table>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/api/core">코어 API</a> - createStore, createComputed, combineWatch
        </li>
        <li>
          <a href="#/ko/api/helpers">헬퍼 API</a> - lens, copyable, cloneDeep
        </li>
        <li>
          <a href="#/ko/guide/subscription">구독 가이드</a> - Renew 콜백 이해하기
        </li>
      </ul>
    </div>
  );
});
