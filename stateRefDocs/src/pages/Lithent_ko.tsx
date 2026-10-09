import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';
import {
  lithentStoreExample,
  lithentQueryExample,
  lithentSaveExample,
  lithentSsrExample,
} from '@/content/lithent-sync';

export const LithentKo = mount(() => {
  return () => (
    <div>
      <h1>Lithent 연동</h1>

      <p>
        일반 StateRef 상태는 <code>connectLithent</code>로 연결합니다. 서버
        조회에는 <code>@stateref/connect-lithent/sync</code>의{' '}
        <code>createSyncQuery</code>로 로딩과 컴포넌트 수명을 관리합니다.
      </p>

      <h2>일반 상태 커넥터</h2>
      <p>
        mounter에서 한 번 연결하고 렌더에서는 <code>counter().count.value</code>
        로 읽으며 이벤트에서 같은 ref로 수정합니다. 마운트 뒤 구독하고
        언마운트에서 즉시 abort합니다. 서버 렌더에서는 구독 없이 읽습니다. 기본
        진입점에는 sync 의존성이 필요하지 않습니다.
      </p>
      <CodeBlock
        language="bash"
        code="pnpm add lithent state-ref @stateref/connect-lithent"
      />
      <CodeBlock language="typescript" code={lithentStoreExample} />
      <p>
        <code>connectLithent</code>는 수정 가능한 StateRef accessor를
        반환합니다. <code>connectLithentView</code>는 watch의 ref 타입을
        유지하므로 조회 표시는 읽기 전용이고 일반 watch는 수정할 수 있습니다. 두
        함수는 구독·해제 구현을 공유하며 읽을 때 모두 <code>.value</code>를
        사용합니다.
      </p>

      <h2>컴포넌트 안의 서버 조회</h2>
      <p>
        기본·sync 진입점은 ESM import로 사용합니다. Lithent 1.24 이상과 sync 0.3
        이상을 사용합니다. 앱당 client 하나를 만들고 mounter에서 helper를 한 번
        호출하세요. props는 getter 안에서 읽고, 고정 key에는 옵션 객체를 넘기면
        됩니다. 렌더에서는 accessor를 호출해 읽습니다.
      </p>
      <CodeBlock
        language="bash"
        code="pnpm add lithent state-ref @stateref/sync @stateref/connect-lithent"
      />
      <CodeBlock language="typescript" code={lithentQueryExample} />
      <p>
        마운트 뒤 불러오며 진행 중 READ는 공유하고 언마운트에서 구독을
        정리합니다. 신선한 캐시는 READ 없이 표시합니다. key가 바뀌면 그 key의
        캐시나 대기 상태가 바로 보입니다. 표시는 읽기 전용이며 로드된 핸들의
        ref로 이름을 편집하면 로컬에만 반영됩니다. 빌린 핸들을 직접 dispose하지
        마세요. refetch는 편집을 유지합니다. 예제는 Promise 거부를 처리하고 조회
        오류는 표시 상태로 보여 줍니다.
      </p>
      <h3>편집 저장</h3>
      <p>
        mounter에 <code>const save = accountSave(client, q)</code>를 넣고 저장
        핸들러에서 호출합니다. 제출 직전에 capture하고 현재 핸들을 links에
        넘깁니다. 이 예제는 서버가 확정한 전체 Account를 돌려준다는 계약입니다.
        성공을 표시하기 전에 반환 결과를 확인하고, 결과가 불확실한 WRITE는 자동
        재전송하지 마세요.
      </p>
      <CodeBlock language="typescript" code={lithentSaveExample} />
      <h3>서버 렌더</h3>
      <p>
        요청마다 <code>ssr: true</code> client를 만들고 렌더 전에 캐시를
        채웁니다. 브라우저에서는 컴포넌트를 마운트하기 전에 hydrate하세요.
        컴포넌트의 서버 렌더는 구독이나 추가 READ 없이 캐시를 읽습니다.
      </p>
      <CodeBlock language="typescript" code={lithentSsrExample} />
      <h3>선택적 concurrent 코어</h3>
      <CodeBlock
        language="typescript"
        code={`// 앱의 서버·브라우저 번들러에서:
resolve: {
  alias: [{ find: /^lithent$/, replacement: 'lithent-concurrent' }],
}`}
      />
      <p>
        concurrent 0.1.3으로 검증합니다. helper·SSR·JSX 하위 경로는 바꾸지
        마세요. 커넥터는 표시 변경을 렌더러에 알리고 화면은 읽은 경로의 변경에
        반응합니다. 렌더러의 재시도 제한은 그대로입니다. 마운트나 update
        effect가 실행된 빌드는 값이 섞인 채 커밋될 수 있고 옵션 getter도 update
        callback을 사용합니다. 기존 명시 query는{' '}
        <code>connectLithentView(query.watchDisplay)</code>로 UI 구독을
        관리하되, 연 쪽에서 load와 dispose를 담당합니다.
      </p>

      <h2>watch 직접 연동</h2>
      <p>
        <code>watch(renew)</code> 직접 연동도 가능합니다. 이 구독은 나중에 읽은
        경로의 변경 알림이 언마운트된 컴포넌트의 renew를 호출할 때 끝납니다.
        언마운트 시 즉시 정리하려면 <code>connectLithent</code>를 사용하세요.
      </p>

      <CodeBlock language="bash" code={`pnpm add state-ref lithent`} />

      <h2>기본 사용법</h2>

      <p>
        <code>mount()</code>에서 받은 <code>renew</code> 함수를{' '}
        <code>watch()</code>에 직접 전달합니다:
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

      <p>Lithent의 아키텍처는 StateRef 통합을 매끄럽게 만듭니다:</p>

      <ul>
        <li>
          <code>mount(renew =&gt; ...)</code>는 리렌더링을 트리거하는{' '}
          <code>renew</code> 함수를 제공합니다
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
        <li>컴포넌트가 업데이트된 값으로 리렌더링됩니다</li>
      </ul>

      <h2>컴포넌트 구조</h2>

      <p>Lithent 컴포넌트는 설정과 렌더 두 단계로 구성됩니다:</p>

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

      <p>하나의 컴포넌트에서 여러 스토어를 구독합니다:</p>

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

      <p>깊게 중첩된 값에 자연스럽게 접근합니다:</p>

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
        Flux 스타일 상태 관리를 위해 <code>createStoreManualSync</code>를
        사용합니다:
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

      <p>StateRef 헬퍼 함수와 결합합니다:</p>

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

      <p>직접 바인딩으로 폼 입력을 처리합니다:</p>

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

      <p>완전한 타입 추론이 자동으로 작동합니다:</p>

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

      <h2>일반 상태와 조회의 수명</h2>

      <p>
        일반 상태 커넥터와 sync helper는 모두 컴포넌트 수명을 따릅니다. watch
        직접 연동도 계속 사용할 수 있습니다:
      </p>

      <ul>
        <li>
          Lithent의 <code>renew</code> 함수는 StateRef가 기대하는 정확한
          시그니처를 가집니다
        </li>
        <li>설정/렌더 분리가 구독 패턴과 완벽하게 일치합니다</li>
        <li>연결해야 할 프레임워크별 반응성 시스템이 없습니다</li>
        <li>
          일반 상태 커넥터와 sync helper 모두 언마운트에서 구독을 abort합니다
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
          <a href="#/ko/guide/manual-sync">수동 동기화 (Flux)</a> - 액션 기반
          업데이트
        </li>
        <li>
          <a href="#/ko/guide/computed">createComputed</a> - 파생 값
        </li>
      </ul>
    </div>
  );
});
