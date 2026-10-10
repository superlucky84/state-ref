import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Solid = mount(() => {
  return () => (
    <div>
      <h1>Solid Integration</h1>

      <p>
        Use <code>@stateref/connect-solid</code> to connect a StateRef store to
        Solid.js. It returns Solid <code>Signal</code> pairs that integrate with
        Solid's fine-grained reactivity.
      </p>

      <h2>Install</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-solid`}
      />

      <p>
        The ESM-only <code>@stateref/connect-solid/sync</code> entry (see
        &quot;Component Queries&quot; below) also needs the optional{' '}
        <code>@stateref/sync</code> package, 0.3 or later:
      </p>

      <CodeBlock language="bash" code={`pnpm add @stateref/sync`} />

      <h2>Supported Versions</h2>

      <p>
        Solid 1.9 (<code>solid-js ^1.9.1</code>).
      </p>

      <h2>Basic Usage</h2>

      <p>
        The Solid connector uses a callback pattern to select which part of the
        store to track:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStore } from 'state-ref';
import { connectSolid } from '@stateref/connect-solid';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectSolid(watch);`}
      />

      <CodeBlock
        language="tsx"
        code={`import { useProfile } from './store';

function ProfileCard() {
  // Returns [getter, setter] Signal pair
  const [name, setName] = useProfile(store => store.name);
  const [age, setAge] = useProfile(store => store.age);

  return (
    <div>
      <p>{name()}</p>
      <button onClick={() => setAge(prev => prev + 1)}>
        Age: {age()}
      </button>
    </div>
  );
}`}
      />

      <h2>How It Works</h2>

      <p>The Solid connector bridges StateRef with Solid's signal system:</p>

      <ul>
        <li>
          <code>connectSolid(watch)</code> returns a function that accepts a
          selector callback
        </li>
        <li>
          The selector receives the StateRefStore and returns the specific
          property to track
        </li>
        <li>
          Returns a Solid <code>Signal</code> pair:{' '}
          <code>[getter, setter]</code>
        </li>
        <li>
          Call the getter function to read values: <code>name()</code>
        </li>
        <li>
          Use the setter function to update values: <code>setName('Jane')</code>
        </li>
        <li>
          Two-way binding: Solid changes sync back to StateRef, and vice versa
        </li>
        <li>
          Cleanup is automatic via <code>onCleanup</code>
        </li>
      </ul>

      <h2>Selecting Properties</h2>

      <p>Use the selector callback to pick specific properties:</p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'en' }
});

const useStore = connectSolid(watch);`}
      />

      <CodeBlock
        language="tsx"
        code={`import { useStore } from './store';

function Settings() {
  const [userName, setUserName] = useStore(store => store.user.name);
  const [userAge, setUserAge] = useStore(store => store.user.age);
  const [theme, setTheme] = useStore(store => store.settings.theme);

  return (
    <div>
      {/* Access values with getter function */}
      <p>Name: {userName()}</p>
      <p>Theme: {theme()}</p>

      {/* Update values with setter function */}
      <button onClick={() => setUserName('Jane')}>Change Name</button>
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </button>
    </div>
  );
}`}
      />

      <h2>Working with Objects</h2>

      <p>You can also select entire objects:</p>

      <CodeBlock
        language="tsx"
        code={`import { useStore } from './store';

function UserCard() {
  // Select entire user object
  const [user, setUser] = useStore(store => store.user);

  return (
    <div>
      {/* Access nested values */}
      <p>Name: {user().name}</p>
      <p>Age: {user().age}</p>

      {/* Replace entire object */}
      <button onClick={() => setUser({ name: 'Jane', age: 25 })}>
        Update User
      </button>
    </div>
  );
}`}
      />

      <h2>Manual Sync with Actions</h2>

      <p>
        With <code>createStoreManualSync</code>, keep writes in actions:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectSolid } from '@stateref/connect-solid';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectSolid(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}
      />

      <CodeBlock
        language="tsx"
        code={`import { useCounter, increment } from './store';

function Counter() {
  const [count] = useCounter(store => store.count);

  return (
    <button onClick={increment}>
      Count: {count()}
    </button>
  );
}`}
      />

      <h2>Using with Solid's Reactive Primitives</h2>

      <p>Combine with Solid's reactive primitives for derived values:</p>

      <CodeBlock
        language="tsx"
        code={`import { createMemo } from 'solid-js';
import { useStore } from './store';

function FullName() {
  const [firstName] = useStore(store => store.firstName);
  const [lastName] = useStore(store => store.lastName);

  // Derived value using createMemo
  const fullName = createMemo(() => \`\${firstName()} \${lastName()}\`);

  return <p>Full Name: {fullName()}</p>;
}`}
      />

      <h2>Input Binding Pattern</h2>

      <p>Handle input binding with Solid:</p>

      <CodeBlock
        language="tsx"
        code={`import { useStore } from './store';

function Form() {
  const [name, setName] = useStore(store => store.name);
  const [email, setEmail] = useStore(store => store.email);

  return (
    <div>
      <input
        value={name()}
        onInput={(e) => setName(e.currentTarget.value)}
        placeholder="Name"
      />
      <input
        value={email()}
        onInput={(e) => setEmail(e.currentTarget.value)}
        type="email"
        placeholder="Email"
      />

      <p>Name: {name()}</p>
      <p>Email: {email()}</p>
    </div>
  );
}`}
      />

      <h2>TypeScript Tips</h2>

      <p>The connector preserves types from your store:</p>

      <CodeBlock
        language="typescript"
        code={`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectSolid(watch);

// TypeScript knows the types
const [title, setTitle] = useTodo(store => store.title);
// title is Accessor<string>, setTitle is Setter<string>

const [done, setDone] = useTodo(store => store.done);
// done is Accessor<boolean>, setDone is Setter<boolean>`}
      />

      <h2>Component Queries</h2>

      <p>
        For server data in component code, call <code>createSyncQuery</code>{' '}
        from <code>@stateref/connect-solid/sync</code> in the component body.
        The component owns the query for its owner&apos;s life: it loads when
        first selected, follows the key in its props, shares a READ in flight
        with other components showing the same key, and is released after the
        last of them is disposed.
      </p>

      <CodeBlock
        language="tsx"
        code={`import { Show } from 'solid-js';
import { createSyncQuery } from '@stateref/connect-solid/sync';
import { client } from './client'; // createSyncClient(), one per app
import { readShip } from './api'; // (id, signal) => Promise<Ship>

export function ShipPanel(props: { id: number }) {
  const [ship, q] = createSyncQuery(client, () => {
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

  const rename = (value: string) => {
    const handle = q.handle();
    if (handle?.status.value.loaded) handle.ref.name.value = value; // local edit
  };

  return (
    <Show when={status() !== 'pending'} fallback={<p>Loading…</p>}>
      <Show when={loaded()} fallback={<p role="alert">Could not load the ship.</p>}>
        <input
          value={name() ?? ''}
          onInput={event => rename(event.currentTarget.value)}
        />
        <button onClick={() => void q.refetch().catch(() => {})}>Refresh</button>
        <button onClick={() => q.invalidate()}>Check again</button>
      </Show>
    </Show>
  );
}`}
      />

      <p>
        <code>ship(select)</code> returns an <code>Accessor&lt;V&gt;</code> of
        what <code>select</code> reads from the query&apos;s readonly display
        state (<code>status</code>, <code>fetchStatus</code>,{' '}
        <code>loaded</code>, <code>error</code>, <code>data</code>,{' '}
        <code>dirty</code>, <code>queryKey</code> and more); read leaves with{' '}
        <code>.value</code> inside <code>select</code>. The first selection
        attaches the query, and every selection shares it. <code>q</code> is the
        same object for the component&apos;s life:
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

      <p>In Solid:</p>

      <ul>
        <li>
          Pass an accessor to follow props or signals; new options are confirmed
          synchronously, before computations that read the display run. A plain
          options object is fixed for the component&apos;s life.
        </li>
        <li>
          Disposing the owner releases the query one macrotask later, so a route
          swap neither cancels nor repeats a READ.
        </li>
        <li>
          A server render (<code>isServer</code>) reads without subscribing,
          attaching or READing. Fill a per-request{' '}
          <code>createSyncClient({'{ ssr: true }'})</code> with{' '}
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
        <code>connectSolidView</code> binds a readonly query view from{' '}
        <a href="#/guide/sync-view">@stateref/sync</a>. Use it for an explicit
        handle owned outside the component - one a store or service opens with{' '}
        <code>client.query(...)</code>, loads and disposes itself. It takes the
        same <code>Watch</code> shape as <code>connectSolid</code> but never
        hands out setters, because a display can be a selected value or a
        placeholder that was never on the server.
      </p>

      <CodeBlock
        language="tsx"
        code={`function CityDisplay() {
  const view = connectSolidView(live.watchDisplay);
  const city = view(ref => ref.data.value);
  return <span>{city() ?? '-'}</span>;
}`}
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
          The setter writes the store directly and{' '}
          <strong>synchronously</strong>, including a functional update:{' '}
          <code>setUser(prev =&gt; ({"{ ...prev, name: 'Jane' }"}))</code>.
        </li>
        <li>
          <strong>
            The accessor returns a frozen copy of an object or array.
          </strong>{' '}
          <code>user().name = 'x'</code>, or a functional update that mutates{' '}
          <code>prev</code> and returns it, throws a TypeError and the store is
          untouched - neither passes through the connector. Return a new value
          from the setter instead.
        </li>
        <li>
          A server render is detected with <code>isServer</code> and subscribes
          to nothing.
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
          <a href="#/guide/svelte">Svelte</a> - Svelte integration
        </li>
      </ul>
    </div>
  );
});
