import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Shared = mount(() => {
  return () => (
    <div>
      <h1>Shared stores across bundles</h1>
      <p>
        <code>state-ref/shared</code> lets separately built bundles on one page
        use the same store. One bundle provides a watch under a name; any other
        bundle follows it by that name. It works when each bundle carries its
        own copy of state-ref, and whichever bundle loads first.
      </p>
      <p>
        It is a separate entry point. It is not loaded by importing{' '}
        <code>state-ref</code>, and it imports nothing from the core at runtime.
      </p>
      <h2>When to use it</h2>
      <ul>
        <li>
          A page loads several entry bundles (a common bundle, a page bundle, a
          widget bundle) and they need the same state.
        </li>
        <li>
          You are passing state between bundles through{' '}
          <code>window.something</code> today, and load order decides whether it
          works.
        </li>
        <li>
          Inside a single bundle you do not need it: export the watch and import
          it.
        </li>
      </ul>
      <h2>Two ways to share</h2>
      <p>
        Ask one question about the value:{' '}
        <strong>is there one bundle whose job is to fill it?</strong>
      </p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>No owner</th>
            <th>One owner</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Function</td>
            <td>
              <code>ensureShared</code>
            </td>
            <td>
              <code>provideShared</code> + <code>sharedWatch</code>
            </td>
          </tr>
          <tr>
            <td>Who creates it</td>
            <td>Whichever bundle asks first</td>
            <td>The owning bundle</td>
          </tr>
          <tr>
            <td>Other bundles write</td>
            <td>The same ensureShared line</td>
            <td>sharedWatch and a guard</td>
          </tr>
          <tr>
            <td>Guards</td>
            <td>None - the value is always there</td>
            <td>isProvided / isReady</td>
          </tr>
          <tr>
            <td>Typical value</td>
            <td>
              A @stateref/sync client. UI state with a fixed initial value.
            </td>
            <td>A createStore store that one bundle fetches data into.</td>
          </tr>
        </tbody>
      </table>
      <p>
        With <code>@stateref/sync</code>, start with the left column: share the
        client and use sync as usual in every bundle.
      </p>
      <h2>A value nobody owns: ensureShared</h2>
      <p>
        <code>ensureShared(name, create)</code> returns the value under the
        name, creating it if no bundle has yet. Every bundle calls it with the
        same arguments, so put the call in one module they all import.
      </p>
      <CodeBlock
        language="typescript"
        code={`// shared/sync.js - one module every bundle imports
import { createSyncClient } from '@stateref/sync';
import { ensureShared } from 'state-ref/shared';

// Whichever bundle runs this first creates the client; the rest receive it.
export const client = ensureShared('sync', () => createSyncClient());

export const subsQuery = () =>
  client.query({ queryKey: ['subs'], queryFn: fetchMySubs });`}
      />
      <CodeBlock
        language="typescript"
        code={`// any bundle - the ordinary @stateref/sync API, nothing to wait for
import { client, subsQuery } from './shared/sync';

const subs = subsQuery();
subs.watchDisplay(ref => {
  const list = ref.data.value;
  if (!list) return showSpinner();
  renderBadge(list.length);
});
subs.load(); // every bundle may call it; loads that overlap share one read

const subscribe = client.mutation({
  mutationFn: input => api.subscribe(input),
  onSuccess: () => client.invalidate(['subs']),
});`}
      />
      <p>
        There is no provider and no consumer here, and nothing new to learn
        beyond that one line. Which bundle fetches does not need deciding: the
        client's cache holds one entry per key, so every bundle sees the same
        data, and loads that overlap share a single read. A <code>load()</code>{' '}
        made later, once the first has finished, reads again - the same as
        inside one bundle.
      </p>
      <p>
        A plain store works the same way when its initial value is fixed and no
        bundle has to load anything into it.
      </p>
      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import { ensureShared } from 'state-ref/shared';

// The same line in every bundle that needs it.
const modalWatch = ensureShared('ui.modal', () => createStore({ open: false }));

modalWatch(ref => toggleModal(ref.open.value)); // an ordinary watch, no guard
modalWatch().open.value = true;`}
      />
      <h2>A store with an owner: provideShared</h2>
      <p>
        The provider is the bundle that owns the data. It makes the store any
        way it likes and registers the watch with <code>provideShared</code>.
      </p>
      <CodeBlock
        language="typescript"
        code={`// subs bundle - the one that owns the data
import { createStore } from 'state-ref';
import { provideShared } from 'state-ref/shared';

const subsWatch = createStore({ loaded: false, error: null, mySubs: [] });

provideShared('subs', subsWatch, {
  ready: ref => ref.loaded.value, // when the data can be used
});

// Only this bundle fetches.
const subs = subsWatch();
fetchMySubs()
  .then(list => {
    subs.mySubs.value = list;
    subs.loaded.value = true;
  })
  .catch(error => {
    subs.error.value = String(error);
  });`}
      />
      <p>
        <code>ready</code> is the provider's statement of when the data can be
        used. Consumers never need to know which field means that. Leave it out
        and the store counts as ready the moment it is provided.
      </p>
      <h2>Use it from another bundle</h2>
      <p>
        <code>sharedWatch(name)</code> returns a watch straight away, whether or
        not the provider has loaded. Use it like any watch, with one rule: run a
        guard before reading.
      </p>
      <CodeBlock
        language="typescript"
        code={`// article bundle - it may load before or after the subs bundle
import { sharedWatch, isReady } from 'state-ref/shared';

const subsWatch = sharedWatch('subs');

subsWatch(ref => {
  if (!isReady(ref)) return; // not provided yet, or still loading
  renderBadge(ref.mySubs.value.length); // from here on, an ordinary ref
});`}
      />
      <p>
        The subscriber runs once immediately. If the store is not there yet, it
        runs again when the store arrives, and again whenever something it read
        changes - including the provider's ready condition.
      </p>
      <h2>The three stages</h2>
      <p>
        A shared store goes through three stages, and there is one guard for
        each boundary.
      </p>
      <table>
        <thead>
          <tr>
            <th>Stage</th>
            <th>isProvided</th>
            <th>isReady</th>
            <th>What you can do</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Not provided</td>
            <td>false</td>
            <td>false</td>
            <td>Nothing. Reading a path throws.</td>
          </tr>
          <tr>
            <td>Provided, not ready</td>
            <td>true</td>
            <td>false</td>
            <td>
              Read and write the store, including its loading and error state.
            </td>
          </tr>
          <tr>
            <td>Ready</td>
            <td>true</td>
            <td>true</td>
            <td>Use the data.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Most code needs only <code>isReady</code>. Reach for{' '}
        <code>isProvided</code> when you want to show loading or error state the
        store itself carries.
      </p>
      <CodeBlock
        language="typescript"
        code={`subsWatch(ref => {
  if (!isProvided(ref)) return hideBadge(); // the subs bundle is not here
  if (ref.error.value) return showRetry(); // the store exists, the fetch failed
  if (!isReady(ref)) return showSpinner(); // the store exists, still loading
  renderBadge(ref.mySubs.value.length);
});`}
      />
      <h2>Writing</h2>
      <p>
        After a guard the ref is the provider's own, so a write goes to the
        provider's store and notifies every subscriber in every bundle.
      </p>
      <CodeBlock
        language="typescript"
        code={`const ref = subsWatch(); // no callback: a ref without a subscription

button.addEventListener('click', () => {
  if (!isProvided(ref)) return;
  ref.mySubs.value = [...ref.mySubs.value, newSub]; // the provider's subscribers run too
});`}
      />
      <h2>Run once when ready</h2>
      <p>
        For "do this once the data is there", <code>whenReady</code> is shorter
        than a subscription with a guard.
      </p>
      <CodeBlock
        language="typescript"
        code={`import { whenReady } from 'state-ref/shared';

// Runs once, when 'subs' is provided and ready, then unsubscribes.
whenReady('subs', ref => {
  insertBanner(ref.mySubs.value); // no guard needed in here
});

// A shared watch works too, and select adds a condition of your own.
whenReady(subsWatch, ref => openOnboarding(), {
  select: ref => ref.mySubs.value.length === 0,
});

// Cancel while still waiting.
const controller = new AbortController();
whenReady('subs', start, { signal: controller.signal });
controller.abort();`}
      />
      <p>
        Given a plain watch instead of a shared one, <code>whenReady</code>{' '}
        treats a truthy root value as ready, and <code>select</code> replaces
        that test.
      </p>
      <h2>With a UI connector</h2>
      <p>
        A shared watch goes into a connector's view form. The hook can be made
        at module level, and the component re-renders by itself at each stage.
      </p>
      <CodeBlock
        language="tsx"
        code={`import { connectPreactView } from '@stateref/connect-preact';
import { sharedWatch, isProvided, isReady } from 'state-ref/shared';

// Module level, with no provider in sight yet.
const useSubs = connectPreactView(sharedWatch('subs'));

function Badge() {
  const subs = useSubs();
  if (!isProvided(subs)) return null;
  if (!isReady(subs)) return <Spinner />;
  return <span>{subs.mySubs.value.length}</span>;
}`}
      />
      <p>
        This is covered by tests for Preact (<code>connectPreactView</code>).
        The other connectors have the same view form, but a shared watch has not
        been tested through them yet.
      </p>
      <h2>TypeScript</h2>
      <p>
        A shared ref has no paths until a guard has run, so forgetting the guard
        is a compile error. Give a second type argument to say what the store
        looks like once ready, and the guard narrows inner fields too.
      </p>
      <CodeBlock
        language="typescript"
        code={`type Subs = { loaded: boolean; error: string | null; mySubs: Sub[] | null };
type LoadedSubs = Subs & { loaded: true; mySubs: Sub[] };

// The second type argument is what the store looks like once it is ready.
const subsWatch = sharedWatch<Subs, LoadedSubs>('subs');

subsWatch(ref => {
  ref.mySubs; // compile error: a shared ref has no paths before a guard
  if (!isProvided(ref)) return;
  ref.mySubs.value; // Sub[] | null
  if (!isReady(ref)) return;
  ref.mySubs.value.length; // Sub[] - no null check needed
});`}
      />
      <p>
        The ready type is a promise the type checker cannot verify against the
        provider's <code>ready</code> function. Keep the two next to each other.
      </p>
      <p>
        To have the type follow from the name everywhere, list the name in{' '}
        <code>SharedStores</code>.
      </p>
      <CodeBlock
        language="typescript"
        code={`// shared/subs.ts - one module both bundles import
import type { Sub } from './types';

export type Subs = { loaded: boolean; mySubs: Sub[] | null };

declare module 'state-ref/shared' {
  interface SharedStores {
    subs: Subs;
  }
}

// Anywhere after that:
provideShared('subs', createStore('nope')); // compile error: not a Subs store
sharedWatch('subs'); // SharedWatch<Subs>, no type argument`}
      />
      <h2>Sharing one query instead of the client</h2>
      <p>
        Sharing the client with <code>ensureShared</code> is the usual way with
        sync. When one bundle should keep its queries to itself and hand the
        others only a result, it can provide a query's watch instead. Consumers
        follow it with <code>sharedWatch</code> and the guards, exactly as with
        a createStore store.
      </p>
      <h3>The display watch</h3>
      <p>Status and data in one tree. Use this when consumers only read.</p>
      <CodeBlock
        language="typescript"
        code={`// Provider: a query's display watch carries status and data in one tree.
import { createSyncClient } from '@stateref/sync';
import { provideShared } from 'state-ref/shared';

const client = createSyncClient();
const subsQuery = client.query({ queryKey: ['subs'], queryFn: fetchMySubs });

provideShared('subs', subsQuery.watchDisplay, {
  ready: ref => ref.loaded.value,
});
subsQuery.load();

// Consumer: the same three lines as before.
sharedWatch('subs')(ref => {
  if (!isProvided(ref)) return;
  if (ref.error.value) return showRetry();
  if (!isReady(ref)) return showSpinner();
  renderBadge(ref.data.value.length);
});`}
      />
      <h3>The data watch</h3>
      <p>
        A query's <code>watch</code> cannot be read before its first load, so
        provide it after <code>load()</code>. Consumers stay in the not-provided
        stage until then.
      </p>
      <CodeBlock
        language="typescript"
        code={`// Provider: share the editable data watch, after the first load.
await subsQuery.load();
provideShared('subs', subsQuery.watch);

// Consumer: pending until then, then reads and edits the query's data.
const subsWatch = sharedWatch('subs');
const ref = subsWatch();
if (isProvided(ref)) ref.value = [...ref.value, newSub]; // a local edit on the query`}
      />
      <h2>Rules</h2>
      <ul>
        <li>
          <strong>One way per name.</strong> A name is either ensured by every
          bundle or provided by one. Mixing them means whichever ran first wins,
          and a later provideShared is ignored with a warning.
        </li>
        <li>
          <strong>One provider per name.</strong> The first provideShared stays.
          Providing something else under the same name logs a warning and
          returns the first, so a provider module that ends up in two bundles
          does not break the page.
        </li>
        <li>
          <strong>An owned store is filled by its owner.</strong> Keep loading
          in the bundle that calls provideShared. A consumer that also fetches
          and writes will race with it. If no bundle should own the loading,
          share a sync client with ensureShared instead.
        </li>
        <li>
          <strong>The first ensureShared decides.</strong> Its create function
          runs; the others are never called. Give every bundle the same one -
          client options that differ between bundles are silently dropped.
        </li>
        <li>
          <strong>Guard before reading.</strong> In JavaScript nothing stops you
          from skipping the guard; reading a path of a store that is not
          provided throws with a message naming the guard.
        </li>
        <li>
          <strong>Names are global to the page.</strong> Prefix them by feature,
          and keep the name, the types and the ready condition in one module
          both bundles import.
        </li>
        <li>
          <strong>There is no unprovide.</strong> A shared store lives as long
          as the page.
        </li>
        <li>
          <strong>batch does not cross copies.</strong> <code>batch</code> from{' '}
          <code>state-ref/batch</code> coalesces writes only for stores made by
          the same copy of state-ref. A consumer bundle with its own copy gets
          one notification per write; values are still correct.
        </li>
        <li>
          <strong>Not for per-request state on a server.</strong> The registry
          lives on <code>globalThis</code>, which a server shares between
          requests.
        </li>
      </ul>
      <CodeBlock
        language="typescript"
        code={`const ref = sharedWatch('subs')();
ref.mySubs.value;
// Error: state-ref/shared: "subs" is not provided yet, so it has no "mySubs".
// Check isProvided(ref) or isReady(ref) before reading it.`}
      />
      <h2>Finding a missing provider</h2>
      <CodeBlock
        language="typescript"
        code={`import { pendingShared } from 'state-ref/shared';

pendingShared(); // ['subs'] - something waits for it and no bundle provided it`}
      />
      <h2>UMD</h2>
      <p>
        The UMD build is standalone. It exposes <code>stateRefShared</code>.
      </p>
      <CodeBlock
        language="html"
        code={`<script src="state-ref.umd.js"></script>
<script src="state-ref.shared.umd.js"></script>
<script>
  var subsWatch = stateRefShared.sharedWatch('subs');
  subsWatch(function (ref) {
    if (!stateRefShared.isReady(ref)) return;
    render(ref.mySubs.value);
  });
</script>`}
      />
      <h2>API</h2>
      <table>
        <thead>
          <tr>
            <th>Function</th>
            <th>Does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>ensureShared(name, create)</code>
            </td>
            <td>
              The value under the name, created by create if no bundle has yet.
              For a value with no single owner.
            </td>
          </tr>
          <tr>
            <td>
              <code>provideShared(name, value, options?)</code>
            </td>
            <td>
              Registers a watch (or any value) as its owner. options.ready says
              when a store's data can be used.
            </td>
          </tr>
          <tr>
            <td>
              <code>sharedWatch(name)</code>
            </td>
            <td>
              A watch over the store under that name, usable before it is
              provided.
            </td>
          </tr>
          <tr>
            <td>
              <code>isProvided(ref)</code>
            </td>
            <td>
              Whether the store exists. Narrows the ref to an ordinary one.
            </td>
          </tr>
          <tr>
            <td>
              <code>isReady(ref)</code>
            </td>
            <td>
              Whether the store exists and the provider's ready condition holds.
            </td>
          </tr>
          <tr>
            <td>
              <code>whenReady(source, callback, options?)</code>
            </td>
            <td>
              Runs the callback once when ready, then unsubscribes. source is a
              shared watch, a name, or a plain watch.
            </td>
          </tr>
          <tr>
            <td>
              <code>getShared(name)</code>
            </td>
            <td>
              What is registered right now, or undefined. For values that are
              not watches.
            </td>
          </tr>
          <tr>
            <td>
              <code>onShared(name, callback, options?)</code>
            </td>
            <td>
              Runs the callback once with the registered value, now or when it
              is provided.
            </td>
          </tr>
          <tr>
            <td>
              <code>pendingShared()</code>
            </td>
            <td>Names something is waiting for that no bundle has provided.</td>
          </tr>
        </tbody>
      </table>
      <h2>Related</h2>
      <ul>
        <li>
          <a href="#/guide/subscription">Subscription</a> - how a subscriber
          collects what it reads
        </li>
        <li>
          <a href="#/guide/sync">@stateref/sync</a> - queries and mutations
        </li>
        <li>
          <a href="#/guide/batch">batch</a> - coalescing writes within one copy
        </li>
      </ul>
    </div>
  );
});
