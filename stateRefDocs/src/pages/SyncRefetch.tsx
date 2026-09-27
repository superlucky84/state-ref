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
        . An active <a href="#/guide/sync-view">liveView</a> performs that first
        load itself. Nothing polls a query you never read.
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
        Without an environment there are no focus or reconnect events at all,
        and polling treats the host as focused and online. An SSR client creates
        neither event subscriptions nor polling timers.
      </p>

      <h2>Policies</h2>

      <CodeBlock
        language="typescript"
        code={`const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
  staleTime: 30_000,

  refetchOnFocus: true,          // default: stale data only
  refetchOnReconnect: 'always',  // include fresh data
  refetchInterval: 60_000,       // opt-in polling
  refetchIntervalInBackground: false, // default
});

await account.load(); // the policies start here`}
      />

      <ul>
        <li>
          <code>true</code> refetches only when the data is stale;{' '}
          <code>'always'</code> refetches even fresh data; <code>false</code>{' '}
          disables the policy.
        </li>
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
