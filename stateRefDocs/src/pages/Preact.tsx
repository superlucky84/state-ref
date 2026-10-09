import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Preact = mount(() => {
  return () => (
    <div>
      <h1>Preact Integration</h1>

      <p>
        Use <code>@stateref/connect-preact</code> to connect a StateRef store to
        Preact. It provides a hook that re-renders on changes automatically.
      </p>

      <h2>Install</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-preact`}
      />

      <p>
        The ESM-only <code>@stateref/connect-preact/sync</code> entry (see
        &quot;Component Queries&quot; below) also needs the optional{' '}
        <code>@stateref/sync</code> package, 0.3 or later:
      </p>

      <CodeBlock language="bash" code={`pnpm add @stateref/sync`} />

      <h2>Supported Versions</h2>

      <p>
        Preact 10 (<code>preact ^10.0.0</code>). It uses{' '}
        <code>preact/hooks</code> only - no <code>preact/compat</code>.
      </p>

      <h2>Basic Usage</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import { connectPreact } from '@stateref/connect-preact';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

// Create a Preact hook from the watch
export const useProfileStore = connectPreact(watch);`}
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

      <h2>Preact vs React</h2>

      <p>
        The Preact connector is nearly identical to the React version. The main
        difference is that it uses <code>preact/hooks</code> instead of React's
        hooks:
      </p>

      <CodeBlock
        language="typescript"
        code={`// React
import { connectReact } from '@stateref/connect-react';

// Preact
import { connectPreact } from '@stateref/connect-preact';

// Usage is the same
const useStore = connectPreact(watch);`}
      />

      <h2>Manual Sync with Actions</h2>

      <p>
        If you use <code>createStoreManualSync</code>, keep writes in actions
        and call <code>sync()</code> after updates.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStoreManualSync } from 'state-ref';
import { connectPreact } from '@stateref/connect-preact';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectPreact(watch);

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
const useTodo = connectPreact(watch);

// useTodo() returns StateRefStore<Todo>`}
      />

      <h2>Component Queries</h2>

      <p>
        For server data in component code, use <code>useSyncQuery</code> from{' '}
        <code>@stateref/connect-preact/sync</code>. The component owns the query
        while it is mounted: it loads after commit, follows the key in its
        props, shares a READ in flight with other components showing the same
        key, and is released after the last of them unmounts.
      </p>

      <CodeBlock
        language="tsx"
        code={`import { useSyncQuery } from '@stateref/connect-preact/sync';
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
        onInput={event => rename(event.currentTarget.value)}
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

      <p>In Preact:</p>

      <ul>
        <li>
          Pass a plain options object on every render; props in it are fine, and
          inline <code>queryFn</code> or <code>select</code> literals do not
          reopen the query.
        </li>
        <li>
          Rendering creates nothing. Preact runs effects after paint, so the
          release waits for the next paint (a 200 ms timer stands in when no
          frame comes): a route swap that hands a key from one component to
          another neither cancels nor repeats its READ. Tests wait for that
          release before asserting that the handle is gone.
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
        <code>connectPreactView</code> binds a readonly query view from{' '}
        <a href="#/guide/sync-view">@stateref/sync</a>. Use it for an explicit
        handle owned outside the component - one a store or service opens with{' '}
        <code>client.query(...)</code>, loads and disposes itself. It takes the
        same <code>Watch</code> shape as <code>connectPreact</code> but never
        hands out setters, because a display can be a selected value or a
        placeholder that was never on the server.
      </p>

      <CodeBlock
        language="tsx"
        code={`const useLive = connectPreactView(live.watchDisplay);

function CityDisplay() {
  const state = useLive();
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
          The subscription is made in an effect, after commit, and released by
          its cleanup. A render that suspends never commits, so it leaves
          nothing behind.
        </li>
        <li>
          <strong>A mount renders twice</strong>, for the same reason as the
          React connector: the first render paints with the correct values, the
          second collects the paths the component reads.
        </li>
        <li>A server render runs no effects and subscribes to nothing.</li>
      </ul>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/shared">Shared Across Bundles</a> - one store for
          separately built bundles
        </li>
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
          <a href="#/guide/react">React</a> - React integration (nearly
          identical API)
        </li>
      </ul>
    </div>
  );
});
