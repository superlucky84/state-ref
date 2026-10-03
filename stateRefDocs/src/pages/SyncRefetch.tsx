import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncRefetch = mount(() => {
  return () => (
    <div>
      <h1>Automatic Refetch</h1>

      <p>
        Focus, reconnect and polling policies become active{' '}
        <strong>
          after a handle's first <code>load()</code> or <code>refetch()</code>
        </strong>
        . An active <a href="#/guide/sync-view">reactive key</a> performs that
        first load itself. Nothing polls a query you never read.
      </p>

      <h2>The Environment</h2>

      <p>
        The package does not read browser globals on its own. Focus and
        connectivity arrive through a <code>SyncEnvironment</code> you inject
        into the client, and the browser adapter must be called where browser
        globals actually exist.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createBrowserSyncEnvironment, createSyncClient } from '@stateref/sync';

const environment = createBrowserSyncEnvironment();
const client = createSyncClient({ environment });`}
      />

      <p>
        <code>createBrowserSyncEnvironment()</code> builds that environment from
        the browser for you: it answers &quot;is the tab visible?&quot; and
        &quot;is it online?&quot;, and turns browser events into the two events
        the client understands.
      </p>

      <table>
        <thead>
          <tr>
            <th>part</th>
            <th>what the browser adapter uses</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>isFocused()</code>
            </td>
            <td>
              <code>document.visibilityState === &apos;visible&apos;</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>isOnline()</code>
            </td>
            <td>
              <code>navigator.onLine !== false</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>&apos;focus&apos;</code> event
            </td>
            <td>
              <code>window</code> <code>focus</code> or <code>document</code>{' '}
              <code>visibilitychange</code>, when the tab is visible
            </td>
          </tr>
          <tr>
            <td>
              <code>&apos;reconnect&apos;</code> event
            </td>
            <td>
              <code>window</code> <code>online</code>, when online
            </td>
          </tr>
        </tbody>
      </table>

      <p>The client uses the environment for three things:</p>

      <ul>
        <li>
          <code>refetchOnFocus</code> / <code>refetchOnReconnect</code> react to
          the <code>&apos;focus&apos;</code> and{' '}
          <code>&apos;reconnect&apos;</code> events.
        </li>
        <li>
          Polling skips while <code>isFocused()</code> is false (a background
          tab), unless <code>refetchIntervalInBackground</code> is{' '}
          <code>true</code>.
        </li>
        <li>
          With <code>networkMode: &apos;online&apos;</code> (the default), a
          READ waits while <code>isOnline()</code> is false and starts when the
          host is online again.
        </li>
      </ul>

      <p>
        Without an environment there are no focus or reconnect events at all,
        and polling and network mode treat the host as focused and online. That
        is the usual setup for a server-side client; an SSR client creates
        neither event subscriptions nor polling timers anyway.
      </p>

      <h3>Outside the Browser</h3>

      <p>
        Calling <code>createBrowserSyncEnvironment()</code> where{' '}
        <code>window</code>, <code>document</code> and <code>navigator</code> do
        not exist throws{' '}
        <code>Browser sync environment requires a browser host.</code> Call it
        only in browser code. You can also pass the three objects yourself:{' '}
        <code>
          createBrowserSyncEnvironment(&#123; window, document, navigator
          &#125;)
        </code>
        .
      </p>

      <p>
        Anywhere else - a native app, Electron, a test, your own connectivity
        check - implement <code>SyncEnvironment</code> directly. It is three
        functions:
      </p>

      <CodeBlock
        language="typescript"
        code={`import type { SyncEnvironment } from '@stateref/sync';

// app and network stand for whatever your host provides
let online = network.isConnected();

const environment: SyncEnvironment = {
  isFocused: () => app.isActive(),
  isOnline: () => online,
  subscribe: listener => {
    const offActive = app.onActive(() => listener('focus'));
    const offNetwork = network.onChange(connected => {
      const cameBack = !online && connected;
      online = connected;
      if (cameBack) listener('reconnect');
    });
    return () => {
      offActive();
      offNetwork();
    };
  },
};

const client = createSyncClient({ environment });`}
      />

      <ul>
        <li>
          Call <code>listener(&apos;focus&apos;)</code> when the app becomes
          active and <code>listener(&apos;reconnect&apos;)</code> when it comes
          back online - not on every network change.
        </li>
        <li>
          <code>subscribe</code> must return a function that removes what it
          added; the client calls it when no query needs the events any more.
        </li>
      </ul>

      <h2>Policies</h2>

      <CodeBlock
        language="typescript"
        code={`const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
  staleTime: 30_000,

  // each event has its own option, so the values can differ
  refetchOnFocus: true,          // on focus: only if stale (true is the default)
  refetchOnReconnect: 'always',  // on reconnect: even if fresh
  refetchInterval: 60_000,       // opt-in polling
  refetchIntervalInBackground: false, // default
});

await account.load(); // the policies start here`}
      />

      <p>
        <code>refetchOnFocus</code> and <code>refetchOnReconnect</code> are
        independent options. The example means &quot;on focus, only if stale; on
        reconnect, always&quot; - two different values on purpose. Both options
        take the same three values:
      </p>

      <table>
        <thead>
          <tr>
            <th>value</th>
            <th>when that event happens</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>true</code>
            </td>
            <td>
              refetch only if the data is stale (past <code>staleTime</code>, or{' '}
              <code>invalidate()</code>d)
            </td>
          </tr>
          <tr>
            <td>
              <code>&apos;always&apos;</code>
            </td>
            <td>refetch even fresh data</td>
          </tr>
          <tr>
            <td>
              <code>false</code>
            </td>
            <td>do not refetch</td>
          </tr>
        </tbody>
      </table>

      <p>
        The defaults are <code>refetchOnFocus: true</code> and{' '}
        <code>refetchOnReconnect: true</code>, except that a query with{' '}
        <code>networkMode: &apos;always&apos;</code> does not depend on
        connectivity, so its <code>refetchOnReconnect</code> defaults to{' '}
        <code>false</code>.
      </p>

      <ul>
        <li>
          Events run only while the environment is focused. Online modes also
          require connectivity.
        </li>
        <li>
          Polling is opt-in and pauses in the background unless{' '}
          <code>refetchIntervalInBackground</code> says otherwise.
        </li>
      </ul>

      <h2>Sharing and Blocking</h2>

      <ul>
        <li>
          Same-key observers and an already running READ share{' '}
          <strong>one request</strong>.
        </li>
        <li>
          Automatic results use the normal rebase rules: your local edits stay,
          and an overlapping server change becomes a conflict.
        </li>
        <li>
          <strong>Linked WRITEs block automatic READs</strong> on that query -
          the baseline is being decided by an operation that has not answered.
        </li>
      </ul>

      <h2>Cleanup</h2>

      <p>
        Disposing the last started observer removes the environment
        subscription, and disposing each handle clears its polling timer.
      </p>

      <h2>Network Mode</h2>

      <p>Each query picks how it behaves while the host is offline.</p>

      <CodeBlock
        language="typescript"
        code={`networkMode: 'online'       // the default
networkMode: 'always'
networkMode: 'offlineFirst'`}
      />

      <ul>
        <li>
          <strong>
            <code>'online'</code>
          </strong>{' '}
          - an offline READ stays pending with{' '}
          <code>status.fetchStatus.value === 'paused'</code> and resumes on
          reconnect.
        </li>
        <li>
          <strong>
            <code>'always'</code>
          </strong>{' '}
          - runs and retries offline. Its default reconnect-refetch policy is{' '}
          <code>false</code>, though an explicit <code>refetchOnReconnect</code>{' '}
          can enable it. It can also refetch on focus or poll while offline.
        </li>
        <li>
          <strong>
            <code>'offlineFirst'</code>
          </strong>{' '}
          - tries the query function once while offline, which allows a local
          cache hit, then pauses a failed retry until reconnect.
        </li>
      </ul>

      <p>
        A paused request keeps its previous data and local edits. Invalidation
        or disposal cancels the wait. SSR treats the environment as online.
      </p>

      <p>
        <code>navigator.onLine</code> is only a hint, which is why the
        environment is injectable: a host that knows better can say so. A query
        that needs no network at all can use <code>'always'</code>.
      </p>

      <h2>Mutations Are Not Covered by This</h2>

      <p>
        Mutations keep their own explicit retry and unknown-result rules - an{' '}
        <code>unknown</code> write is never resent automatically, whatever the
        network mode says. For offline commands, use the explicit queue in{' '}
        <a href="#/guide/sync-persistence">Persistence and SSR</a>.
      </p>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/sync-query">query and resource</a> - what a rebase
          does to your edits
        </li>
        <li>
          <a href="#/guide/sync-observation">Observation</a> - counting
          environment listeners
        </li>
        <li>
          <a href="#/guide/sync-mutation">mutation and link</a> - why a linked
          WRITE blocks a READ
        </li>
      </ul>
    </div>
  );
});
