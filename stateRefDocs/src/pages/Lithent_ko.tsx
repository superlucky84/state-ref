import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const LithentKo = mount(() => {
  return () => (
    <div>
      <h1>Lithent 연동</h1>

      <p>
        Lithent는 경량 Virtual DOM 라이브러리입니다. StateRef는 별도의 커넥터 패키지 없이
        Lithent와 직접 통합됩니다. 단순히 <code>renew</code> 함수를 <code>watch()</code>에
        전달하면 됩니다.
      </p>

      <h2>설치</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref lithent`}
      />

      <h2>기본 사용법</h2>

      <p>
        <code>mount()</code>에서 받은 <code>renew</code> 함수를 <code>watch()</code>에 직접 전달합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStore } from 'state-ref';

type Profile = { name: string; age: number };

export const profileStore = createStore<Profile>({ name: 'Lee', age: 20 });`}
      />

      <CodeBlock
        language="tsx"
        code={`import { mount } from 'lithent';
import { profileStore } from './store';

export const ProfileCard = mount(renew => {
  // renew를 watch에 직접 전달 - 커넥터 불필요
  const store = profileStore(renew);

  return () => (
    <div>
      <p>이름: {store.name.value}</p>
      <button onClick={() => store.age.value += 1}>
        나이: {store.age.value}
      </button>
    </div>
  );
});`}
      />

      <h2>작동 방식</h2>

      <p>
        Lithent의 아키텍처는 StateRef 통합을 매끄럽게 만듭니다:
      </p>

      <ul>
        <li>
          <code>mount(renew =&gt; ...)</code>는 리렌더링을 트리거하는 <code>renew</code> 함수를 제공합니다
        </li>
        <li>
          <code>watch(renew)</code>는 <code>renew</code>를 구독자로 등록합니다
        </li>
        <li>
          값을 읽고 쓰기 위한 <code>StateRefStore</code>를 반환합니다
        </li>
        <li>
          <code>.value</code> 프로퍼티로 값에 접근합니다
        </li>
        <li>
          값이 변경되면 <code>renew</code>가 자동으로 호출됩니다
        </li>
        <li>
          컴포넌트가 업데이트된 값으로 리렌더링됩니다
        </li>
      </ul>

      <h2>컴포넌트 구조</h2>

      <p>
        Lithent 컴포넌트는 설정과 렌더 두 단계로 구성됩니다:
      </p>

      <CodeBlock
        language="tsx"
        code={`import { mount } from 'lithent';
import { profileStore } from './store';

export const MyComponent = mount(renew => {
  // 설정 단계: 컴포넌트 마운트 시 한 번 실행
  const store = profileStore(renew);

  // 여기서 핸들러를 정의할 수 있음
  const incrementAge = () => {
    store.age.value += 1;
  };

  // 렌더 함수 반환
  return () => (
    // 렌더 단계: 업데이트마다 실행
    <div>
      <p>{store.name.value}</p>
      <button onClick={incrementAge}>
        나이: {store.age.value}
      </button>
    </div>
  );
});`}
      />

      <h2>여러 스토어 사용</h2>

      <p>
        하나의 컴포넌트에서 여러 스토어를 구독합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// stores.ts
import { createStore } from 'state-ref';

export const userStore = createStore({ name: 'John', age: 30 });
export const settingsStore = createStore({ theme: 'dark', lang: 'ko' });`}
      />

      <CodeBlock
        language="tsx"
        code={`import { mount } from 'lithent';
import { userStore, settingsStore } from './stores';

export const Dashboard = mount(renew => {
  // 동일한 renew로 여러 스토어 구독
  const user = userStore(renew);
  const settings = settingsStore(renew);

  return () => (
    <div class={settings.theme.value}>
      <h1>환영합니다, {user.name.value}님!</h1>
      <p>언어: {settings.lang.value}</p>
      <button onClick={() => {
        settings.theme.value = settings.theme.value === 'dark' ? 'light' : 'dark';
      }}>
        테마 토글
      </button>
    </div>
  );
});`}
      />

      <h2>중첩된 프로퍼티</h2>

      <p>
        깊게 중첩된 값에 자연스럽게 접근합니다:
      </p>

      <CodeBlock
        language="tsx"
        code={`import { mount } from 'lithent';
import { createStore } from 'state-ref';

const appStore = createStore({
  user: {
    profile: {
      name: 'John',
      avatar: '/img/default.png'
    },
    preferences: {
      notifications: true
    }
  }
});

export const UserProfile = mount(renew => {
  const store = appStore(renew);

  return () => (
    <div>
      <img src={store.user.profile.avatar.value} alt="avatar" />
      <p>{store.user.profile.name.value}</p>
      <label>
        <input
          type="checkbox"
          checked={store.user.preferences.notifications.value}
          onChange={(e) => {
            store.user.preferences.notifications.value = e.target.checked;
          }}
        />
        알림 활성화
      </label>
    </div>
  );
});`}
      />

      <h2>액션과 함께 수동 동기화</h2>

      <p>
        Flux 스타일 상태 관리를 위해 <code>createStoreManualSync</code>를 사용합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStoreManualSync } from 'state-ref';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const counterStore = watch;

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};

export const decrement = () => {
  updateRef.count.value -= 1;
  sync();
};`}
      />

      <CodeBlock
        language="tsx"
        code={`import { mount } from 'lithent';
import { counterStore, increment, decrement } from './store';

export const Counter = mount(renew => {
  const store = counterStore(renew);

  return () => (
    <div>
      <button onClick={decrement}>-</button>
      <span>{store.count.value}</span>
      <button onClick={increment}>+</button>
    </div>
  );
});`}
      />

      <h2>헬퍼 함수와 함께 사용</h2>

      <p>
        StateRef 헬퍼 함수와 결합합니다:
      </p>

      <CodeBlock
        language="tsx"
        code={`import { mount } from 'lithent';
import { createStore, createComputed, combineWatch } from 'state-ref';

const firstNameStore = createStore({ value: 'John' });
const lastNameStore = createStore({ value: 'Doe' });

// computed 값 생성
const fullName = createComputed(
  [firstNameStore, lastNameStore],
  (first, last) => \`\${first.value.value} \${last.value.value}\`
);

export const NameDisplay = mount(renew => {
  const firstName = firstNameStore(renew);
  const lastName = lastNameStore(renew);
  const computed = fullName(renew);

  return () => (
    <div>
      <input
        value={firstName.value.value}
        onInput={(e) => firstName.value.value = e.target.value}
      />
      <input
        value={lastName.value.value}
        onInput={(e) => lastName.value.value = e.target.value}
      />
      <p>전체 이름: {computed.value}</p>
    </div>
  );
});`}
      />

      <h2>폼 처리</h2>

      <p>
        직접 바인딩으로 폼 입력을 처리합니다:
      </p>

      <CodeBlock
        language="tsx"
        code={`import { mount } from 'lithent';
import { createStore } from 'state-ref';

const formStore = createStore({
  name: '',
  email: '',
  message: ''
});

export const ContactForm = mount(renew => {
  const form = formStore(renew);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log({
      name: form.name.value,
      email: form.email.value,
      message: form.message.value
    });
  };

  return () => (
    <form onSubmit={handleSubmit}>
      <input
        value={form.name.value}
        onInput={(e) => form.name.value = e.target.value}
        placeholder="이름"
      />
      <input
        value={form.email.value}
        onInput={(e) => form.email.value = e.target.value}
        type="email"
        placeholder="이메일"
      />
      <textarea
        value={form.message.value}
        onInput={(e) => form.message.value = e.target.value}
        placeholder="메시지"
      />
      <button type="submit">전송</button>
    </form>
  );
});`}
      />

      <h2>TypeScript 팁</h2>

      <p>
        완전한 타입 추론이 자동으로 작동합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

type Todo = { title: string; done: boolean };
const todoStore = createStore<Todo>({ title: 'Write docs', done: false });

// 컴포넌트에서
const store = todoStore(renew);
// store.title은 StateRefStore<string>
// store.title.value는 string
// store.done.value는 boolean`}
      />

      <h2>왜 커넥터가 필요 없나요?</h2>

      <p>
        다른 프레임워크와 달리 Lithent는 커넥터가 필요 없습니다:
      </p>

      <ul>
        <li>
          Lithent의 <code>renew</code> 함수는 StateRef가 기대하는 정확한 시그니처를 가집니다
        </li>
        <li>
          설정/렌더 분리가 구독 패턴과 완벽하게 일치합니다
        </li>
        <li>
          연결해야 할 프레임워크별 반응성 시스템이 없습니다
        </li>
        <li>
          직접 통합은 오버헤드가 전혀 없습니다
        </li>
      </ul>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/create-store">createStore</a> - 스토어 생성
        </li>
        <li>
          <a href="#/ko/guide/watch">Watch 함수</a> - 구독 동작
        </li>
        <li>
          <a href="#/ko/guide/manual-sync">수동 동기화 (Flux)</a> - 액션 기반 업데이트
        </li>
        <li>
          <a href="#/ko/guide/computed">createComputed</a> - 파생 값
        </li>
      </ul>
    </div>
  );
});
