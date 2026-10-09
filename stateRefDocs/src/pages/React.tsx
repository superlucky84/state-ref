import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const React = mount(() => {
  return () => (
    <div>
      <h1>React Integration</h1>

      <p>
        Use <code>@stateref/connect-react</code> to connect a StateRef store to
        React. It provides a hook that re-renders on changes automatically.
      </p>

      <h2>Install</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-react`}
      />

      <p>
        The ESM-only <code>@stateref/connect-react/sync</code> entry (see
        &quot;Component Queries&quot; below) also needs the optional{' '}
        <code>@stateref/sync</code> package, 0.3 or later:
      </p>

      <CodeBlock language="bash" code={`pnpm add @stateref/sync`} />

      <h2>Supported Versions</h2>

      <p>
        React 18 and 19 (<code>react ^18.0.0 || ^19.0.0</code>). The package
        major follows the newest React it supports, so{' '}
        <code>@stateref/connect-react</code> 19.x still works with React 18.
      </p>

      <h2>Basic Usage</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

// Create a React hook from the watch
export const useProfileStore = connectReact(watch);`}
      />

      <CodeBlock
        language="tsx"
        code={`import { useProfileStore } from './profileStore';

export function ProfileCard() {
  const { name, age } = useProfileStore();

  return (
    <div>
      <p>{name.value}</p>
      <button onClick={() => (age.value += 1)}>
        Age: {age.value}
      </button>
    </div>
  );
}`}
      />

      <h2>How Updates Work</h2>

      <ul>
        <li>
          The hook subscribes on mount and re-renders when tracked values change
        </li>
        <li>
          Updates are driven by reading <code>.value</code> in the render
        </li>
        <li>Cleanup is automatic on unmount (AbortController)</li>
      </ul>

      <h2>Manual Sync with Actions</h2>

      <p>
        If you use <code>createStoreManualSync</code>, keep writes in actions
        and call <code>sync()</code> after updates.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStoreManualSync } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectReact(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}
      />

      <CodeBlock
        language="tsx"
        code={`import { useCounterStore, increment } from './counterStore';

export function Counter() {
  const { count } = useCounterStore();
  return <button onClick={increment}>{count.value}</button>;
}`}
      />

      <h2>TypeScript Tips</h2>

      <p>
        The hook preserves types from <code>createStore</code>, so you get
        strongly typed refs in components.
      </p>

      <CodeBlock
        language="typescript"
        code={`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectReact(watch);

// useTodo() returns StateRefStore<Todo>`}
      />

      <h2>Component Queries</h2>

      <p>
        For server data in component code, use <code>useSyncQuery</code> from{' '}
        <code>@stateref/connect-react/sync</code>. The component owns the query
        while it is mounted: it loads after commit, follows the key in its
        props, shares a READ in flight with other components showing the same
        key, and is released after the last of them unmounts.
      </p>

      <CodeBlock
        language="tsx"
        code={`import { useSyncQuery } from '@stateref/connect-react/sync';
import { client } from './client'; // createSyncClient(), one per app
import { readShip } from './api'; // (id, signal) => Promise<Ship>

export function ShipPanel({ id }: { id: number }) {
  const [ship, q] = useSyncQuery(client, {
    queryKey: ['ship', id],
    queryFn: ({ signal }) => readShip(id, signal),
    staleTime: 30_000,
  });

  if (ship.status.value === 'pending') return <p>Loading…</p>;
  if (!ship.loaded.value) return <p role="alert">Could not load the ship.</p>;

  const rename = (name: string) => {
    const handle = q.handle();
    if (handle?.status.value.loaded) handle.ref.name.value = name; // local edit
  };

  return (
    <section>
      <input
        value={ship.data.name.value ?? ''}
        onChange={event => rename(event.target.value)}
      />
      <button onClick={() => void q.refetch().catch(() => {})}>Refresh</button>
      <button onClick={() => q.invalidate()}>Check again</button>
    </section>
  );
}`}
      />

      <p>
        <code>ship</code> is the query&apos;s readonly display state (
        <code>status</code>, <code>fetchStatus</code>, <code>loaded</code>,{' '}
        <code>error</code>, <code>data</code>, <code>dirty</code>,{' '}
        <code>queryKey</code> and more). Read leaves with <code>.value</code>;
        only a change to a path the render read re-renders the component.{' '}
        <code>q</code> is the same object for the component&apos;s life:
      </p>

      <ul>
        <li>
          <code>q.refetch()</code> reads again and returns a Promise. It rejects
          with <code>This query observer is not attached.</code> before mount,
          while disabled and on the server.
        </li>
        <li>
          <code>q.invalidate()</code> marks the key stale and, while mounted and
          enabled, reads it again; <code>client.invalidate(key)</code> only
          marks it stale.
        </li>
        <li>
          <code>q.handle()</code> returns the query&apos;s own handle, or{' '}
          <code>null</code> before mount, while disabled and on the server. Edit
          through <code>handle.ref</code> once it has loaded and pass the handle
          to mutation <code>links</code>, but never dispose it: the hook owns
          it.
        </li>
      </ul>

      <p>In React:</p>

      <ul>
        <li>
          Pass a plain options object on every render; props in it are fine, and
          inline <code>queryFn</code> or <code>select</code> literals do not
          reopen the query.
        </li>
        <li>
          Rendering creates nothing. The release waits one macrotask, so{' '}
          <code>&lt;StrictMode&gt;</code> and a route swap in one commit neither
          cancel nor repeat a READ. Inside{' '}
          <code>&lt;Activity mode=&quot;hidden&quot;&gt;</code> the query is
          released while hidden.
        </li>
        <li>
          The client is fixed for the component&apos;s life; passing another one
          throws <code>This query observer is bound to another client.</code>
        </li>
        <li>
          On the server the hook never attaches or READs. Render with a
          per-request <code>createSyncClient({'{ ssr: true }'})</code> filled by{' '}
          <code>await client.prefetch(options)</code>, send{' '}
          <code>client.dehydrate()</code>, and call{' '}
          <code>client.hydrate(snapshot)</code> on the browser client before{' '}
          <code>hydrateRoot</code>.
        </li>
      </ul>

      <p>
        More on the query lifecycle, dependent queries and server rendering:{' '}
        <a href="#/guide/sync-query">query and resource</a>.
      </p>

      <h2>Readonly Query Views</h2>

      <p>
        <code>connectReactView</code> binds a readonly query view from{' '}
        <a href="#/guide/sync-view">@stateref/sync</a>. Use it for an explicit
        handle owned outside the component - one a store or service opens with{' '}
        <code>client.query(...)</code>, loads and disposes itself. It takes the
        same <code>Watch</code> shape as <code>connectReact</code> but never
        hands out setters, because a display can be a selected value or a
        placeholder that was never on the server.
      </p>

      <CodeBlock
        language="tsx"
        code={`const useLive = connectReactView(live.watchDisplay);

function CityDisplay() {
  const state = useLive();
  if (state.status.value === 'pending') return <span>Loading…</span>;
  return <span>{state.data.value ?? '-'}</span>;
}`}
      />

      <p>
        Edit the actual data through <code>live.ref</code> once it has loaded,
        not through the display. Unmounting this component ends{' '}
        <strong>its own subscription only</strong> - the view itself is released
        by whoever owns it, with <code>live.dispose()</code>, so a second screen
        watching the same view keeps working.
      </p>

      <h2>How the Hook Subscribes</h2>

      <ul>
        <li>
          It is built on <code>useSyncExternalStore</code>, React&apos;s
          contract for external stores. The subscription is made after commit
          and ended by React, so <code>&lt;StrictMode&gt;</code> and renders
          React throws away leave nothing behind.
        </li>
        <li>
          <strong>A mount renders twice.</strong> state-ref learns what a
          component reads while it renders through a subscribed reference, and
          there is none before the first commit. The first render paints with
          the correct values; the second, through the subscribed reference,
          collects the paths. After that, only a change to a path the component
          read re-renders it.
        </li>
        <li>
          A server render uses <code>getServerSnapshot</code> and subscribes to
          nothing.
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
      </ul>
    </div>
  );
});
