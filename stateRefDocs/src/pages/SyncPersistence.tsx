import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncPersistence = mount(() => {
  return () => (
    <div>
      <h1>Persistence and SSR</h1>

      <p>
        There are four separate storage stories here, and they are deliberately
        not one feature: an SSR cache transfer, a clean-baseline snapshot, a
        local-edit recovery snapshot, and an offline command queue. Each answers
        a different question, and each wants{' '}
        <strong>its own storage key with one writer</strong>.
      </p>

      <h2>SSR Cache Transfer</h2>

      <p>
        Transfer only <strong>settled, clean</strong> server baselines between
        two separate clients.
      </p>

      <CodeBlock
        language="typescript"
        code={`const server = createSyncClient({ ssr: true });
const source = server.query(options);
await source.load();
const snapshot = JSON.parse(JSON.stringify(server.dehydrate()));

const browser = createSyncClient();
browser.hydrate(snapshot); // before creating any query handles
const restored = browser.query(options);`}
      />

      <p>
        The snapshot preserves query keys, server data, freshness times,
        invalidation and editability. Data must be JSON-compatible.
      </p>

      <p>
        <code>dehydrate()</code> <strong>rejects</strong> local edits, in-flight
        READ or linked WRITE operations, and unconfirmed WRITE outcomes rather
        than silently dropping them. That refusal is the point: a snapshot that
        quietly lost an unsaved edit would be worse than no snapshot.
      </p>

      <p>
        <code>status.unconfirmed</code> stays true after an unknown WRITE
        outcome or a failed post-WRITE reconciliation, until a successful READ
        or an accepted known server value. Such entries are retained through GC.
      </p>

      <p>
        This is cache transfer - <strong>not</strong> local-edit persistence and{' '}
        <strong>not</strong> offline mutation recovery.
      </p>

      <h2>Clean Baseline Snapshot</h2>

      <p>
        Save and restore are explicit, and restore requires a new, empty client.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { saveSyncSnapshot, restoreSyncSnapshot } from '@stateref/sync';

const options = { key: 'account-baseline', buster: 'api-v1', maxAge: 60_000 };

await saveSyncSnapshot(client, localStorage, options);

const restored = createSyncClient();
await restoreSyncSnapshot(restored, localStorage, options);`}
      />

      <ul>
        <li>
          <code>saveSyncSnapshot</code> rejects dirty resources, pending READs,
          linked WRITEs and unconfirmed baselines.
        </li>
        <li>
          Expired or differently busted snapshots are{' '}
          <strong>ignored without deleting</strong> the stored data.
        </li>
        <li>
          A malformed snapshot throws <em>before</em> changing the client.
        </li>
        <li>
          <code>localStorage</code> is only an example; <code>SyncStorage</code>{' '}
          also accepts asynchronous methods. Scope the key to the current user
          and data partition.
        </li>
      </ul>

      <h2>Local Recovery Snapshot</h2>

      <p>
        To keep local edits and an unconfirmed baseline, use the separate schema
        2 recovery snapshot. It carries the server baseline, the displayed
        value, change IDs and conflict origins.
      </p>

      <CodeBlock
        language="typescript"
        code={`import {
  saveLocalSyncSnapshot,
  restoreLocalSyncSnapshot,
} from '@stateref/sync';

const localOptions = { key: 'account-local', buster: 'api-v1', maxAge: 60_000 };

await saveLocalSyncSnapshot(client, localStorage, localOptions);

const recovered = createSyncClient();
await restoreLocalSyncSnapshot(recovered, localStorage, localOptions);`}
      />

      <p>
        Restore starts no READ and no WRITE. Recreate the query handle with its
        query function; a later READ rebases the restored edit through the
        normal conflict rules. An unconfirmed WRITE stays unconfirmed until a
        successful READ or an explicit known server value.
      </p>

      <p>
        A saved local snapshot does <strong>not</strong> contain an active
        mutation's DTO or submission record, so it cannot resume a linked WRITE.
      </p>

      <h2>A Persisted Linked Submission</h2>

      <p>
        To survive a restart in the middle of a save, keep the DTO and the
        recovery snapshot together under their own key.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { openPersistedLinkedMutation } from '@stateref/sync';

const linked = await openPersistedLinkedMutation({
  storage: localStorage,
  key: 'account-linked',
  buster: 'api-v1',
  isOnline: () => navigator.onLine,
});

await linked.stage(client, {
  id: 'city-42',
  input: { city: account.ref.address.city.value },
  idempotencyKey: 'city-42',
  links: [
    {
      query: account,
      ids: account
        .changes()
        .filter(change => change.path.join('.') === 'address.city')
        .map(change => change.id),
      accept: 'submitted',
    },
    { query: preferences, accept: 'refetch', onReject: 'remove' },
  ],
});

// null while offline; the handles must match the staged keys, in any order
const outcome = await linked.send(client, [account, preferences], save);`}
      />

      <p>
        <code>send</code> rechecks every link first and starts no WRITE if any
        one of them changed. It writes an <code>inFlight</code> marker and an
        unconfirmed recovery snapshot <em>before</em> calling{' '}
        <code>mutationFn</code>. A failed marker write prevents the WRITE
        entirely.
      </p>

      <p>
        <strong>
          On restart an <code>inFlight</code> record becomes{' '}
          <code>unknown</code>.
        </strong>{' '}
        Inspect and reconcile it with the server before calling{' '}
        <code>discard()</code>. It is never replayed automatically.
      </p>

      <p>
        Each link carries a serializable <code>none</code>,{' '}
        <code>submitted</code> or <code>refetch</code> acceptance and its own
        rejection policy. <code>response.select</code> needs a function, so that
        acceptance still requires a direct <code>mutation.run</code>.
      </p>

      <h3>checkpoint</h3>

      <p>
        Open the record with <code>checkpoint: true</code> to keep edits made{' '}
        <em>during</em> the WRITE durable as well. The snapshot is refreshed on
        every local change, bursts collapse into one trailing write, and a
        failed checkpoint leaves the previous snapshot without cancelling the
        WRITE. It costs one storage write per change, so it is off by default.
      </p>

      <h2>Offline Command Queue</h2>

      <p>
        For an independent command, queue a JSON DTO with a server-supported
        idempotency key.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { openPersistedMutationQueue } from '@stateref/sync';

const send = client.mutation({
  mutationFn: (input: { note: string }, { idempotencyKey }) =>
    api.sendNote(input, { idempotencyKey }),
});

const queue = await openPersistedMutationQueue({
  storage: localStorage,
  key: 'pending-notes',
  buster: 'api-v1',
  maxAge: 24 * 60 * 60 * 1000,
  commands: { send },
  isOnline: () => navigator.onLine,
});

await queue.enqueue({
  id: 'note-42',
  command: 'send',
  input: { note: 'Hello' },
  idempotencyKey: 'note-42',
});

await queue.resume();

// or let a reconnect call resume() for you
const stopAutoResume = queue.autoResume(environment, {
  onSettled: results => console.log(results.map(item => item.result.kind)),
  onError: error => report(error),
});`}
      />

      <p>
        <code>autoResume</code> automates only <strong>when</strong>{' '}
        <code>resume()</code> runs, never which jobs may run. It reacts to{' '}
        <code>reconnect</code> rather than focus, checks{' '}
        <code>environment.isOnline()</code> first, and runs once immediately if
        it attaches while already online. Runs never overlap. An automatic
        resume never calls <code>retryUnknown</code>.
      </p>

      <p>
        A linked submission is deliberately excluded from the queue: sending one
        needs live query handles and a local state only the app knows is still
        current.
      </p>

      <h3>Unknown jobs block the queue</h3>

      <ul>
        <li>
          The queue writes an <code>inFlight</code> marker before every WRITE.
          On restart that job becomes <code>unknown</code>, and it and later
          jobs are held.
        </li>
        <li>
          <code>retryUnknown(id)</code> reuses the key - use it only when the
          server guarantees idempotency for that key, or after reconciling with
          the server.
        </li>
        <li>
          <code>discard(id)</code> is explicit, and cannot cancel an in-flight
          server WRITE.
        </li>
        <li>
          Commands older than <code>maxAge</code> stay queued and block later
          jobs until you review or discard them. They are not dropped.
        </li>
      </ul>

      <p>
        The queue does not serialize resource submissions, local edits, mutation
        callbacks or query handles. Recreate the command registry for each new
        client, and invalidate or refetch affected queries after a successful
        command.
      </p>

      <h2>One Writer Per Key</h2>

      <p>
        Use separate storage keys for linked submissions, clean baselines, local
        snapshots and standalone commands - and exactly one writer for each.
      </p>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/sync-mutation">mutation and link</a> - what{' '}
          <code>unknown</code> and <code>sync-error</code> mean
        </li>
        <li>
          <a href="#/guide/sync-refetch">Automatic refetch</a> - network mode
          while offline
        </li>
        <li>
          <a href="#/api/sync">Sync API</a> - the full surface
        </li>
      </ul>
    </div>
  );
});
