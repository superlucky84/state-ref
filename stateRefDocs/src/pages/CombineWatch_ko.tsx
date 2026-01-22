import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const CombineWatchKo = mount(() => {
  return () => (
    <div>
      <h1>combineWatch</h1>

      <p>
        <code>combineWatch</code>는 여러 <code>Watch</code> 인스턴스를 함께 관찰하고
        그 결합된 값을 튜플과 같은 구조로 전달하는 새로운 <code>Watch</code>를 생성하는 헬퍼 함수입니다.
      </p>

      <p>
        단일 파생 값을 생성하는 <code>createComputed</code>와 달리,
        <code>combineWatch</code>는 여러 watch를 그룹화하여 단일 구독에서
        어떤 것이든 변경에 반응할 수 있게 하는 데 초점을 맞춥니다.
      </p>

      <h2>기본 사용법</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore, combineWatch } from 'state-ref';

const countWatch = createStore(100);
const textWatch = createStore('hello');

// 여러 watch를 하나로 결합
const combinedWatch = combineWatch([countWatch, textWatch]);

// 결합된 변경 사항 구독
combinedWatch(([countRef, textRef], isFirst) => {
  console.log('Count:', countRef.value);
  console.log('Text:', textRef.value);
  console.log('첫 실행?', isFirst);
});

// 어떤 watch든 업데이트하면 콜백 트리거
const count = countWatch();
count.value = 200;
// 로그: Count: 200, Text: hello, 첫 실행? false`}
      />

      <h2>문법</h2>

      <CodeBlock
        language="typescript"
        code={`combineWatch<W extends readonly Watch<any>[]>(
  watches: [...W]
): Watch<CombinedValue<W>>`}
      />

      <h3>매개변수</h3>

      <ul>
        <li>
          <code>watches</code> - 결합할 watch 함수 배열
        </li>
      </ul>

      <h3>반환값</h3>

      <p>
        모든 결합된 스토어에 튜플로 접근할 수 있는 새로운 <code>Watch</code> 함수를 반환합니다.
        반환된 watch는 다른 watch 함수처럼 사용할 수 있습니다.
      </p>

      <h2>결합된 값 접근</h2>

      <p>
        결합된 스토어는 인덱스로 튜플(배열)처럼 접근합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch1 = createStore(10);
const watch2 = createStore('hello');
const watch3 = createStore(true);

const combinedWatch = combineWatch([watch1, watch2, watch3]);

// 콜백 없이 - 참조 얻기
const combined = combinedWatch();

// 인덱스로 접근
console.log(combined[0].value);  // 10 (number)
console.log(combined[1].value);  // 'hello' (string)
console.log(combined[2].value);  // true (boolean)

// 개별 스토어 업데이트
combined[0].value = 20;
combined[1].value = 'world';`}
      />

      <h2>변경 사항 구독</h2>

      <p>
        콜백을 전달하여 결합된 watch 중 어느 것이든 변경을 구독합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const userWatch = createStore({ name: 'John' });
const settingsWatch = createStore({ theme: 'dark' });

const combinedWatch = combineWatch([userWatch, settingsWatch]);

combinedWatch(([userRef, settingsRef], isFirst) => {
  // 먼저 .value에 접근하여 구독 수집
  const userName = userRef.name.value;
  const theme = settingsRef.theme.value;

  if (isFirst) {
    console.log('초기 상태');
    return;
  }

  console.log(\`사용자: \${userName}, 테마: \${theme}\`);
});

// 어느 쪽이든 업데이트하면 콜백 트리거
const user = userWatch();
user.name.value = 'Jane';
// 로그: 사용자: Jane, 테마: dark`}
      />

      <h2>중첩 결합</h2>

      <p>
        <code>combineWatch</code>를 중첩하여 더 복잡한 구조를 관찰할 수 있습니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const countWatch = createStore(100);
const textWatch = createStore('hello');
const toggleWatch = createStore(false);

// countWatch와 textWatch 결합
const combinedCountTextWatch = combineWatch([countWatch, textWatch]);

// 결합된 watch를 toggleWatch와 중첩
const combinedAllWatch = combineWatch([combinedCountTextWatch, toggleWatch]);

combinedAllWatch(([countTextRef, toggleRef], isFirst) => {
  const [countRef, textRef] = countTextRef;

  console.log('Count:', countRef.value);
  console.log('Text:', textRef.value);
  console.log('Toggle:', toggleRef.value);
});`}
      />

      <h2>읽기 전용 루트 값</h2>

      <p>
        결합된 스토어의 루트 <code>.value</code>는 읽기 전용이며 직접 접근하면 경고가 표시됩니다.
        항상 인덱스로 개별 스토어에 접근하세요:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch1 = createStore(10);
const watch2 = createStore(20);

const combinedWatch = combineWatch([watch1, watch2]);
const combined = combinedWatch();

// ✗ 피하기: 결합된 스토어에서 .value 직접 접근
console.log(combined.value);  // 경고 + [10, 20] 반환

// ✓ 올바름: 인덱스로 개별 스토어 접근
console.log(combined[0].value);  // 10
console.log(combined[1].value);  // 20

// ✗ 결합된 .value에 할당 불가
combined.value = [30, 40];  // 경고, 효과 없음

// ✓ 개별 스토어 업데이트
combined[0].value = 30;
combined[1].value = 40;`}
      />

      <h2>as const 사용</h2>

      <p>
        더 나은 TypeScript 추론을 위해 watches 배열에 <code>as const</code>를 사용하세요:
      </p>

      <CodeBlock
        language="typescript"
        code={`const countWatch = createStore(100);
const textWatch = createStore('hello');

// 정확한 튜플 타이핑을 위해 'as const' 사용
const combinedWatch = combineWatch([countWatch, textWatch] as const);

combinedWatch(([countRef, textRef]) => {
  // TypeScript가 알고 있음:
  // countRef.value는 number
  // textRef.value는 string
  console.log(countRef.value + 1);      // OK
  console.log(textRef.value.toUpperCase());  // OK
});`}
      />

      <h2>프레임워크 연동</h2>

      <p>
        결합된 watch는 프레임워크 커넥터와 함께 작동합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore, combineWatch } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const userWatch = createStore({ name: 'John' });
const cartWatch = createStore({ items: [] });

const combinedWatch = combineWatch([userWatch, cartWatch]);

// 결합된 watch에서 React 훅 생성
const useCombinedStore = connectReact(combinedWatch);

function Dashboard() {
  const [user, cart] = useCombinedStore();

  return (
    <div>
      <p>사용자: {user.name.value}</p>
      <p>장바구니 항목: {cart.items.value.length}</p>
    </div>
  );
}`}
      />

      <h2>createComputed와 비교</h2>

      <p>
        필요에 따라 올바른 도구를 선택하세요:
      </p>

      <ul>
        <li>
          <strong>combineWatch</strong> - 스토어 그룹화, 개별 접근 유지
        </li>
        <li>
          <strong>createComputed</strong> - 스토어에서 새로운 단일 값 파생
        </li>
      </ul>

      <CodeBlock
        language="typescript"
        code={`import { createStore, combineWatch, createComputed } from 'state-ref';

const widthWatch = createStore(10);
const heightWatch = createStore(20);

// combineWatch: 스토어를 튜플로 그룹화
const dimensionsWatch = combineWatch([widthWatch, heightWatch]);
const dimensions = dimensionsWatch();
console.log(dimensions[0].value);  // 10 (width)
console.log(dimensions[1].value);  // 20 (height)

// createComputed: 새 값 파생
const areaWatch = createComputed(
  [widthWatch, heightWatch],
  ([w, h]) => w.value * h.value
);
const area = areaWatch();
console.log(area.value);  // 200 (계산된 면적)`}
      />

      <h2>사용 사례</h2>

      <h3>여러 스토어 조정</h3>

      <CodeBlock
        language="typescript"
        code={`const authWatch = createStore({ user: null, token: null });
const uiWatch = createStore({ theme: 'light', sidebar: true });
const dataWatch = createStore({ items: [], loading: false });

// 모든 앱 상태 결합
const appWatch = combineWatch([authWatch, uiWatch, dataWatch]);

appWatch(([auth, ui, data], isFirst) => {
  const user = auth.user.value;
  const theme = ui.theme.value;
  const loading = data.loading.value;

  if (isFirst) return;

  console.log('앱 상태 변경됨');
  console.log(\`사용자: \${user}, 테마: \${theme}, 로딩: \${loading}\`);
});`}
      />

      <h3>여러 필드가 있는 폼</h3>

      <CodeBlock
        language="typescript"
        code={`const nameWatch = createStore('');
const emailWatch = createStore('');
const ageWatch = createStore(0);

const formWatch = combineWatch([nameWatch, emailWatch, ageWatch]);

// 모든 변경에 폼 유효성 검사
formWatch(([name, email, age], isFirst) => {
  const nameVal = name.value;
  const emailVal = email.value;
  const ageVal = age.value;

  if (isFirst) return;

  const isValid = nameVal.length > 0 &&
                  emailVal.includes('@') &&
                  ageVal >= 18;

  console.log('폼 유효:', isValid);
});`}
      />

      <h2>TypeScript 지원</h2>

      <p>
        <code>combineWatch</code>는 튜플의 각 스토어에 대한 타입 정보를 보존합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore, combineWatch } from 'state-ref';

interface User {
  id: number;
  name: string;
}

interface Settings {
  theme: 'light' | 'dark';
  lang: string;
}

const userWatch = createStore<User>({ id: 1, name: 'John' });
const settingsWatch = createStore<Settings>({ theme: 'light', lang: 'ko' });

const combinedWatch = combineWatch([userWatch, settingsWatch] as const);

combinedWatch(([userRef, settingsRef]) => {
  // 완전한 타입 접근
  const userId: number = userRef.id.value;
  const userName: string = userRef.name.value;
  const theme: 'light' | 'dark' = settingsRef.theme.value;
  const lang: string = settingsRef.lang.value;

  console.log(userId, userName, theme, lang);
});`}
      />

      <h2>모범 사례</h2>

      <ul>
        <li>
          <strong>관련 스토어 그룹화에 사용</strong> - 여러 스토어에 함께 반응해야 할 때
        </li>
        <li>
          <strong>인덱스로 접근</strong> - 항상 <code>combined[0]</code>, <code>combined[1]</code> 등 사용
        </li>
        <li>
          <strong><code>as const</code> 사용</strong> - 더 나은 TypeScript 튜플 추론을 위해
        </li>
        <li>
          <strong>파생 값에는 createComputed 선호</strong> - 개별 스토어 접근이 필요할 때만 combineWatch 사용
        </li>
        <li>
          <strong>콜백에서 .value 먼저 접근</strong> - 조건문 전에 구독 수집 보장
        </li>
      </ul>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/computed">createComputed</a> - 스토어에서 단일 값 파생
        </li>
        <li>
          <a href="#/ko/guide/create-store">createStore</a> - 개별 스토어 생성
        </li>
        <li>
          <a href="#/ko/guide/subscription">구독</a> - 구독 이해하기
        </li>
        <li>
          <a href="#/ko/guide/watch">Watch 함수</a> - watch 함수 API
        </li>
      </ul>
    </div>
  );
});
