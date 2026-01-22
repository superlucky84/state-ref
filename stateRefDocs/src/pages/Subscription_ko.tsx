import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SubscriptionKo = mount(() => {
  return () => (
    <div>
      <h1>구독</h1>

      <p>
        StateRef의 구독을 사용하면 상태 변경에 자동으로 반응할 수 있습니다.
        <code>watch()</code> 함수에 콜백을 전달하면 추적된 프로퍼티가 변경될 때마다
        실행되는 구독이 생성됩니다.
      </p>

      <h2>기본 구독</h2>

      <p>
        <code>watch()</code>에 콜백 함수를 전달하여 구독을 생성합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });

// 변경 사항 구독
watch((store, isFirst) => {
  console.log('상태 변경됨!');
  console.log('Count:', store.count.value);
  console.log('Name:', store.name.value);
  console.log('첫 실행?', isFirst);
});

// 구독 트리거
const ref = watch();
ref.count.value = 10;  // 위의 모든 값 로그`}
      />

      <h2>구독 콜백 시그니처</h2>

      <p>
        구독 콜백은 두 개의 파라미터를 받으며 선택적으로 <code>AbortSignal</code>을 반환할 수 있습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`type RenewCallback<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => void | AbortSignal;

// 사용 예제
watch((store, isFirst) => {
  // store: StateRefStore - 추적되는 참조
  // isFirst: boolean - 첫 실행에는 true, 업데이트에는 false

  console.log(store.count.value);

  // 정리를 위해 선택적으로 AbortSignal 반환
  return abortController.signal;
});`}
      />

      <h2>isFirst 파라미터</h2>

      <p>
        <code>isFirst</code> 파라미터는 초기 실행인지 이후 업데이트인지를 나타냅니다.
        설정 로직에 유용합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ userId: null, data: null });

watch((store, isFirst) => {
  if (isFirst) {
    // 초기 구독 시 한 번만 실행
    console.log('구독 초기화됨');
    return;
  }

  // 모든 업데이트마다 실행
  if (store.userId.value) {
    console.log('사용자 데이터 가져오기:', store.userId.value);
    fetchUserData(store.userId.value);
  }
});`}
      />

      <h3>일반적인 isFirst 패턴</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ items: [] });

// 패턴 1: 초기 실행 건너뛰기
watch((store, isFirst) => {
  if (isFirst) return;
  console.log('아이템 업데이트됨:', store.items.value);
});

// 패턴 2: 초기 vs 업데이트에 다른 로직
watch((store, isFirst) => {
  if (isFirst) {
    console.log('초기 아이템:', store.items.value);
  } else {
    console.log('아이템 변경됨:', store.items.value);
  }
});

// 패턴 3: 둘 다 실행하지만 조건부 로직
watch((store, isFirst) => {
  console.log(isFirst ? '아이템 로딩' : '아이템 재로딩');
  loadItems(store.items.value);
});`}
      />

      <h2>AbortController로 구독 취소하기</h2>

      <p>
        <code>AbortController</code>를 사용하여 더 이상 필요하지 않은 구독을 취소합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });
const controller = new AbortController();

// 콜백에서 abort 시그널 반환
watch((store) => {
  console.log('Count:', store.count.value);
  return controller.signal;
});

const ref = watch();
ref.count.value = 1;  // ✓ 구독 트리거

// 구독 취소
controller.abort();

ref.count.value = 2;  // ✗ 트리거 안 함 (구독 취소됨)`}
      />

      <h3>컴포넌트 정리 패턴</h3>

      <CodeBlock
        language="typescript"
        code={`const Component = () => {
  const controller = new AbortController();

  // 정리와 함께 구독
  const store = appWatch((innerRef) => {
    console.log('컴포넌트 상태:', innerRef.value);
    return controller.signal;
  });

  // 컴포넌트 언마운트 시 정리
  onUnmount(() => {
    controller.abort();
  });

  return <div>{store.value}</div>;
};`}
      />

      <h2>여러 구독</h2>

      <p>
        동일한 스토어에 여러 독립적인 구독을 만들 수 있습니다.
        각 구독은 접근하는 프로퍼티만 추적합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  count: 0,
  name: 'StateRef',
  theme: 'dark'
});

// 구독 1: count 추적
const controller1 = new AbortController();
watch((store) => {
  console.log('Count 구독:', store.count.value);
  return controller1.signal;
});

// 구독 2: name 추적
const controller2 = new AbortController();
watch((store) => {
  console.log('Name 구독:', store.name.value);
  return controller2.signal;
});

// 구독 3: count와 theme 추적
const controller3 = new AbortController();
watch((store) => {
  console.log('멀티 구독:', store.count.value, store.theme.value);
  return controller3.signal;
});

const ref = watch();

ref.count.value = 10;   // 구독 1과 3 트리거
ref.name.value = 'New'; // 구독 2만 트리거
ref.theme.value = 'light'; // 구독 3만 트리거`}
      />

      <h2>구독 생명주기</h2>

      <p>
        구독 생명주기를 이해하면 메모리 누수와 예상치 못한 동작을 방지할 수 있습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });

// 1. 구독 생성
const controller = new AbortController();

const trackedRef = watch((store, isFirst) => {
  // 2. 콜백 즉시 실행 (isFirst = true)
  console.log('구독 실행 중, isFirst:', isFirst);
  console.log('Count:', store.count.value);

  // 3. 정리를 위한 시그널 반환
  return controller.signal;
});

// 4. 상태 변경이 콜백 트리거 (isFirst = false)
trackedRef.count.value = 10;

// 5. Abort 시그널이 구독 취소
controller.abort();

// 6. 구독 정리됨, 더 이상 콜백 없음
trackedRef.count.value = 20;  // 콜백 트리거 안 됨`}
      />

      <h2>선택적 프로퍼티 추적</h2>

      <p>
        구독은 콜백 중에 추적되는 참조(innerRef/outerRef)를 통해 읽은 프로퍼티에만 반응합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'ko' }
});

const unboundRef = watch();

watch((store) => {
  // user.name만 추적됨 (추적되는 참조로 읽음)
  console.log('이름:', store.user.name.value);

  // settings.theme는 추적 안 됨 (언바운드 참조로 읽음)
  console.log('테마:', unboundRef.settings.theme.value);
});

const ref = watch();

ref.user.name.value = 'Jane';        // ✓ 구독 트리거
ref.user.age.value = 31;             // ✗ 트리거 안 함 (age 접근 안 함)
ref.settings.theme.value = 'light';  // ✗ 트리거 안 함 (언바운드 참조로 읽음)`}
      />

      <h2>파생 상태 패턴</h2>

      <p>
        여러 프로퍼티에 의존하는 파생 상태를 계산하기 위해 구독을 사용합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  firstName: 'John',
  lastName: 'Doe',
  fullName: ''
});

// firstName이나 lastName이 변경될 때마다 fullName 업데이트
watch((store, isFirst) => {
  const fullName = \`\${store.firstName.value} \${store.lastName.value}\`;

  // 값이 실제로 변경되었는지 확인하여 무한 루프 방지
  if (store.fullName.value !== fullName) {
    store.fullName.value = fullName;
  }
});

const ref = watch();
ref.firstName.value = 'Jane';
// fullName이 자동으로 "Jane Doe"로 업데이트됨`}
      />

      <h2>사이드 이펙트 패턴</h2>

      <p>
        구독은 API 호출, 로깅, 분석과 같은 사이드 이펙트에 완벽합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ searchQuery: '', results: [] });

watch((store, isFirst) => {
  if (isFirst) return; // 초기 실행 건너뛰기

  const query = store.searchQuery.value;

  if (query.length > 2) {
    // 검색 쿼리 변경 시 API 호출 트리거
    fetch(\`/api/search?q=\${query}\`)
      .then(res => res.json())
      .then(data => {
        store.results.value = data;
      });
  }
});`}
      />

      <h3>디바운싱 패턴</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ searchQuery: '' });

watch((store, isFirst) => {
  if (isFirst) return;

  let timeoutId: NodeJS.Timeout;

  // API 호출 디바운싱
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    console.log('검색 중:', store.searchQuery.value);
    performSearch(store.searchQuery.value);
  }, 300);

  // 참고: 실제 앱에서는 AbortSignal이나 컴포넌트 생명주기를 통해
  // 타임아웃 정리를 관리해야 합니다
});`}
      />

      <h2>조건부 구독</h2>

      <p>
        애플리케이션 상태에 따라 조건부로 구독을 생성할 수 있습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  isLoggedIn: false,
  userId: null,
  userData: null
});

let userDataSubscription: AbortController | null = null;

// 로그인 시에만 사용자 상태 변경 구독
watch((store, isFirst) => {
  if (store.isLoggedIn.value) {
    // 사용자 로그인 - 구독 생성
    if (!userDataSubscription) {
      userDataSubscription = new AbortController();

      watch((innerStore) => {
        fetchUserData(innerStore.userId.value);
        return userDataSubscription!.signal;
      });
    }
  } else {
    // 사용자 로그아웃 - 구독 취소
    if (userDataSubscription) {
      userDataSubscription.abort();
      userDataSubscription = null;
    }
  }
});`}
      />

      <h2>구독 성능</h2>

      <p>
        다음 가이드라인을 따라 구독을 효율적으로 유지하세요:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ items: [], filter: '', sort: 'asc' });

// ✗ 나쁨: 모든 변경마다 비용이 많이 드는 작업 수행
watch((store) => {
  const filtered = store.items.value
    .filter(item => item.name.includes(store.filter.value))
    .sort((a, b) => store.sort.value === 'asc' ? a.id - b.id : b.id - a.id);

  // items가 변경되지 않았어도 모든 변경마다 실행됨
  console.log(filtered);
});

// ✓ 좋음: 비용이 많이 드는 파생 상태에 createComputed 사용
import { createComputed } from 'state-ref';

const filteredWatch = createComputed([watch], ([store]) => {
  return store.items.value
    .filter(item => item.name.includes(store.filter.value))
    .sort((a, b) => store.sort.value === 'asc' ? a.id - b.id : b.id - a.id);
});`}
      />

      <h2>모범 사례</h2>

      <ul>
        <li>
          <strong>항상 구독 정리</strong> - 메모리 누수를 방지하기 위해 AbortController 사용
        </li>
        <li>
          <strong>초기화에 isFirst 사용</strong> - 설정과 업데이트 구분
        </li>
        <li>
          <strong>콜백을 집중되게 유지</strong> - 각 구독은 단일 책임을 가져야 함
        </li>
        <li>
          <strong>무한 루프 방지</strong> - 값이 변경되었는지 확인하지 않고 추적된 프로퍼티를 업데이트하지 말기
        </li>
        <li>
          <strong>추적하는 것에 주의</strong> - 실제로 반응해야 하는 프로퍼티만 읽기
        </li>
        <li>
          <strong>파생 상태에 createComputed 사용</strong> - 수동 구독보다 효율적
        </li>
        <li>
          <strong>비용이 많이 드는 작업 디바운싱</strong> - 모든 업데이트마다 무거운 작업 수행하지 말기
        </li>
      </ul>

      <h2>일반적인 함정</h2>

      <h3>무한 루프</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });

// ✗ 나쁨: 무한 루프 생성
watch((store) => {
  store.count.value += 1;  // count 업데이트, 구독 다시 트리거
});

// ✓ 좋음: 조건부 로직 사용
watch((store, isFirst) => {
  if (!isFirst && store.count.value < 10) {
    store.count.value += 1;
  }
});`}
      />

      <h3>잊어버린 정리</h3>

      <CodeBlock
        language="typescript"
        code={`// ✗ 나쁨: 정리 없음
const Component = () => {
  watch((store) => {
    console.log(store.value);
    // 구독이 절대 정리되지 않음 - 메모리 누수!
  });
};

// ✓ 좋음: 항상 정리
const Component = () => {
  const controller = new AbortController();

  watch((store) => {
    console.log(store.value);
    return controller.signal;
  });

  onUnmount(() => controller.abort());
};`}
      />

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/watch">Watch 함수</a> - watch 함수 이해하기
        </li>
        <li>
          <a href="#/ko/guide/references">참조 이해하기</a> - 추적 작동 방식
        </li>
        <li>
          <a href="#/ko/guide/computed">createComputed</a> - 효율적인 파생 상태
        </li>
        <li>
          <a href="#/ko/guide/combine-watch">combineWatch</a> - 여러 구독 결합
        </li>
      </ul>
    </div>
  );
});
