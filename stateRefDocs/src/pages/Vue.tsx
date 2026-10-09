import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Vue = mount(() => {
  return () => (
    <div>
      <h1>Vue Integration</h1>

      <p>
        Use <code>@stateref/connect-vue</code> to connect a StateRef store to
        Vue 3. It bridges StateRef's reactivity with Vue's reactive system.
      </p>

      <h2>Install</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-vue`}
      />

      <p>
        The ESM-only <code>@stateref/connect-vue/sync</code> entry (see
        &quot;Component Queries&quot; below) also needs the optional{' '}
        <code>@stateref/sync</code> package, 0.3 or later:
      </p>

      <CodeBlock language="bash" code={`pnpm add @stateref/sync`} />

      <h2>Supported Versions</h2>

      <p>
        Vue 3.2 and later (<code>vue ^3.2.0</code>); the connector releases with{' '}
        <code>onScopeDispose</code>, which arrived in 3.2.
      </p>

      <h2>Basic Usage</h2>

      <p>
        The Vue connector uses a callback pattern to select which part of the
        store to track:
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
        The Vue connector creates a bridge between StateRef and Vue's
        reactivity:
      </p>

      <ul>
        <li>
          <code>connectVue(watch)</code> returns a function that accepts a
          selector callback
        </li>
        <li>
          The selector receives the StateRefStore and returns the specific
          property to track
        </li>
        <li>
          Returns a Vue <code>Reactive</code> object with a <code>.value</code>{' '}
          property
        </li>
        <li>
          Two-way binding: Vue changes sync back to StateRef, and vice versa
        </li>
        <li>Cleanup is automatic on component unmount</li>
      </ul>

      <h2>Selecting Properties</h2>

      <p>Use the selector callback to pick specific properties:</p>

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

      <p>You can also select entire objects:</p>

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

      <p>Organize your store access in a composable:</p>

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

      <p>The connector preserves types from your store:</p>

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

      <h2>Component Queries</h2>

      <p>
        For server data in component code, call <code>useSyncQuery</code> from{' '}
        <code>@stateref/connect-vue/sync</code> in <code>setup</code>. The
        component owns the query for its scope: it loads when first selected,
        follows the key in its props, shares a READ in flight with other
        components showing the same key, and is released after the last of them
        unmounts.
      </p>

      <CodeBlock
        language="vue"
        code={`<script setup lang="ts">
import { useSyncQuery } from '@stateref/connect-vue/sync';
import { client } from './client'; // createSyncClient(), one per app
import { readShip } from './api'; // (id, signal) => Promise<Ship>

const props = defineProps<{ id: number }>();

const [ship, q] = useSyncQuery(client, () => {
  const id = props.id;
  return {
    queryKey: ['ship', id],
    queryFn: ({ signal }) => readShip(id, signal),
    staleTime: 30_000,
  };
});
const status = ship(ref => ref.status.value);
const loaded = ship(ref => ref.loaded.value);
const name = ship(ref => ref.data.name.value);

const rename = (event: Event) => {
  const handle = q.handle();
  if (handle?.status.value.loaded)
    handle.ref.name.value = (event.target as HTMLInputElement).value; // local edit
};
</script>

<template>
  <p v-if="status === 'pending'">Loading…</p>
  <p v-else-if="!loaded" role="alert">Could not load the ship.</p>
  <section v-else>
    <input :value="name ?? ''" @input="rename" />
    <button @click="q.refetch().catch(() => {})">Refresh</button>
    <button @click="q.invalidate()">Check again</button>
  </section>
</template>`}
      />

      <p>
        <code>ship(select)</code> returns a{' '}
        <code>Readonly&lt;Ref&lt;V&gt;&gt;</code> of what <code>select</code>{' '}
        reads from the query&apos;s readonly display state (<code>status</code>,{' '}
        <code>fetchStatus</code>, <code>loaded</code>, <code>error</code>,{' '}
        <code>data</code>, <code>dirty</code>, <code>queryKey</code> and more);
        read leaves with <code>.value</code> inside <code>select</code>. The
        first selection attaches the query, and every selection shares it.{' '}
        <code>q</code> is the same object for the component&apos;s life:
      </p>

      <ul>
        <li>
          <code>q.refetch()</code> reads again and returns a Promise. It rejects
          with <code>This query observer is not attached.</code> before the
          first selection, while disabled and on the server.
        </li>
        <li>
          <code>q.invalidate()</code> marks the key stale and, while attached
          and enabled, reads it again; <code>client.invalidate(key)</code> only
          marks it stale.
        </li>
        <li>
          <code>q.handle()</code> returns the query&apos;s own handle, or{' '}
          <code>null</code> before the first selection, while disabled and on
          the server. Edit through <code>handle.ref</code> once it has loaded
          and pass the handle to mutation <code>links</code>, but never dispose
          it: the hook owns it.
        </li>
      </ul>

      <p>In Vue:</p>

      <ul>
        <li>
          Pass a getter to follow props or refs; Vue tracks it and confirms the
          new options before the next render. A plain options object is fixed
          for the component&apos;s life, and refs inside it are not unwrapped:
          read <code>.value</code> inside a getter instead.
        </li>
        <li>
          When the scope ends, the query is released one macrotask later, so a
          route swap neither cancels nor repeats a READ. A component deactivated
          by <code>&lt;KeepAlive&gt;</code> stays attached until it is evicted
          or unmounted.
        </li>
        <li>
          On the server, selections read without subscribing, attaching or
          READing. Fill a per-request{' '}
          <code>createSyncClient({'{ ssr: true }'})</code> before the component
          renders - for example with{' '}
          <code>onServerPrefetch(() =&gt; client.prefetch(options))</code> in{' '}
          <code>setup</code> - send <code>client.dehydrate()</code>, and call{' '}
          <code>client.hydrate(snapshot)</code> on the browser client before
          mounting.
        </li>
      </ul>

      <p>
        More on the query lifecycle, dependent queries and server rendering:{' '}
        <a href="#/guide/sync-query">query and resource</a>.
      </p>

      <h2>Readonly Query Views</h2>

      <p>
        <code>connectVueView</code> binds a readonly query view from{' '}
        <a href="#/guide/sync-view">@stateref/sync</a>. Use it for an explicit
        handle owned outside the component - one a store or service opens with{' '}
        <code>client.query(...)</code>, loads and disposes itself. It takes the
        same <code>Watch</code> shape as <code>connectVue</code> but never hands
        out setters, because a display can be a selected value or a placeholder
        that was never on the server.
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
        Edit the actual data through <code>live.ref</code> once it has loaded,
        not through the display. Unmounting this component ends{' '}
        <strong>its own subscription only</strong> - the view itself is released
        by whoever owns it, with <code>live.dispose()</code>, so a second screen
        watching the same view keeps working.
      </p>

      <h2>Writing Rules</h2>

      <ul>
        <li>
          Assigning <code>.value</code> writes the store{' '}
          <strong>synchronously</strong>; reading the store right after sees the
          new value.
        </li>
        <li>
          <strong>A selected object or array is readonly.</strong>{' '}
          <code>user.value.name = 'x'</code> is refused with Vue&apos;s readonly
          warning in development and the store is untouched. Select the leaf (
          <code>useStore(s =&gt; s.user.name).value = 'x'</code>) or replace the
          whole value (<code>user.value = {'{ ...user.value, name }'}</code>).
          The rule behind it: a write that passes through the connector reaches
          the store, a change that does not is refused.
        </li>
        <li>
          The subscription follows the scope the connector was called in - a
          component&apos;s setup, or an <code>effectScope</code> a composable
          runs in - and a write after that scope stops goes nowhere.
        </li>
      </ul>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/create-store">createStore</a> - store creation
        </li>
        <li>
          <a href="#/guide/manual-sync">Manual Sync (Flux)</a> - action-based
          updates
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
