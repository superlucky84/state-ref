import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Vue = mount(() => {
  return () => (
    <div>
      <h1>Vue Integration</h1>

      <p>
        Use <code>@stateref/connect-vue</code> to connect a StateRef store to Vue 3.
        It bridges StateRef's reactivity with Vue's reactive system.
      </p>

      <h2>Install</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-vue`}
      />

      <h2>Basic Usage</h2>

      <p>
        The Vue connector uses a callback pattern to select which part of the store to track:
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

// Select which property to track
const name = useProfile(store => store.name);
const age = useProfile(store => store.age);
</script>

<template>
  <div>
    <p>{{ name.value }}</p>
    <button @click="age.value++">
      Age: {{ age.value }}
    </button>
  </div>
</template>`}
      />

      <h2>How It Works</h2>

      <p>
        The Vue connector creates a bridge between StateRef and Vue's reactivity:
      </p>

      <ul>
        <li>
          <code>connectVue(watch)</code> returns a function that accepts a selector callback
        </li>
        <li>
          The selector receives the StateRefStore and returns the specific property to track
        </li>
        <li>
          Returns a Vue <code>Reactive</code> object with a <code>.value</code> property
        </li>
        <li>
          Two-way binding: Vue changes sync back to StateRef, and vice versa
        </li>
        <li>
          Cleanup is automatic on component unmount
        </li>
      </ul>

      <h2>Selecting Properties</h2>

      <p>
        Use the selector callback to pick specific properties:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'en' }
});

const useStore = connectVue(watch);

// In component
const userName = useStore(store => store.user.name);
const userAge = useStore(store => store.user.age);
const theme = useStore(store => store.settings.theme);

// Access values
console.log(userName.value);  // 'John'
console.log(theme.value);     // 'dark'

// Update values
userName.value = 'Jane';
theme.value = 'light';`}
      />

      <h2>Working with Objects</h2>

      <p>
        You can also select entire objects:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: { name: 'John', age: 30 }
});

const useStore = connectVue(watch);

// Select entire user object
const user = useStore(store => store.user);

// Access nested values
console.log(user.value.name);  // 'John'
console.log(user.value.age);   // 30

// Replace entire object
user.value = { name: 'Jane', age: 25 };`}
      />

      <h2>Manual Sync with Actions</h2>

      <p>
        With <code>createStoreManualSync</code>, keep writes in actions:
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

      <h2>Composition API Pattern</h2>

      <p>
        Organize your store access in a composable:
      </p>

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
    <p>Name: {{ name.value }}</p>
    <p>Email: {{ email.value }}</p>
    <button @click="incrementAge">
      Age: {{ age.value }}
    </button>
  </div>
</template>`}
      />

      <h2>TypeScript Tips</h2>

      <p>
        The connector preserves types from your store:
      </p>

      <CodeBlock
        language="typescript"
        code={`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectVue(watch);

// TypeScript knows the types
const title = useTodo(store => store.title);
// title is Reactive<{ value: string }>

const done = useTodo(store => store.done);
// done is Reactive<{ value: boolean }>`}
      />

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/create-store">createStore</a> - store creation
        </li>
        <li>
          <a href="#/guide/manual-sync">Manual Sync (Flux)</a> - action-based updates
        </li>
        <li>
          <a href="#/guide/watch">Watch Function</a> - subscription behavior
        </li>
        <li>
          <a href="#/guide/react">React</a> - React integration
        </li>
      </ul>
    </div>
  );
});
