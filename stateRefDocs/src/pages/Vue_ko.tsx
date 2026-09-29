import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const VueKo = mount(() => {
  return () => (
    <div>
      <h1>Vue 연동</h1>

      <p>
        <code>@stateref/connect-vue</code>를 사용하여 StateRef 스토어를 Vue 3에
        연결합니다. StateRef의 반응성과 Vue의 reactive 시스템을 연결합니다.
      </p>

      <h2>설치</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-vue`}
      />

      <h2>지원 버전</h2>

      <p>
        Vue 3.2 이상(<code>vue ^3.2.0</code>). 해제에 3.2에서 생긴{' '}
        <code>onScopeDispose</code>를 씁니다.
      </p>

      <h2>기본 사용법</h2>

      <p>
        Vue 커넥터는 스토어에서 추적할 부분을 선택하기 위해 콜백 패턴을
        사용합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStore } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectVue(watch);`}
      />

      <CodeBlock
        language="vue"
        code={`<script setup lang="ts">
import { useProfile } from './store';

// 추적할 프로퍼티 선택
const name = useProfile(store => store.name);
const age = useProfile(store => store.age);
</script>

<template>
  <div>
    <p>{{ name.value }}</p>
    <button @click="age.value++">
      나이: {{ age.value }}
    </button>
  </div>
</template>`}
      />

      <h2>작동 방식</h2>

      <p>Vue 커넥터는 StateRef와 Vue의 반응성 사이에 브릿지를 생성합니다:</p>

      <ul>
        <li>
          <code>connectVue(watch)</code>는 셀렉터 콜백을 받는 함수를 반환합니다
        </li>
        <li>
          셀렉터는 StateRefStore를 받아서 추적할 특정 프로퍼티를 반환합니다
        </li>
        <li>
          <code>.value</code> 프로퍼티를 가진 Vue <code>Reactive</code> 객체를
          반환합니다
        </li>
        <li>
          양방향 바인딩: Vue 변경이 StateRef로, 그리고 그 반대로도 동기화됩니다
        </li>
        <li>컴포넌트 언마운트 시 자동으로 정리됩니다</li>
      </ul>

      <h2>프로퍼티 선택하기</h2>

      <p>셀렉터 콜백을 사용하여 특정 프로퍼티를 선택합니다:</p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'ko' }
});

const useStore = connectVue(watch);

// 컴포넌트에서
const userName = useStore(store => store.user.name);
const userAge = useStore(store => store.user.age);
const theme = useStore(store => store.settings.theme);

// 값 접근
console.log(userName.value);  // 'John'
console.log(theme.value);     // 'dark'

// 값 업데이트
userName.value = 'Jane';
theme.value = 'light';`}
      />

      <h2>객체 다루기</h2>

      <p>전체 객체를 선택할 수도 있습니다:</p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: { name: 'John', age: 30 }
});

const useStore = connectVue(watch);

// 전체 user 객체 선택
const user = useStore(store => store.user);

// 중첩된 값 접근
console.log(user.value.name);  // 'John'
console.log(user.value.age);   // 30

// 전체 객체 교체
user.value = { name: 'Jane', age: 25 };`}
      />

      <h2>액션과 함께 수동 동기화</h2>

      <p>
        <code>createStoreManualSync</code>를 사용하면 쓰기는 액션에서
        처리합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectVue(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}
      />

      <CodeBlock
        language="vue"
        code={`<script setup lang="ts">
import { useCounter, increment } from './store';

const count = useCounter(store => store.count);
</script>

<template>
  <button @click="increment">
    Count: {{ count.value }}
  </button>
</template>`}
      />

      <h2>Composition API 패턴</h2>

      <p>composable에서 스토어 접근을 구성합니다:</p>

      <CodeBlock
        language="typescript"
        code={`// composables/useProfileStore.ts
import { createStore } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

type Profile = {
  name: string;
  age: number;
  email: string;
};

const watch = createStore<Profile>({
  name: 'John',
  age: 30,
  email: 'john@example.com'
});

const useStore = connectVue(watch);

export function useProfileStore() {
  const name = useStore(store => store.name);
  const age = useStore(store => store.age);
  const email = useStore(store => store.email);

  const incrementAge = () => {
    age.value += 1;
  };

  return {
    name,
    age,
    email,
    incrementAge
  };
}`}
      />

      <CodeBlock
        language="vue"
        code={`<script setup lang="ts">
import { useProfileStore } from './composables/useProfileStore';

const { name, age, email, incrementAge } = useProfileStore();
</script>

<template>
  <div>
    <p>이름: {{ name.value }}</p>
    <p>이메일: {{ email.value }}</p>
    <button @click="incrementAge">
      나이: {{ age.value }}
    </button>
  </div>
</template>`}
      />

      <h2>TypeScript 팁</h2>

      <p>커넥터는 스토어의 타입을 유지합니다:</p>

      <CodeBlock
        language="typescript"
        code={`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectVue(watch);

// TypeScript가 타입을 알고 있음
const title = useTodo(store => store.title);
// title은 Reactive<{ value: string }>

const done = useTodo(store => store.done);
// done은 Reactive<{ value: boolean }>`}
      />

      <h2>읽기 전용 조회 view</h2>

      <p>
        <code>connectVueView</code>는{' '}
        <a href="#/ko/guide/sync-view">@stateref/sync</a>의 읽기 전용 조회
        view를 연결합니다. <code>connectVue</code>와 같은 <code>Watch</code>{' '}
        모양을 받지만 setter는 내주지 않습니다. 표시는 선택된 값일 수도, 서버에
        존재한 적 없는 placeholder일 수도 있기 때문입니다.
      </p>

      <CodeBlock
        language="vue"
        code={`<script setup lang="ts">
const view = connectVueView(live.watchDisplay);
const city = view(ref => ref.data.value);
const phase = view(ref => (ref.isPlaceholder.value ? 'placeholder' : ref.status.value));
</script>

<template>
  <span>{{ phase === 'pending' ? '…' : city ?? '-' }}</span>
</template>`}
      />

      <p>
        실제 데이터는 로드된 뒤 <code>live.ref</code>로 편집하세요. 표시로 하지
        않습니다. 이 컴포넌트의 언마운트는 <strong>자기 구독만</strong> 끝냅니다
        — view 자체는 소유자가 <code>live.dispose()</code>로 놓으므로, 같은
        view를 보는 둘째 화면은 계속 동작합니다.
      </p>

      <h2>쓰기 규칙</h2>

      <ul>
        <li>
          <code>.value</code>에 대입하면 스토어에 <strong>즉시</strong> 씁니다.
          바로 뒤에 스토어를 읽으면 새 값이 보입니다.
        </li>
        <li>
          <strong>선택한 객체와 배열은 읽기 전용입니다.</strong>{' '}
          <code>user.value.name = 'x'</code>는 개발 모드에서 Vue의 readonly
          경고와 함께 거절되고 스토어는 바뀌지 않습니다. 리프를 선택하거나(
          <code>useStore(s =&gt; s.user.name).value = 'x'</code>) 값을 통째로
          바꾸세요(<code>user.value = {'{ ...user.value, name }'}</code>).
          원칙은 하나입니다. 커넥터를 지나가는 쓰기는 스토어에 닿고, 지나가지
          않는 변경은 막습니다.
        </li>
        <li>
          구독은 커넥터를 부른 스코프 — 컴포넌트의 setup, 또는 컴포저블이 도는{' '}
          <code>effectScope</code> — 를 따르고, 그 스코프가 끝난 뒤의 쓰기는
          어디에도 닿지 않습니다.
        </li>
      </ul>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/create-store">createStore</a> - 스토어 생성
        </li>
        <li>
          <a href="#/ko/guide/manual-sync">수동 동기화 (Flux)</a> - 액션 기반
          업데이트
        </li>
        <li>
          <a href="#/ko/guide/watch">Watch 함수</a> - 구독 동작
        </li>
        <li>
          <a href="#/ko/guide/react">React</a> - React 연동
        </li>
      </ul>
    </div>
  );
});
