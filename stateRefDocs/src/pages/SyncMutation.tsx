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
        The capture holds an immutable value and change snapshot. It becomes{' '}
        <strong>stale</strong> if the resource is edited again before{' '}
        <code>run</code> starts - capture late, not early.
      </p>

      <p>
        <code>run</code> clones the input with <code>structuredClone</code>{' '}
        before calling <code>mutationFn</code>, so the input must be cloneable.
      </p>

      <h2>Accepting the Result</h2>

      <p>Each link chooses how the new baseline is decided:</p>

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
          <code>'submitted'</code> - only when the server contract guarantees
          the submitted values were accepted as sent
        </li>
        <li>
          <code>'none'</code> - accept nothing; the baseline stays where it was
        </li>
      </ul>

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

      <h2>dirty and pending Are Different Axes</h2>

      <p>
        The linked query's <code>status.pending</code> tracks the operation;{' '}
        <code>status.dirty</code> tracks unsaved input. A field can be clean
        while a write is in flight, and dirty while nothing is being sent.
      </p>

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
        <code>start</code> returns a request ID, a readonly status ref, the
        result promise, and abort/dispose methods - useful when the UI needs to
        show or cancel an individual operation.
      </p>

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
          <a href="#/guide/sync-query">query and resource</a> -{' '}
          <code>capture()</code> and <code>acceptServer()</code>
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
