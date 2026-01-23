import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SvelteKo = mount(() => {
  return () => (
    <div>
      <h1>Svelte 연동</h1>

      <p>
        <code>@stateref/connect-svelte</code>를 사용하여 StateRef 스토어를 Svelte에 연결합니다.
        Svelte의 반응성과 통합되는 Svelte <code>Writable</code> 스토어를 반환합니다.
      </p>

      <h2>설치</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-svelte`}
      />

      <h2>기본 사용법</h2>

      <p>
        Svelte 커넥터는 스토어에서 추적할 부분을 선택하기 위해 콜백 패턴을 사용합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStore } from 'state-ref';
import { connectSvelte } from '@stateref/connect-svelte';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectSvelte(watch);`}
      />

      <CodeBlock
        language="html"
        code={`<script lang="ts">
  import { useProfile } from './store';

  // 추적할 프로퍼티 선택 - Svelte Writable 반환
  const name = useProfile(store => store.name);
  const age = useProfile(store => store.age);
</script>

<div>
  <p>{$name}</p>
  <button on:click={() => $age += 1}>
    나이: {$age}
  </button>
</div>`}
      />

      <h2>작동 방식</h2>

      <p>
        Svelte 커넥터는 StateRef와 Svelte의 스토어 시스템을 연결합니다:
      </p>

      <ul>
        <li>
          <code>connectSvelte(watch)</code>는 셀렉터 콜백을 받는 함수를 반환합니다
        </li>
        <li>
          셀렉터는 StateRefStore를 받아서 추적할 특정 프로퍼티를 반환합니다
        </li>
        <li>
          Svelte <code>Writable</code> 스토어를 반환합니다
        </li>
        <li>
          <code>$</code> 접두사를 사용하여 값을 반응적으로 접근하고 업데이트합니다
        </li>
        <li>
          양방향 바인딩: Svelte 변경이 StateRef로, 그리고 그 반대로도 동기화됩니다
        </li>
        <li>
          컴포넌트 파괴 시 자동으로 정리됩니다
        </li>
      </ul>

      <h2>프로퍼티 선택하기</h2>

      <p>
        셀렉터 콜백을 사용하여 특정 프로퍼티를 선택합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'ko' }
});

const useStore = connectSvelte(watch);`}
      />

      <CodeBlock
        language="html"
        code={`<script>
  import { useStore } from './store';

  const userName = useStore(store => store.user.name);
  const userAge = useStore(store => store.user.age);
  const theme = useStore(store => store.settings.theme);
</script>

<!-- $ 접두사로 값 접근 -->
<p>이름: {$userName}</p>
<p>테마: {$theme}</p>

<!-- 값 업데이트 -->
<button on:click={() => $userName = 'Jane'}>이름 변경</button>
<button on:click={() => $theme = 'light'}>테마 토글</button>`}
      />

      <h2>객체 다루기</h2>

      <p>
        전체 객체를 선택할 수도 있습니다:
      </p>

      <CodeBlock
        language="html"
        code={`<script>
  import { useStore } from './store';

  // 전체 user 객체 선택
  const user = useStore(store => store.user);
</script>

<!-- 중첩된 값 접근 -->
<p>이름: {$user.name}</p>
<p>나이: {$user.age}</p>

<!-- 전체 객체 교체 -->
<button on:click={() => $user = { name: 'Jane', age: 25 }}>
  사용자 업데이트
</button>`}
      />

      <h2>액션과 함께 수동 동기화</h2>

      <p>
        <code>createStoreManualSync</code>를 사용하면 쓰기는 액션에서 처리합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectSvelte } from '@stateref/connect-svelte';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectSvelte(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}
      />

      <CodeBlock
        language="html"
        code={`<script>
  import { useCounter, increment } from './store';

  const count = useCounter(store => store.count);
</script>

<button on:click={increment}>
  Count: {$count}
</button>`}
      />

      <h2>Svelte의 반응형 구문과 함께 사용</h2>

      <p>
        파생 값을 위해 Svelte의 반응형 구문과 결합합니다:
      </p>

      <CodeBlock
        language="html"
        code={`<script>
  import { useStore } from './store';

  const firstName = useStore(store => store.firstName);
  const lastName = useStore(store => store.lastName);

  // 반응형 파생 값
  $: fullName = \`\${$firstName} \${$lastName}\`;
</script>

<p>전체 이름: {fullName}</p>
<input bind:value={$firstName} placeholder="이름" />
<input bind:value={$lastName} placeholder="성" />`}
      />

      <h2>bind:value와 양방향 바인딩</h2>

      <p>
        Svelte의 양방향 바인딩이 원활하게 작동합니다:
      </p>

      <CodeBlock
        language="html"
        code={`<script>
  import { useStore } from './store';

  const name = useStore(store => store.name);
  const email = useStore(store => store.email);
</script>

<!-- 양방향 바인딩 -->
<input bind:value={$name} placeholder="이름" />
<input bind:value={$email} type="email" placeholder="이메일" />

<p>이름: {$name}</p>
<p>이메일: {$email}</p>`}
      />

      <h2>TypeScript 팁</h2>

      <p>
        커넥터는 스토어의 타입을 유지합니다:
      </p>

      <CodeBlock
        language="typescript"
        code={`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectSvelte(watch);

// TypeScript가 타입을 알고 있음
const title = useTodo(store => store.title);
// title은 Writable<string>

const done = useTodo(store => store.done);
// done은 Writable<boolean>`}
      />

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/create-store">createStore</a> - 스토어 생성
        </li>
        <li>
          <a href="#/ko/guide/manual-sync">수동 동기화 (Flux)</a> - 액션 기반 업데이트
        </li>
        <li>
          <a href="#/ko/guide/watch">Watch 함수</a> - 구독 동작
        </li>
        <li>
          <a href="#/ko/guide/vue">Vue</a> - Vue 연동 (유사한 패턴)
        </li>
      </ul>
    </div>
  );
});
