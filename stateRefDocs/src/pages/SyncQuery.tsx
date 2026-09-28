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

      <h2>Reading</h2>

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
