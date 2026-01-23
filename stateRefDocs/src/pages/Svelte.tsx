import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Svelte = mount(() => {
  return () => (
    <div>
      <h1>Svelte Integration</h1>

      <p>
        Use <code>@stateref/connect-svelte</code> to connect a StateRef store to Svelte.
        It returns Svelte <code>Writable</code> stores that integrate with Svelte's reactivity.
      </p>

      <h2>Install</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-svelte`}
      />

      <h2>Basic Usage</h2>

      <p>
        The Svelte connector uses a callback pattern to select which part of the store to track:
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

  // Select which property to track - returns Svelte Writable
  const name = useProfile(store => store.name);
  const age = useProfile(store => store.age);
</script>

<div>
  <p>{$name}</p>
  <button on:click={() => $age += 1}>
    Age: {$age}
  </button>
</div>`}
      />

      <h2>How It Works</h2>

      <p>
        The Svelte connector bridges StateRef with Svelte's store system:
      </p>

      <ul>
        <li>
          <code>connectSvelte(watch)</code> returns a function that accepts a selector callback
        </li>
        <li>
          The selector receives the StateRefStore and returns the specific property to track
        </li>
        <li>
          Returns a Svelte <code>Writable</code> store
        </li>
        <li>
          Use the <code>$</code> prefix to access and update values reactively
        </li>
        <li>
          Two-way binding: Svelte changes sync back to StateRef, and vice versa
        </li>
        <li>
          Cleanup is automatic on component destroy
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

<!-- Access values with $ prefix -->
<p>Name: {$userName}</p>
<p>Theme: {$theme}</p>

<!-- Update values -->
<button on:click={() => $userName = 'Jane'}>Change Name</button>
<button on:click={() => $theme = 'light'}>Toggle Theme</button>`}
      />

      <h2>Working with Objects</h2>

      <p>
        You can also select entire objects:
      </p>

      <CodeBlock
        language="html"
        code={`<script>
  import { useStore } from './store';

  // Select entire user object
  const user = useStore(store => store.user);
</script>

<!-- Access nested values -->
<p>Name: {$user.name}</p>
<p>Age: {$user.age}</p>

<!-- Replace entire object -->
<button on:click={() => $user = { name: 'Jane', age: 25 }}>
  Update User
</button>`}
      />

      <h2>Manual Sync with Actions</h2>

      <p>
        With <code>createStoreManualSync</code>, keep writes in actions:
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

      <h2>Using with Svelte's Reactive Statements</h2>

      <p>
        Combine with Svelte's reactive statements for derived values:
      </p>

      <CodeBlock
        language="html"
        code={`<script>
  import { useStore } from './store';

  const firstName = useStore(store => store.firstName);
  const lastName = useStore(store => store.lastName);

  // Reactive derived value
  $: fullName = \`\${$firstName} \${$lastName}\`;
</script>

<p>Full Name: {fullName}</p>
<input bind:value={$firstName} placeholder="First Name" />
<input bind:value={$lastName} placeholder="Last Name" />`}
      />

      <h2>Two-Way Binding with bind:value</h2>

      <p>
        Svelte's two-way binding works seamlessly:
      </p>

      <CodeBlock
        language="html"
        code={`<script>
  import { useStore } from './store';

  const name = useStore(store => store.name);
  const email = useStore(store => store.email);
</script>

<!-- Two-way binding -->
<input bind:value={$name} placeholder="Name" />
<input bind:value={$email} type="email" placeholder="Email" />

<p>Name: {$name}</p>
<p>Email: {$email}</p>`}
      />

      <h2>TypeScript Tips</h2>

      <p>
        The connector preserves types from your store:
      </p>

      <CodeBlock
        language="typescript"
        code={`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectSvelte(watch);

// TypeScript knows the types
const title = useTodo(store => store.title);
// title is Writable<string>

const done = useTodo(store => store.done);
// done is Writable<boolean>`}
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
          <a href="#/guide/vue">Vue</a> - Vue integration (similar pattern)
        </li>
      </ul>
    </div>
  );
});
