import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncMutation = mount(() => {
  return () => (
    <div>
      <h1>mutation and link</h1>

      <p>
        A local edit never reaches a server on its own. Sending one is an
        explicit mutation, and <em>linking</em> that mutation to a query is what
        tells the client which edits the write was about.
      </p>

      <h2>Capture, Then Run</h2>

      <p>
        Mutation input can have a completely different shape from the query
        data, so the client cannot infer which fields you saved. You capture the
        edits you intend to submit immediately before running.
      </p>

      <CodeBlock
        language="typescript"
        code={`const submission = account.capture();

const save = client.mutation({
  mutationFn: (input: { city: string }, { signal, idempotencyKey }) =>
    api.saveCity(input, { signal, idempotencyKey }),
});

const result = await save.run(
  { city: submission.value.address.city },
  {
    links: [
      {
        query: account,
        submission,
        accept: { kind: 'refetch' },
        onReject: 'keep',
      },
    ],
  }
);`}
      />

      <p>
        <code>capture()</code> freezes three things at this moment: the whole
        current value, the change rows (all of them, or only the IDs you pass),
        and the resource version. Any later edit - to any field - or a completed
        READ moves the version, and the link then refuses the submission before
        the WRITE is sent - capture late, not early.
      </p>

      <p>
        Why it exists, what happens to each edit after the write, and how a
        conflict is settled are all in{' '}
        <a href="#/guide/sync-lifecycle">Edit Lifecycle</a>.
      </p>

      <p>
        <code>run</code> clones the input with <code>structuredClone</code>{' '}
        before calling <code>mutationFn</code>, so the input must be cloneable.
      </p>

      <h2>Accepting the Result</h2>

      <p>
        Each link chooses, with an <code>accept</code> object, how the new
        baseline is decided after a successful WRITE:
      </p>

      <ul>
        <li>
          <code>{"{ kind: 'refetch' }"}</code> - read the server again after the
          write
        </li>
        <li>
          <code>{"{ kind: 'response', select }"}</code> - map the mutation
          response into the baseline
        </li>
        <li>
          <code>{"{ kind: 'submitted' }"}</code> - take the submitted values as
          the new baseline. Only when the server contract guarantees they were
          accepted as sent. Requires a <code>submission</code>
        </li>
        <li>
          <code>{"{ kind: 'none' }"}</code> - the default when{' '}
          <code>accept</code> is omitted. The baseline does not move, the edits
          stay dirty, and <code>status.unconfirmed</code> turns true until a
          successful READ
        </li>
      </ul>

      <p>
        Only the persisted API (<code>linked.stage</code> in{' '}
        <a href="#/guide/sync-persistence">Persistence and SSR</a>) takes these
        as plain strings (<code>'submitted'</code>), because it has to serialize
        them. <code>run</code> and <code>start</code> take the objects above.
      </p>

      <h2>What a Linked Result Can Be</h2>

      <CodeBlock
        language="typescript"
        code={`// result.kind
'success'     // the WRITE succeeded and acceptance completed
'sync-error'  // the WRITE succeeded, but acceptance or the follow-up READ failed
'rejected'    // the server explicitly refused (MutationRejectedError)
'unknown'     // the transport outcome is uncertain`}
      />

      <p>The last two are the ones worth designing for:</p>

      <ul>
        <li>
          <strong>
            <code>unknown</code> keeps your edits and is never automatically
            retried.
          </strong>{' '}
          The client does not know whether the server applied the write. An
          explicit retry needs a server-supported <code>idempotencyKey</code>.
        </li>
        <li>
          <strong>
            <code>sync-error</code> must be reconciled with a new READ or a
            known server value
          </strong>{' '}
          - not by resending the write that already succeeded.
        </li>
      </ul>

      <p>
        A confirmed rejection can keep the edits (<code>onReject: 'keep'</code>)
        or remove only the unchanged submitted ones (
        <code>onReject: 'remove'</code>). Input you typed while the WRITE was in
        flight survives either way, including a return to the old baseline.
        Callback failures are reported as <code>callbackError</code> without
        changing the write result.
      </p>

      <h2>How a Result Is Classified</h2>

      <p>
        The client cannot tell a refusal from a lost connection by itself.{' '}
        <code>rejected</code> is reported <strong>only</strong> when{' '}
        <code>mutationFn</code> throws <code>MutationRejectedError</code>. Any
        other throw, and an abort, is <code>unknown</code>.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { MutationRejectedError } from '@stateref/sync';

const save = client.mutation({
  mutationFn: async (input: { name: string }, { signal }) => {
    const response = await fetch('/account', {
      method: 'PUT',
      body: JSON.stringify(input),
      signal,
    });
    if (response.status === 422) {
      // the server read the request and refused it
      throw new MutationRejectedError('name taken', await response.json());
    }
    if (!response.ok) throw new Error('HTTP ' + response.status); // -> 'unknown'
    return response.json();
  },
});

const result = await save.run({ name: 'Lee' });
if (result.kind === 'rejected') {
  (result.error as MutationRejectedError).reason; // the second argument above
}`}
      />

      <h2>Retry</h2>

      <p>
        A mutation is attempted once by default. <code>retry</code> is opt-in
        per run and requires an <code>idempotencyKey</code> - without one,{' '}
        <code>run</code> refuses with{' '}
        <code>Mutation retry requires an idempotencyKey.</code> A{' '}
        <code>MutationRejectedError</code> is never retried; the server already
        answered.
      </p>

      <CodeBlock
        language="typescript"
        code={`await save.run(input, {
  retry: 2,                        // up to 3 attempts
  idempotencyKey: 'account-1-save-42',
  retryDelay: attempt => 500 * attempt,
});`}
      />

      <p>
        Inside <code>mutationFn</code>, the second argument carries{' '}
        <code>signal</code>, <code>operationId</code>, <code>attempt</code> and{' '}
        <code>idempotencyKey</code>. Once an operation has settled as{' '}
        <code>unknown</code>, nothing resends it.
      </p>

      <h2>Callbacks</h2>

      <p>
        <code>onSuccess</code>, <code>onError</code> and <code>onSettled</code>{' '}
        go in the mutation options. A callback that throws does not change the
        result: <code>kind</code> stays what it was and the error is reported as{' '}
        <code>callbackError</code>.
      </p>

      <h2>dirty and pending Are Different Axes</h2>

      <p>
        The linked query's <code>status.pending</code> tracks the operation;{' '}
        <code>status.dirty</code> tracks unsaved input. A field can be clean
        while a write is in flight, and dirty while nothing is being sent.
      </p>

      <h2>Showing That a Save Is in Progress</h2>

      <p>
        Progress lives in two places, and they watch different things. Both are
        readonly refs, and <code>watchStatus</code> plugs into a connector as
        is.
      </p>

      <table>
        <thead>
          <tr>
            <th />
            <th>
              The query&apos;s <code>account.status</code>
            </th>
            <th>
              The mutation&apos;s <code>save.status</code>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>What it watches</td>
            <td>The data: is a linked write in flight for this query</td>
            <td>The command: the operations sent through this handle</td>
          </tr>
          <tr>
            <td>In progress</td>
            <td>
              <code>pending</code> is 0 or 1 (one linked write at a time)
            </td>
            <td>
              <code>pending</code> = unsettled operations on this handle,
              including ones waiting for their scope
            </td>
          </tr>
          <tr>
            <td>Unlinked commands</td>
            <td>Do not show up</td>
            <td>Show up - the only place they do</td>
          </tr>
          <tr>
            <td>The result</td>
            <td>
              No kind. After <code>unknown</code> or <code>sync-error</code>,{' '}
              <code>unconfirmed</code> turns true; <code>rejected</code> leaves
              no trace
            </td>
            <td>
              <code>phase</code> is <code>'success'</code>,{' '}
              <code>'rejected'</code>, <code>'unknown'</code> or{' '}
              <code>'sync-error'</code>; <code>error</code> holds what was
              thrown
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        An operation linked to several queries sets each query&apos;s{' '}
        <code>pending</code> to 1. Input keeps working during the write, so{' '}
        <code>pending</code> and <code>dirty</code> being true together is
        normal.
      </p>

      <h3>Saving Is pending, Not phase</h3>

      <p>
        A handle&apos;s <code>phase</code> follows{' '}
        <strong>the most recent event</strong>. With two operations in flight,
        when one finishes <code>phase</code> becomes <code>'success'</code>{' '}
        while the other is still running.
      </p>

      <CodeBlock
        language="typescript"
        code={`const a = send.start(inputA);
const b = send.start(inputB);
send.status.value; // { phase: 'pending', pending: 2, operationId: 3, ... }

// a finished first
send.status.value; // { phase: 'success', pending: 1, operationId: 2, ... } — b is still running`}
      />

      <p>
        So decide &quot;saving&quot; with <code>pending.value &gt; 0</code>, and
        use <code>phase</code> and <code>error</code> to show a finished result.
        To show each operation separately, use the <code>operation.status</code>{' '}
        that <code>start()</code> returns - its <code>pending</code> is 0 or 1,
        and an operation still waiting for its scope is already{' '}
        <code>'pending'</code>.
      </p>

      <h3>On the Screen</h3>

      <CodeBlock
        language="typescript"
        code={`const useAccountStatus = connectReact(account.watchStatus);
const useSaveStatus = connectReact(save.watchStatus);

function SaveBar() {
  const status = useAccountStatus(); // the data side
  const saving = useSaveStatus();    // the command side — only for the result
  return (
    <>
      {status.pending.value > 0 && <span>Saving…</span>}
      {status.dirty.value && <span>Unsaved changes</span>}
      {status.unconfirmed.value && <span>Save not confirmed</span>}
      {saving.phase.value === 'rejected' && <span>Save refused</span>}
      <button disabled={status.pending.value > 0} onClick={onSave}>
        Save
      </button>
    </>
  );
}`}
      />

      <p>
        For a form saved through one link, the query&apos;s <code>status</code>{' '}
        alone covers the saving indicator and the disabled button. Add the
        mutation&apos;s <code>status</code> when you need the result kind or{' '}
        <code>error</code> - a refusal message, say - or to show progress for an
        unlinked command.
      </p>

      <ul>
        <li>
          Seen through <code>watchStatus</code>, <code>phase</code> goes{' '}
          <code>'idle'</code> → <code>'pending'</code> → the result within one
          run.
        </li>
        <li>
          A run that throws before the WRITE, such as a stale submission, leaves
          the status untouched (still <code>'idle'</code>).
        </li>
        <li>Neither status can be written to; a write throws.</li>
      </ul>

      <h2>Unlinked Mutations</h2>

      <p>
        A mutation with no links runs independently and never clears resource
        edits. That is the right shape for a command that is not &quot;save this
        form&quot;.
      </p>

      <CodeBlock
        language="typescript"
        code={`const sendNote = client.mutation({
  mutationFn: (input: { note: string }) => api.sendNote(input),
});

await sendNote.run({ note: 'Hello' }); // no link, no resource involved`}
      />

      <h2>Ordering</h2>

      <p>
        Independent mutations run concurrently by default. Pass the same{' '}
        <code>scope</code> string to run them in start order, callbacks
        included; a failure does not block the next one.
      </p>

      <CodeBlock
        language="typescript"
        code={`await Promise.all([
  sendNote.run({ note: 'first' }, { scope: 'notes' }),
  sendNote.run({ note: 'second' }, { scope: 'notes' }), // waits for the first
]);`}
      />

      <p>
        A query permits <strong>one linked operation at a time</strong>. A
        second linked write on the same query is refused rather than queued -
        sequence them by awaiting the first result and capturing the current
        edits again.
      </p>

      <p>
        A multi-query link does not promise atomicity across servers or queries.
        If only some links fail to reconcile, the job is <code>sync-error</code>{' '}
        and the links that already applied are not rolled back.
      </p>

      <h2>start, for More Control</h2>

      <p>
        <code>start</code> returns the operation instead of a promise - useful
        when the UI needs to show or cancel an individual operation.
      </p>

      <CodeBlock
        language="typescript"
        code={`const operation = save.start(input, { links });
operation.id;                  // operation ID
operation.status.phase.value;  // 'pending', then the result kind
operation.watchStatus;         // Watch shape for a connector
operation.abort();             // settles as 'unknown'
const result = await operation.result;
operation.dispose();

save.status.phase.value;       // the handle's latest operation
// { phase: 'idle' | 'pending' | result kind, pending, operationId, error }`}
      />

      <h2>Honest Mapping Is the Caller's Job</h2>

      <p>
        The library cannot infer which fields a free-form DTO saved. If you tell
        a link that a change was submitted when it was not, the baseline will be
        wrong and nothing will catch it. Map the actual DTO to the captured
        changes honestly.
      </p>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/sync-lifecycle">Edit Lifecycle</a> - what{' '}
          <code>capture()</code> freezes and what each result does to your edits
        </li>
        <li>
          <a href="#/guide/sync-query">query and resource</a> -{' '}
          <code>acceptServer()</code>
        </li>
        <li>
          <a href="#/guide/sync-persistence">Persistence and SSR</a> - queued
          commands and persisted submissions
        </li>
        <li>
          <a href="#/guide/sync-observation">Observation</a> - watching WRITEs
          in flight
        </li>
      </ul>
    </div>
  );
});
