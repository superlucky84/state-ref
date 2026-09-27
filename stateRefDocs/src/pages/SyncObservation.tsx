import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncObservation = mount(() => {
  return () => (
    <div>
      <h1>Observation</h1>

      <p>
        Tools can inspect what a client is holding without reading any query
        payload. This is a <strong>read-only metadata boundary</strong> - not a
        devtools or plugin compatibility API for any other library.
      </p>

      <h2>The Cache</h2>

      <CodeBlock
        language="typescript"
        code={`const stopObserving = client.subscribeCache(event => {
  // event.type: 'added' | 'updated' | 'removed'
  console.log(event.type, event.entry.queryKey, event.entry.status);
});

const currentCache = client.inspectCache();

stopObserving();`}
      />

      <p>
        Each entry carries its <code>queryKey</code>, its <code>kind</code>, the
        number of active handles (<code>owners</code>) and its{' '}
        <code>status</code>.
      </p>

      <p>
        <code>inspectCache()</code> reports the{' '}
        <strong>current client only</strong>. Two clients holding the same key
        answer separately, which is what makes &quot;per client&quot; a
        checkable statement rather than an assumption.
      </p>

      <h3>What is not in an event</h3>

      <p>
        Query data, local edits, mutation inputs and the caller-owned{' '}
        <code>status.error</code> object are <strong>omitted</strong>. The
        observed field list is the evidence: if a payload ever leaked, the set
        of keys on the entry would visibly change.
      </p>

      <p>
        Events retain their metadata from the moment of the change and arrive in
        order, in a microtask, after the current synchronous cache transition.
        Listener errors do not change query outcomes. Dispose the listener with
        the function it returned.
      </p>

      <h2>WRITE Operations</h2>

      <CodeBlock
        language="typescript"
        code={`const stopWatching = client.subscribeMutations(event => {
  // event.type: 'started' | 'updated' | 'settled'
  console.log(event.entry.operationId, event.entry.phase, event.entry.linkedKeys);
});

const running = client.inspectMutations();

stopWatching();`}
      />

      <p>
        <code>inspectMutations()</code> lists only operations that have{' '}
        <strong>not settled yet</strong>, in start order.
      </p>

      <ul>
        <li>
          <code>phase</code> here is diagnostic and differs from{' '}
          <code>MutationStatus.phase</code>. <code>queued</code> means the
          operation is waiting on its <code>scope</code> - it has not been sent.
        </li>
        <li>
          <code>updated</code> events report the <code>queued</code> to{' '}
          <code>pending</code> transition and each retry <code>attempt</code>.
        </li>
        <li>
          A <code>settled</code> event carries the final snapshot and{' '}
          <strong>the client then drops the operation</strong> - keep your own
          history if you need one.
        </li>
        <li>
          An operation that throws before it becomes pending (a stale
          submission, for example) produces no event at all.
        </li>
      </ul>

      <p>
        The input, the response, caller-owned error objects and the{' '}
        <code>idempotencyKey</code> value are omitted; <code>idempotent</code>{' '}
        only reports <em>whether</em> a key was supplied.
      </p>

      <h3>A success phase is not permission to resend</h3>

      <p>
        Observing a <code>success</code> phase is a diagnostic signal, never a
        reason to resend an <code>unknown</code> or <code>sync-error</code>{' '}
        operation. Those still need the explicit reconciliation described in{' '}
        <a href="#/guide/sync-mutation">mutation and link</a>.
      </p>

      <h2>Separate the Watching From the Watched</h2>

      <p>
        If a panel repaints itself using the very handle it is testing,
        releasing that handle freezes the panel - and the frozen numbers look
        like a result. Keep one subscription for repainting and a different one
        for the thing under observation.
      </p>

      <CodeBlock
        language="typescript"
        code={`// lives for the whole app; only triggers a repaint
const offRepaint = client.subscribeCache(() => repaint());

// the one a "stop observing" button releases, and the one the panel counts
let offObserved = client.subscribeCache(event => {
  seen += 1;
});`}
      />

      <p>
        With the split, &quot;no events since I unsubscribed&quot; is a claim
        about <em>that listener</em>, because another listener in the same flow
        is still updating the table.
      </p>

      <h2>owners 0 Is Not &quot;Gone From the Cache&quot;</h2>

      <p>
        Releasing the last handle for a key drops its <code>owners</code> to
        zero, but the entry stays in the cache until GC or{' '}
        <code>client.remove()</code>. <code>client.size()</code> does not move.
        They are different facts, and a tool that conflates them will report a
        leak that is not there.
      </p>

      <CodeBlock
        language="typescript"
        code={`client.remove(['account', 1]); // boolean: refused while anything holds it`}
      />

      <p>
        <code>remove()</code> answers a bare boolean. The reasons an entry is
        retained - owners, dirty, unconfirmed, a pending status - are composed
        by your app from <code>inspectCache()</code> plus the query status.
      </p>

      <h2>A Callback That Reads Nothing Registers Nothing</h2>

      <p>
        This applies to any <code>watch</code> you use for measuring. A callback
        that never reads the state it is handed collects no dependency, is never
        woken again, and reports a permanent zero. Before believing a zero,
        check that the instrument can count to one.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.watchStatus(status => {
  void status.dirty.value; // read, or nothing is registered
  notices += 1;
});`}
      />

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/sync-mutation">mutation and link</a> - what the
          phases mean
        </li>
        <li>
          <a href="#/guide/sync-refetch">Automatic refetch</a> - environment
          listeners and polling timers
        </li>
        <li>
          <a href="#/api/plugin">Plugin API</a> - the core-side seam this is
          built on
        </li>
      </ul>
    </div>
  );
});
