import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const CustomConnectorKo = mount(() => {
  return () => (
    <div>
      <h1>커스텀 커넥터</h1>

      <p>
        StateRef를 어떤 UI 프레임워크와도 통합할 수 있는 커스텀 커넥터를 만드는 방법을 알아봅니다.
        이 가이드는 공식 커넥터에서 사용되는 패턴을 설명합니다.
      </p>

      <h2>핵심 개념</h2>

      <p>
        커넥터는 StateRef의 구독 시스템과 프레임워크의 반응성을 연결합니다:
      </p>

      <ul>
        <li>
          <strong>구독</strong>: <code>watch(callback)</code>을 호출하여 업데이트를 받습니다
        </li>
        <li>
          <strong>리렌더 트리거</strong>: StateRef가 알릴 때 프레임워크의 상태를 업데이트합니다
        </li>
        <li>
          <strong>정리</strong>: <code>AbortController</code>를 사용하여 언마운트 시 구독 해제합니다
        </li>
        <li>
          <strong>양방향 동기화</strong>: 선택적으로 프레임워크 상태를 StateRef로 다시 동기화합니다
        </li>
      </ul>

      <h2>Watch 콜백 시그니처</h2>

      <p>
        <code>watch</code> 함수는 다음 시그니처의 콜백을 받습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`type Renew<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => AbortSignal | void;`}
      />

      <ul>
        <li>
          <code>store</code>: 값을 읽고 쓰기 위한 StateRefStore
        </li>
        <li>
          <code>isFirst</code>: 초기 호출 시 <code>true</code>, 업데이트 시 <code>false</code>
        </li>
        <li>
          구독 해제를 위해 <code>AbortSignal</code>을 반환합니다
        </li>
      </ul>

      <h2>패턴 1: 직접 훅 (React 스타일)</h2>

      <p>
        가장 단순한 패턴은 스토어를 직접 제공하는 훅을 반환합니다.
        <code>connectReact</code>의 동작 방식입니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { useState, useRef, useEffect } from 'react';
import type { StateRefStore, Watch } from 'state-ref';

export function connectReact<T>(watch: Watch<T>) {
  // 커스텀 훅 팩토리 생성
  const useForceUpdate = () => {
    const [, setDummy] = useState(0);
    const abortController = useRef(new AbortController());

    // 갱신 콜백 생성
    const forceUpdateRef = useRef((
      _: StateRefStore<T>,
      isFirst: boolean
    ) => {
      // 첫 번째 호출(초기 구독)에서는 리렌더 건너뛰기
      if (!isFirst) {
        setDummy(prev => prev + 1);
      }
      // 정리를 위한 시그널 반환
      return abortController.current.signal;
    });

    // 언마운트 시 정리
    useEffect(() => () => abortController.current.abort(), []);

    return forceUpdateRef.current;
  };

  // 구독하고 스토어를 반환하는 훅 반환
  return () => watch(useForceUpdate());
}`}
      />

      <p>
        핵심 포인트:
      </p>

      <ul>
        <li>
          더미 카운터와 <code>useState</code>를 사용하여 강제 리렌더
        </li>
        <li>
          <code>isFirst</code> 검사로 불필요한 초기 리렌더 방지
        </li>
        <li>
          컴포넌트 언마운트 시 <code>AbortController</code>가 정리 처리
        </li>
        <li>
          <code>.value</code> 접근을 위해 <code>StateRefStore</code>를 직접 반환
        </li>
      </ul>

      <h2>패턴 2: 셀렉터 콜백 (Vue 스타일)</h2>

      <p>
        자체 반응성이 있는 프레임워크의 경우, 프레임워크 네이티브 반응형 객체를 반환하는
        셀렉터 패턴을 사용합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { reactive, watch, onUnmounted } from 'vue';
import type { Reactive, UnwrapRef } from 'vue';
import { cloneDeep } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';

export function connectVue<T>(refWatch: Watch<T>) {
  // 셀렉터를 받는 함수 반환
  return <V>(
    callback: (store: StateRefStore<T>) => StateRefStore<V>
  ): Reactive<{ value: V }> => {
    const abortController = new AbortController();
    let reactiveValue!: Reactive<{ value: V }>;
    let stateRef!: StateRefStore<V>;
    let changing = false;

    // 동기화 루프 방지 헬퍼
    const change = (cb: () => void) => {
      changing = true;
      cb();
      queueMicrotask(() => (changing = false));
    };

    // 언마운트 시 정리
    onUnmounted(() => abortController.abort());

    // StateRef 구독
    refWatch(stateInnerRef => {
      stateRef = callback(stateInnerRef);

      if (reactiveValue?.value !== stateRef.value && !changing) {
        change(() => {
          if (reactiveValue?.value) {
            reactiveValue.value = stateRef.value as UnwrapRef<V>;
          } else {
            reactiveValue = reactive({ value: stateRef.value });
          }
        });
      }

      return abortController.signal;
    });

    // 양방향 동기화를 위해 Vue reactive 감시
    watch(reactiveValue, newValues => {
      if (stateRef.value !== newValues.value && !changing) {
        const newV = typeof newValues.value === 'object'
          ? cloneDeep(newValues.value)
          : newValues.value;

        change(() => {
          stateRef.value = newV as V;
        });
      }
    });

    return reactiveValue;
  };
}`}
      />

      <p>
        핵심 포인트:
      </p>

      <ul>
        <li>
          셀렉터 콜백으로 사용자가 추적할 특정 프로퍼티 선택 가능
        </li>
        <li>
          프레임워크 네이티브 반응형 객체 반환 (Vue의 <code>Reactive</code>)
        </li>
        <li>
          <code>changing</code> 플래그로 무한 동기화 루프 방지
        </li>
        <li>
          <code>cloneDeep</code>으로 적절한 객체 복사 보장
        </li>
        <li>
          양방향 동기화: Vue 변경은 StateRef 업데이트, StateRef 변경은 Vue 업데이트
        </li>
      </ul>

      <h2>패턴 3: 시그널 쌍 (Solid 스타일)</h2>

      <p>
        시그널 패턴이 있는 프레임워크의 경우, getter/setter 쌍을 반환합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createSignal, onCleanup } from 'solid-js';
import type { Accessor, Setter } from 'solid-js';
import type { StateRefStore, Watch } from 'state-ref';

export function connectSolid<T>(refWatch: Watch<T>) {
  return <V>(
    callback: (store: StateRefStore<T>) => StateRefStore<V>
  ): [Accessor<V>, Setter<V>] => {
    const abortController = new AbortController();
    let stateRef!: StateRefStore<V>;
    let changing = false;

    const change = (cb: () => void) => {
      changing = true;
      cb();
      queueMicrotask(() => (changing = false));
    };

    // 초기값 가져오기
    const initialStore = refWatch();
    const initialRef = callback(initialStore);
    const [value, setValue] = createSignal<V>(initialRef.value);

    onCleanup(() => abortController.abort());

    // StateRef 변경 구독
    refWatch(stateInnerRef => {
      stateRef = callback(stateInnerRef);

      if (value() !== stateRef.value && !changing) {
        change(() => setValue(() => stateRef.value));
      }

      return abortController.signal;
    });

    // StateRef로 다시 동기화하는 커스텀 setter
    const customSetter: Setter<V> = (newValue) => {
      const resolvedValue = typeof newValue === 'function'
        ? (newValue as (prev: V) => V)(value())
        : newValue;

      if (stateRef.value !== resolvedValue && !changing) {
        change(() => {
          stateRef.value = resolvedValue as V;
          setValue(() => resolvedValue as V);
        });
      }

      return resolvedValue as V;
    };

    return [value, customSetter as Setter<V>];
  };
}`}
      />

      <h2>직접 커넥터 만들기</h2>

      <p>
        어떤 프레임워크든 커넥터를 만들려면 다음 단계를 따르세요:
      </p>

      <h3>1단계: 리렌더 메커니즘 파악</h3>

      <p>
        모든 UI 프레임워크에는 리렌더를 트리거하는 방법이 있습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// React: useState setter
const [, setDummy] = useState(0);
const rerender = () => setDummy(n => n + 1);

// Vue: reactive()
const state = reactive({ value: initialValue });
// state.value를 변경하면 리렌더 트리거

// Svelte: writable()
const store = writable(initialValue);
// store.set() 호출하면 리렌더 트리거

// Solid: createSignal()
const [value, setValue] = createSignal(initialValue);
// setValue() 호출하면 리렌더 트리거`}
      />

      <h3>2단계: 구독 설정</h3>

      <CodeBlock
        language="typescript"
        code={`const abortController = new AbortController();

watch(store => {
  // .value에 접근하여 추적 등록
  const currentValue = store.someProperty.value;

  // 여기서 프레임워크 상태 업데이트
  frameworkState = currentValue;

  // 정리를 위한 시그널 반환
  return abortController.signal;
});`}
      />

      <h3>3단계: 정리 처리</h3>

      <CodeBlock
        language="typescript"
        code={`// React
useEffect(() => () => abortController.abort(), []);

// Vue
onUnmounted(() => abortController.abort());

// Svelte
onDestroy(() => abortController.abort());

// Solid
onCleanup(() => abortController.abort());`}
      />

      <h3>4단계: 양방향 동기화 (선택)</h3>

      <CodeBlock
        language="typescript"
        code={`let changing = false;

const change = (cb: () => void) => {
  changing = true;
  cb();
  queueMicrotask(() => (changing = false));
};

// StateRef 변경 -> 프레임워크 업데이트
watch(store => {
  if (!changing) {
    change(() => {
      frameworkState = store.prop.value;
    });
  }
  return abortController.signal;
});

// 프레임워크 변경 -> StateRef 업데이트
frameworkWatch(newValue => {
  if (!changing) {
    change(() => {
      stateRef.prop.value = newValue;
    });
  }
});`}
      />

      <h2>최소 예제</h2>

      <p>
        가상의 프레임워크를 위한 최소 커넥터입니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import type { StateRefStore, Watch } from 'state-ref';

export function connectMyFramework<T>(watch: Watch<T>) {
  return () => {
    const abortController = new AbortController();
    let store!: StateRefStore<T>;

    // 구독
    watch((stateRef, isFirst) => {
      store = stateRef;

      if (!isFirst) {
        // 프레임워크의 메커니즘으로 리렌더 트리거
        myFrameworkRerender();
      }

      return abortController.signal;
    });

    // 정리 설정
    myFrameworkOnDestroy(() => abortController.abort());

    return store;
  };
}`}
      />

      <h2>중요 고려사항</h2>

      <ul>
        <li>
          <strong>isFirst 검사</strong>: 초기 구독에서 리렌더를 건너뛰어 이중 렌더 방지
        </li>
        <li>
          <strong>동기화 루프 방지</strong>: 양방향 바인딩에 <code>changing</code> 플래그 사용
        </li>
        <li>
          <strong>객체 복제</strong>: 시스템 간 객체 전달 시 <code>cloneDeep</code> 사용
        </li>
        <li>
          <strong>AbortController</strong>: 항상 시그널을 반환하고 정리 시 abort 호출
        </li>
        <li>
          <strong>queueMicrotask</strong>: 일괄 업데이트 처리를 위해 플래그를 비동기로 리셋
        </li>
      </ul>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/watch">Watch 함수</a> - watch 동작 이해
        </li>
        <li>
          <a href="#/ko/guide/subscription">구독</a> - 구독 패턴
        </li>
        <li>
          <a href="#/ko/guide/react">React</a> - React 커넥터 사용법
        </li>
        <li>
          <a href="#/ko/guide/vue">Vue</a> - Vue 커넥터 사용법
        </li>
        <li>
          <a href="#/ko/guide/lithent">Lithent</a> - 커넥터 없는 직접 통합
        </li>
      </ul>
    </div>
  );
});
