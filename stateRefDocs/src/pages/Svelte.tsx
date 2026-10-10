import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Svelte = mount(() => {
  return () => (
    <div>
      <h1>Svelte Integration</h1>

      <p>
        Use <code>@stateref/connect-svelte</code> to connect a StateRef store to
        Svelte. It returns Svelte <code>Writable</code> stores that integrate
        with Svelte's reactivity.
      </p>

      <h2>Install</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-svelte`}
      />

      <p>
        The ESM-only <code>@stateref/connect-svelte/sync</code> entry (see
        &quot;Component Queries&quot; below) also needs the optional{' '}
        <code>@stateref/sync</code> package, 0.3 or later:
      </p>

      <CodeBlock language="bash" code={`pnpm add @stateref/sync`} />

      <h2>Supported Versions</h2>

      <p>
        Svelte 4 and 5 (<code>svelte ^4.0.0 || ^5.0.0</code>). The package major
        follows the newest Svelte it supports, so{' '}
        <code>@stateref/connect-svelte</code> 5.x still works with Svelte 4. The
        store API below works in both; Svelte 5 also has a runes entry (see
        &quot;Svelte 5 Runes&quot; below).
      </p>

      <h2>Basic Usage</h2>

      <p>
        The Svelte connector uses a callback pattern to select which part of the
        store to track:
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

      <p>The Svelte connector bridges StateRef with Svelte's store system:</p>

      <ul>
        <li>
          <code>connectSvelte(watch)</code> returns a function that accepts a
          selector callback
        </li>
        <li>
          The selector receives the StateRefStore and returns the specific
          property to track
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
        <li>Cleanup is automatic on component destroy</li>
      </ul>

      <h2>Selecting Properties</h2>

      <p>Use the selector callback to pick specific properties:</p>

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

      <p>You can also select entire objects:</p>

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

      <p>Combine with Svelte's reactive statements for derived values:</p>

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

      <p>Svelte's two-way binding works seamlessly:</p>

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

      <p>The connector preserves types from your store:</p>

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

      <h2>Component Queries</h2>

      <p>
        For server data in component code, call <code>createSyncQuery</code>{' '}
        from <code>@stateref/connect-svelte/sync</code> during component
        initialization. The component owns the query until it is destroyed: it
        loads when first selected, follows the key in its options store, shares
        a READ in flight with other components showing the same key, and is
        released after the last of them is destroyed.
      </p>

      <CodeBlock
        language="html"
        code={`<script lang="ts">
  import { writable } from 'svelte/store';
  import type { ObserveOptions } from '@stateref/sync';
  import { createSyncQuery } from '@stateref/connect-svelte/sync';
  import { client } from './client'; // createSyncClient(), one per app
  import { readShip, type Ship } from './api'; // (id, signal) => Promise<Ship>

  export let id: number;

  const shipQuery = (id: number): ObserveOptions<Ship> => ({
    queryKey: ['ship', id],
    queryFn: ({ signal }) => readShip(id, signal),
    staleTime: 30_000,
  });
  const options = writable(shipQuery(id));
  $: options.set(shipQuery(id));

  const [ship, q] = createSyncQuery(client, options);
  const status = ship(ref => ref.status.value);
  const loaded = ship(ref => ref.loaded.value);
  const name = ship(ref => ref.data.name.value);

  function rename(event: Event) {
    const handle = q.handle();
    if (handle?.status.value.loaded)
      handle.ref.name.value = (event.target as HTMLInputElement).value; // local edit
  }
</script>

{#if $status === 'pending'}
  <p>Loading…</p>
{:else if !$loaded}
  <p role="alert">Could not load the ship.</p>
{:else}
  <input value={$name ?? ''} on:input={rename} />
  <button on:click={() => q.refetch().catch(() => {})}>Refresh</button>
  <button on:click={() => q.invalidate()}>Check again</button>
{/if}`}
      />

      <p>
        <code>ship(select)</code> returns a Svelte{' '}
        <code>Readable&lt;V&gt;</code> of what <code>select</code> reads from
        the query&apos;s readonly display state (<code>status</code>,{' '}
        <code>fetchStatus</code>, <code>loaded</code>, <code>error</code>,{' '}
        <code>data</code>, <code>dirty</code>, <code>queryKey</code> and more);
        read leaves with <code>.value</code> inside <code>select</code> and the
        store with <code>$name</code>. Each selection subscribes when it is
        created, so the first one attaches the query and every selection shares
        it. <code>q</code> is the same object for the component&apos;s life:
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

      <p>In Svelte:</p>

      <ul>
        <li>
          Queries use the store API, in Svelte 4 and 5; there is no runes entry
          for them. Make the selections during component initialization too:
          each one ends when the component is destroyed.
        </li>
        <li>
          Options are a plain object, fixed for the component&apos;s life, or a{' '}
          <code>Readable</code> options store such as <code>writable</code> or{' '}
          <code>derived</code>. A plain getter is not tracked.
        </li>
        <li>
          Destroying the component releases the query one macrotask later, so a
          route swap neither cancels nor repeats a READ.
        </li>
        <li>
          <strong>
            Server rendering needs a per-request{' '}
            <code>createSyncClient({'{ ssr: true }'})</code>.
          </strong>{' '}
          The store API subscribes during a server render too, so with a plain
          client the render would attach the query and start a READ. An{' '}
          <code>ssr: true</code> client never attaches or READs: fill it with{' '}
          <code>await client.prefetch(options)</code> before rendering, send{' '}
          <code>client.dehydrate()</code>, and call{' '}
          <code>client.hydrate(snapshot)</code> on the browser client before
          hydrating.
        </li>
      </ul>

      <p>
        More on the query lifecycle, dependent queries and server rendering:{' '}
        <a href="#/guide/sync-query">query and resource</a>.
      </p>

      <h2>Readonly Query Views</h2>

      <p>
        <code>connectSvelteView</code> binds a readonly query view from{' '}
        <a href="#/guide/sync-view">@stateref/sync</a>. Use it for an explicit
        handle owned outside the component - one a store or service opens with{' '}
        <code>client.query(...)</code>, loads and disposes itself. It takes the
        same <code>Watch</code> shape as <code>connectSvelte</code> but never
        hands out setters, because a display can be a selected value or a
        placeholder that was never on the server.
      </p>

      <CodeBlock
        language="html"
        code={`<script lang="ts">
  const view = connectSvelteView(live.watchDisplay);
  const city = view(ref => ref.data.value);
</script>

<span>{$city ?? '-'}</span>`}
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
          <code>$user.name = 'Jane'</code> is a real store write. Svelte
          compiles it into <code>user.set(...)</code>, which passes through the
          connector; the connector hands Svelte a copy, so the store changes
          only when that <code>set</code> arrives, with a correct{' '}
          <code>before</code>.
        </li>
        <li>When the component is destroyed, the store stops writing back.</li>
      </ul>

      <h2>Svelte 5 Runes</h2>

      <p>
        <code>@stateref/connect-svelte/runes</code> is a separate, ESM-only
        entry for Svelte 5 (<code>svelte/reactivity</code> does not exist in
        Svelte 4). A selection is an object with <code>.value</code>:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStore } from 'state-ref';
import { connectSvelteRunes } from '@stateref/connect-svelte/runes';

export const watch = createStore({ user: { name: 'John', age: 30 } });
export const useStore = connectSvelteRunes(watch);`}
      />

      <CodeBlock
        language="html"
        code={`<script lang="ts">
  import { useStore } from './store';

  const name = useStore(s => s.user.name);
  const user = useStore(s => s.user);
</script>

<p>{name.value} ({user.value.age})</p>
<button onclick={() => (name.value = 'Jane')}>Rename</button>
<button onclick={() => (user.value = { ...user.value, age: 31 })}>Age</button>`}
      />

      <ul>
        <li>
          It subscribes while a template, <code>$effect</code> or{' '}
          <code>$derived</code> reads <code>.value</code>, and releases when the
          last reader goes away.
        </li>
        <li>
          Assigning <code>.value</code> writes the store synchronously. A
          selected object or array is a frozen copy, so{' '}
          <code>user.value.age = 31</code> throws - it does not pass through the
          connector.
        </li>
        <li>
          <strong>It is not tied to a component.</strong> A selection made at
          module level works, and a write through it always reaches the store -
          unlike the store API, which stops writing back when its component is
          destroyed.
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
          <a href="#/guide/vue">Vue</a> - Vue integration (similar pattern)
        </li>
      </ul>
    </div>
  );
});
