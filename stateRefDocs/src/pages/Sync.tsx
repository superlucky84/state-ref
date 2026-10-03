import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Sync = mount(() => {
  return () => (
    <div>
      <h1>createSyncClient</h1>

      <p>
        <code>@stateref/sync</code> is a separate package that adds a shared
        query cache, an <strong>editable</strong> resource ref over the server
        baseline, and mutations. Importing <code>state-ref</code> alone does not
        load it.
      </p>

      <p>
        What makes it different from a plain query cache: the cached value is
        not read-only. You edit it through an ordinary <code>state-ref</code>{' '}
        ref, and the client keeps the server baseline and your local edit as two
        separate things it can still tell apart.
      </p>

      <h2>Install</h2>

      <CodeBlock
        language="bash"
        code={`npm install state-ref @stateref/sync`}
      />

      <h2>A First Query</h2>

      <CodeBlock
        language="typescript"
        code={`import { createSyncClient } from '@stateref/sync';

type Account = { address: { city: string } };

const client = createSyncClient(); // one per app, or one per SSR request

const account = client.query({
  queryKey: ['account', 1],
  queryFn: async ({ signal }): Promise<Account> => {
    const response = await fetch('/account/1', { signal });
    return response.json();
  },
});

await account.load();

account.ref.address.city.value = 'Busan'; // a local edit, not a network write
account.isDirty();  // true
account.changes();  // server baseline -> current local edit`}
      />

      <p>
        <code>account.ref</code> is a <code>state-ref</code> ref, so every
        connector binds to it the same way a store does.
      </p>

      <h2>The Client</h2>

      <p>
        The client owns its cache. Two handles with the same key in the same
        client share one baseline, one in-flight READ, and one local edit.
      </p>

      <CodeBlock
        language="typescript"
        code={`const a = client.query(options);
const b = client.query(options); // same key

a.ref.address.city.value = 'Busan';
b.ref.address.city.value;        // 'Busan' - the same resource

// a different client is a different cache
const other = createSyncClient();
other.query(options).ref.address.city.value; // unaffected`}
      />

      <p>
        Create a separate client for each SSR request. A shared client would
        leak one request's data into another's.
      </p>

      <h2>Defaults</h2>

      <ul>
        <li>
          <code>staleTime: 0</code> - a baseline is stale as soon as it lands
        </li>
        <li>
          inactive <code>gcTime</code>: 5 minutes, infinite for{' '}
          <code>createSyncClient({'{ ssr: true }'})</code>
        </li>
        <li>three query retries in a client, zero in SSR</li>
        <li>
          <code>queryKey</code> must be an acyclic, JSON-compatible array;
          object key order is ignored when it is hashed
        </li>
      </ul>

      <h2>Nothing Starts by Itself</h2>

      <p>
        A fixed-key query needs an explicit <code>load()</code>. The exceptions
        are a mutation response, <code>acceptServer</code>, and an active{' '}
        <a href="#/guide/sync-view">reactive key</a>, which loads on its own.
      </p>

      <p>
        And in the other direction:{' '}
        <strong>a local edit never writes to a server.</strong> Saving is always
        an explicit mutation.
      </p>

      <h2>Scope and Limits</h2>

      <p>
        This package covers a defined comparison scope, and the project tracks
        it row by row rather than claiming parity. Four of the nine rows are
        recorded as <strong>partial</strong>:
      </p>

      <ul>
        <li>
          <strong>pagination / infinite</strong> - no reactive key switching for
          infinite queries; <code>infiniteQuery</code> takes a fixed key only
        </li>
        <li>
          <strong>SSR</strong> - cache transfer is supported; framework-specific
          loading and error boundaries are not part of the package
        </li>
        <li>
          <strong>devtools / observation</strong> - a read-only metadata
          boundary, not a devtools or plugin compatibility API
        </li>
        <li>
          <strong>reactive options across connectors</strong> - supported
          through a reactive key, with per-connector differences
        </li>
      </ul>

      <p>
        No equivalence with any other library is declared. When a behaviour
        matters to you, check it against the package's own tests rather than
        against an option name that looks familiar.
      </p>

      <h2>Where to Go Next</h2>

      <ul>
        <li>
          <a href="#/guide/sync-query">query and resource</a> - loading,
          editing, and reading changes
        </li>
        <li>
          <a href="#/guide/sync-mutation">mutation and link</a> - sending an
          edit and accepting the result
        </li>
        <li>
          <a href="#/guide/sync-lifecycle">Edit Lifecycle</a> - what{' '}
          <code>capture()</code> freezes and what each result does to your edits
        </li>
        <li>
          <a href="#/guide/sync-view">display and reactive keys</a> -
          placeholders, selection, and reactive keys
        </li>
        <li>
          <a href="#/guide/sync-infinite">Infinite Queries</a> - lists that grow
          page by page
        </li>
        <li>
          <a href="#/guide/sync-stream">Streaming</a> - WebSocket and NDJSON
          pushes shown as they arrive
        </li>
        <li>
          <a href="#/guide/sync-refetch">Automatic refetch</a> - focus,
          reconnect, polling, and network mode
        </li>
        <li>
          <a href="#/guide/sync-persistence">Persistence and SSR</a> - snapshots
          and offline queues
        </li>
        <li>
          <a href="#/guide/sync-observation">Observation</a> - what the client
          is holding
        </li>
        <li>
          <a href="#/guide/sync-form">Form Save Recipe</a> - a draft form saved
          through a mutation, end to end
        </li>
        <li>
          <a href="#/api/sync">Sync API</a> - the full surface
        </li>
      </ul>
    </div>
  );
});
