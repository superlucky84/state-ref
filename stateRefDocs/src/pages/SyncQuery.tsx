import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncQuery = mount(() => {
  return () => (
    <div>
      <h1>query and resource</h1>

      <p>
        A query handle holds two things at once: the{' '}
        <strong>server baseline</strong> the last READ confirmed, and the{' '}
        <strong>local edit</strong> you have made on top of it. Keeping them
        apart is what lets the client tell an unsaved field from a stale one.
      </p>

      <h2>Queries in components</h2>
      <p>
        In component code, let the component own the query. Each connector has
        an ESM-only <code>/sync</code> entry that needs{' '}
        <code>@stateref/sync</code> 0.3 or later. Rendering creates nothing. The
        first subscription attaches the query (on mount in React, Preact and
        Lithent; at the first selection in Vue, Solid and Svelte): it opens,
        loads if stale and shares a READ already in flight for its key. The key
        follows the options, and unmount releases the handle.
      </p>
      <p>The examples share a client and an options helper.</p>
      <CodeBlock
        language="typescript"
        code={`import { createSyncClient } from '@stateref/sync';
import type { ObserveOptions } from '@stateref/sync';

type Account = { name: string; city: string };
export const client = createSyncClient(); // one per browser app

export const accountOptions = (id: number): ObserveOptions<Account> => ({
  queryKey: ['account', id],
  queryFn: ({ signal }) => api.readAccount(id, { signal }),
  staleTime: 30_000,
});`}
      />

      <h3>React and Preact</h3>
      <p>
        Pass a plain options object on every render; reading props in it is
        fine. Read leaves with <code>.value</code>: the component re-renders
        only for the paths it read. See the <a href="#/guide/react">React</a>{' '}
        and <a href="#/guide/preact">Preact</a> guides.
      </p>
      <CodeBlock
        language="tsx"
        code={`import { useSyncQuery } from '@stateref/connect-react/sync';
// Preact: import { useSyncQuery } from '@stateref/connect-preact/sync';

function AccountCard({ id }: { id: number }) {
  const [account, q] = useSyncQuery(client, accountOptions(id));
  if (account.status.value === 'pending') return <p>Loading…</p>;
  return (
    <p>
      {account.data.name.value}
      <button onClick={() => q.invalidate()}>Reload</button>
    </p>
  );
}`}
      />

      <h3>Vue</h3>
      <p>
        Pass a getter to follow props or refs. A plain object is fixed for the
        component&apos;s life, and refs inside it are not unwrapped: read{' '}
        <code>.value</code> inside a getter. <code>account(select)</code>{' '}
        returns a readonly Vue ref. See the <a href="#/guide/vue">Vue guide</a>.
      </p>
      <CodeBlock
        language="vue"
        code={`<script setup lang="ts">
import { useSyncQuery } from '@stateref/connect-vue/sync';

const props = defineProps<{ id: number }>();
const [account, q] = useSyncQuery(client, () => accountOptions(props.id));
const status = account(ref => ref.status.value); // Readonly<Ref<...>>
const name = account(ref => ref.data.name.value);
</script>

<template>
  <p v-if="status === 'pending'">Loading…</p>
  <p v-else>{{ name }} <button @click="q.invalidate()">Reload</button></p>
</template>`}
      />

      <h3>Solid</h3>
      <p>
        Pass an accessor to follow props or signals; a plain object is fixed.{' '}
        <code>account(select)</code> returns an <code>Accessor</code>. See the{' '}
        <a href="#/guide/solid">Solid guide</a>.
      </p>
      <CodeBlock
        language="tsx"
        code={`import { Show } from 'solid-js';
import { createSyncQuery } from '@stateref/connect-solid/sync';

function AccountCard(props: { id: number }) {
  const [account, q] = createSyncQuery(client, () => accountOptions(props.id));
  const status = account(ref => ref.status.value); // Accessor<...>
  const name = account(ref => ref.data.name.value);
  return (
    <Show when={status() !== 'pending'} fallback={<p>Loading…</p>}>
      <p>
        {name()} <button onClick={() => q.invalidate()}>Reload</button>
      </p>
    </Show>
  );
}`}
      />

      <h3>Svelte</h3>
      <p>
        Queries use the store API (Svelte 4 and 5); there is no runes entry for
        them. Call <code>createSyncQuery</code> and its selections during
        component initialization. Options are a plain object (fixed) or a{' '}
        <code>Readable</code> options store; a plain getter is not tracked.{' '}
        <code>account(select)</code> returns a <code>Readable</code>. See the{' '}
        <a href="#/guide/svelte">Svelte guide</a>.
      </p>
      <CodeBlock
        language="html"
        code={`<script lang="ts">
  import { writable } from 'svelte/store';
  import { createSyncQuery } from '@stateref/connect-svelte/sync';

  export let id: number;
  const options = writable(accountOptions(id));
  $: options.set(accountOptions(id));

  const [account, q] = createSyncQuery(client, options);
  const status = account(ref => ref.status.value); // Readable<...>
  const name = account(ref => ref.data.name.value);
</script>

{#if $status === 'pending'}
  <p>Loading…</p>
{:else}
  <p>{$name} <button on:click={() => q.invalidate()}>Reload</button></p>
{/if}`}
      />

      <h3>Lithent</h3>
      <p>
        Create it once in the mounter; a props getter follows props, and a plain
        object is fixed. Read <code>account()</code> in render. The{' '}
        <a href="#/guide/lithent">Lithent guide</a> also covers editing,
        mutation links, SSR and the optional concurrent core.
      </p>
      <CodeBlock
        language="typescript"
        code={`import { h, mount } from 'lithent';
import { createSyncQuery } from '@stateref/connect-lithent/sync';

export const AccountCard = mount<{ id: number }>((_renew, props) => {
  const [account, q] = createSyncQuery(client, () => accountOptions(props.id));
  return () =>
    account().status.value === 'pending'
      ? h('p', {}, 'Loading…')
      : h('p', {}, account().data.name.value ?? '',
          h('button', { onClick: () => q.invalidate() }, 'Reload'));
});`}
      />

      <h3>The display and q</h3>
      <p>
        Every entry reads the same readonly display state as{' '}
        <a href="#/guide/sync-view">display and reactive keys</a>:{' '}
        <code>status</code>, <code>fetchStatus</code>, <code>loaded</code>,{' '}
        <code>error</code>, <code>errorSource</code>, <code>data</code>,{' '}
        <code>dirty</code>, <code>queryKey</code>, <code>enabled</code> and the
        rest of the status. <code>q</code> is the same object for the
        component&apos;s life:
      </p>
      <ul>
        <li>
          <code>q.refetch()</code> forces a READ and returns a Promise. It
          rejects with <code>This query observer is not attached.</code> before
          the query attaches, while it is disabled and on the server.
        </li>
        <li>
          <code>q.invalidate()</code> invalidates the key and, while attached
          and enabled, reads it again. <code>client.invalidate(key)</code> only
          marks it stale.
        </li>
        <li>
          <code>q.handle()</code> returns the query&apos;s own handle, or{' '}
          <code>null</code> before it attaches, while disabled and on the
          server. Edit through <code>handle.ref</code> once{' '}
          <code>handle.status.value.loaded</code> is true, and pass the handle
          to mutation <code>links</code>. Never dispose it: the hook owns it.
        </li>
      </ul>

      <h3>Things to know</h3>
      <ul>
        <li>
          <strong>Loading UI.</strong> Test{' '}
          <code>status === &apos;pending&apos;</code>. The first render shows
          the cache as it is, so its <code>fetchStatus</code> can be{' '}
          <code>&apos;idle&apos;</code> while a READ is about to start; this is
          also what keeps the server render and the first client render equal.
        </li>
        <li>
          <strong>Key changes.</strong> A new key shows from the first render
          (its cached data, or pending), never the previous key&apos;s data, and
          a late answer for the old key never shows.
        </li>
        <li>
          <strong>Dependent queries.</strong> A key cannot hold{' '}
          <code>undefined</code>: write{' '}
          <code>{"queryKey: ['user', id ?? null], enabled: id != null"}</code>.
          An invalid key (one holding <code>undefined</code>, or a state-ref ref
          instead of its <code>.value</code>) or a non-boolean{' '}
          <code>enabled</code> does not throw in render; it shows{' '}
          <code>status: &apos;error&apos;</code> with{' '}
          <code>errorSource: &apos;source&apos;</code>.{' '}
          <code>enabled: false</code> owns nothing and shows{' '}
          <code>status: &apos;pending&apos;</code>,{' '}
          <code>fetchStatus: &apos;idle&apos;</code> and{' '}
          <code>enabled: false</code>, so check <code>enabled</code> before
          showing a loading state.
        </li>
        <li>
          <strong>Options.</strong> Inline <code>queryFn</code> and{' '}
          <code>select</code> literals are fine. Changing <code>staleTime</code>
          , <code>refetchInterval</code> or another primitive option reopens the
          same key without cancelling its READ. A <code>select</code> that
          returns a Map, Set, class instance or function is not structurally
          shared and republishes on every commit: memoize it or pass{' '}
          <code>equals</code>.
        </li>
        <li>
          <strong>One client.</strong> The client is fixed for the
          component&apos;s lifetime. React and Preact throw{' '}
          <code>This query observer is bound to another client.</code> when it
          changes; the other entries keep the first one. Remount to switch.
        </li>
        <li>
          <strong>Release.</strong> When the last subscriber ends, the handle is
          released on a short schedule (one macrotask; after the next paint in
          Preact), so StrictMode and a route swap in one commit neither cancel
          nor repeat a READ. In tests with fake timers, advance them before
          asserting the handle is gone:{' '}
          <code>await vi.advanceTimersByTimeAsync(0)</code>, or 200 ms for
          Preact.
        </li>
        <li>
          <strong>Hidden components.</strong> React{' '}
          <code>&lt;Activity mode=&quot;hidden&quot;&gt;</code> releases the
          query while hidden; showing it again reads only a stale key. Vue{' '}
          <code>&lt;KeepAlive&gt;</code> keeps a deactivated component attached
          until it is evicted or unmounted.
        </li>
        <li>
          <strong>Server rendering.</strong> Create{' '}
          <code>{'createSyncClient({ ssr: true })'}</code> per request. The
          entries never attach or READ on it, so fill the cache before rendering
          (<code>await client.prefetch(options)</code> or{' '}
          <code>client.ensure</code>), send <code>client.dehydrate()</code>, and
          call <code>client.hydrate(snapshot)</code> on the browser client
          before rendering. Svelte&apos;s store API subscribes during a server
          render too, so there a plain client would open the query and READ. See{' '}
          <a href="#/guide/sync-persistence">Persistence and SSR</a>.
        </li>
        <li>
          <strong>Shared bundles.</strong> Bundles that share one client through{' '}
          <a href="#/guide/shared">state-ref/shared</a> must ship the same{' '}
          <code>@stateref/sync</code>, 0.3 or later. A client from an older one
          has no <code>observe()</code>, and the entry throws{' '}
          <code>
            This sync client has no observe(); align the @stateref/sync versions
            of the bundles on this page.
          </code>
        </li>
        <li>
          <strong>Another framework.</strong> The entries are built on{' '}
          <code>client.observe</code>; to write a hook for another framework,
          see the <a href="#/api/sync">Sync API</a>.
        </li>
      </ul>

      <h2>Explicit handles</h2>

      <p>
        A store or service that owns a query beyond one component opens a handle
        itself and calls <code>load()</code> and <code>dispose()</code>.
        Components can still show that handle through a connector (below).
      </p>

      <CodeBlock
        language="typescript"
        code={`const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
});

await account.load();      // uses a fresh cached result if there is one
await account.refetch();   // forces a READ
account.invalidate();      // marks the key stale, excludes an older in-flight response
account.dispose();         // releases this handle's subscriptions`}
      />

      <p>
        <code>account.status</code> is readable before the first load.{' '}
        <code>account.ref</code> and <code>account.watch</code>{' '}
        <strong>throw</strong> until a load has succeeded - there is no baseline
        to hand out, and returning a fake one is exactly what a loading screen
        must not do.
      </p>

      <CodeBlock
        language="typescript"
        code={`const status = account.status.value;

status.status;      // 'pending' | 'success' | 'error'
status.fetchStatus; // 'idle' | 'fetching' | 'paused'
status.loaded;      // whether a baseline exists
status.error;
status.updatedAt;
status.invalidated;

// the editing axis, kept separate from the loading axis
status.dirty;
status.conflicts;
status.version;
status.pending;      // linked WRITEs in flight
status.unconfirmed;  // a WRITE outcome that was never confirmed`}
      />

      <h2>Binding to a Component</h2>

      <p>
        <code>account.watch</code> and <code>account.watchStatus</code> use the{' '}
        <code>state-ref</code> <code>Watch</code> shape, so the connectors take
        them directly.
      </p>

      <CodeBlock
        language="typescript"
        code={`const useAccount = connectReact(account.watch);
const useAccountStatus = connectReact(account.watchStatus);

function CityField() {
  const state = useAccount();
  return (
    <input
      value={state.address.city.value}
      onChange={event => (state.address.city.value = event.target.value)}
    />
  );
}`}
      />

      <p>
        Mount the value half only once <code>loaded</code> is true, the same way
        the ref itself refuses before then.
      </p>

      <h2>Editing Is Local</h2>

      <p>
        A ref write changes the resource in this client and nothing else. No
        request is made.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.ref.address.city.value = 'Busan';

account.isDirty();  // true
account.changes();  // one row: address.city, Seoul -> Busan
account.version();  // a local revision counter`}
      />

      <p>
        Another handle on the same key in the same client sees that edit
        immediately - it is one resource, not a copy per handle.
      </p>

      <h2>Changes</h2>

      <p>
        <code>changes()</code> is the same change model the{' '}
        <a href="#/guide/draft">local draft</a> uses, with the server baseline
        playing the role of the source.
      </p>

      <CodeBlock
        language="typescript"
        code={`const [change] = account.changes();

change.path;      // ['address', 'city']
change.before;    // the server baseline
change.after;     // the local value
change.conflict;  // true when a READ brought a different value for this path
change.id;`}
      />

      <p>
        Arrays are tracked as <strong>one atomic field</strong>. Editing one
        element records a change for the whole array, because an index is a
        position rather than an identity.
      </p>

      <h2>A READ Rebases, It Does Not Overwrite</h2>

      <p>
        When a later READ lands, your local edits stay. A path the server moved
        underneath becomes a conflict instead of being silently replaced.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.ref.address.city.value = 'Busan'; // local

await account.refetch();  // the server now says 'Gwangju' for that path

account.status.value.conflicts;      // 1
account.changes()[0].conflict;       // true
account.ref.address.city.value;      // still 'Busan' - your edit was kept`}
      />

      <p>
        A query handle has no <code>resolve()</code>. Taking the server value,
        keeping yours by saving it, or letting a person choose is covered in{' '}
        <a href="#/guide/sync-lifecycle">Edit Lifecycle</a>.
      </p>

      <h2>Accepting a Known Server Value</h2>

      <p>
        <code>acceptServer(value)</code> moves the baseline without sending
        anything. It is a cache-only acceptance and it excludes an older READ
        that is still in flight.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.acceptServer(knownAccount);`}
      />

      <p>
        It refuses while a linked WRITE is pending on that query - the baseline
        is being decided by an operation that has not answered yet.
      </p>

      <h2>Readonly Queries</h2>

      <p>
        Pass <code>editable: false</code> for data you never edit, or data that
        is not a plain tree (a <code>Date</code>, for example). Ref setters are
        then rejected.
      </p>

      <CodeBlock
        language="typescript"
        code={`const settings = client.query({
  queryKey: ['settings'],
  queryFn: ({ signal }) => api.readSettings({ signal }),
  editable: false,
});

settings.ref.theme.value = 'dark'; // throws: This query is readonly.`}
      />

      <p>
        A readonly query still has <code>changes()</code> and{' '}
        <code>version</code>; they are permanently empty and zero. What it
        refuses is <code>capture()</code>. An empty review surface and an absent
        one are different facts, and the empty list is how you tell them apart.
      </p>

      <p>
        What <code>capture()</code> freezes on an editable query, and what
        happens to your edits after a save, is in{' '}
        <a href="#/guide/sync-lifecycle">Edit Lifecycle</a> - along with how to
        settle a conflict on a query.
      </p>

      <h2>What the Resource Accepts</h2>

      <p>
        Editable data defaults to a plain, acyclic tree with dense arrays.
        Rejected: reserved proxy keys, and direct mutation of an object returned
        by <code>.value</code>. Results returned by{' '}
        <code>load/fetch/ensure</code> are frozen copies - edit through the ref.
      </p>

      <h2>Preparing the Cache</h2>

      <CodeBlock
        language="typescript"
        code={`await client.prefetch(options); // cache on success, swallow a load rejection
const fresh = await client.fetch(options);   // fresh cache or a READ; throws
const cached = await client.ensure(options); // confirmed cache, even if stale

const seeded = client.query({ ...options, initialData: knownAccount });`}
      />

      <p>
        These share the client's cache and in-flight READ by key, and their
        temporary options do not replace an existing handle's options. Use{' '}
        <code>initialData</code> only for a complete, confirmed server value: it
        becomes the editable baseline.
      </p>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/sync-mutation">mutation and link</a> - sending those
          changes
        </li>
        <li>
          <a href="#/guide/draft-conflicts">Conflicts</a> - the same conflict
          model, on a local draft
        </li>
        <li>
          <a href="#/guide/sync-view">display and reactive keys</a> -
          per-observer display state
        </li>
      </ul>
    </div>
  );
});
