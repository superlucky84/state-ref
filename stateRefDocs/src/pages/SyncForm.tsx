import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncForm = mount(() => {
  return () => (
    <div>
      <h1>Form Save Recipe</h1>

      <p>
        This page walks through editing server data in a form and saving it,
        start to finish. It assembles the parts from earlier pages - a query, a{' '}
        <a href="#/guide/draft">draft</a>, and{' '}
        <a href="#/guide/sync-lifecycle">capture and acceptance</a> - into one
        screen.
      </p>

      <h2>First Choice: Use a Draft or Not</h2>

      <table>
        <thead>
          <tr>
            <th />
            <th>Edit the query ref directly</th>
            <th>A draft on the query</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Where input shows</td>
            <td>Immediately, on every screen watching the key</td>
            <td>
              Only inside this form until <code>apply()</code>
            </td>
          </tr>
          <tr>
            <td>Cancel</td>
            <td>Write the server value back field by field</td>
            <td>
              One <code>reset()</code>
            </td>
          </tr>
          <tr>
            <td>Settling conflicts</td>
            <td>
              No <code>resolve()</code> - use section 8 of{' '}
              <a href="#/guide/sync-lifecycle">Edit Lifecycle</a>
            </td>
            <td>
              The draft&apos;s <code>resolve()</code>
            </td>
          </tr>
          <tr>
            <td>Partial save</td>
            <td>
              Per field, with <code>capture(ids)</code>
            </td>
            <td>
              One draft becomes <strong>one row</strong> on the query (below)
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        If the form is the only place that edits the data and it is fine for
        input to show elsewhere right away, editing the ref directly is simpler
        - the examples in <a href="#/guide/sync-lifecycle">Edit Lifecycle</a> do
        that. This page covers the other kind: a form that changes nothing until
        Save is pressed, which means a draft.
      </p>

      <h2>1. Open</h2>

      <CodeBlock
        language="typescript"
        code={`import { createSyncClient } from '@stateref/sync';
import { createDraft } from 'state-ref/draft';

const client = createSyncClient();
const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
});
await account.load();

// open it on the narrowest subtree the form edits
const form = createDraft(account.ref.address);`}
      />

      <h3>Open the Draft Narrow</h3>

      <p>
        <code>apply()</code> writes the draft root in one assignment, so the
        query records it as <strong>one row</strong> at the path the draft was
        opened on. Opened on <code>account.ref.address</code> as above, the row
        path is <code>['address']</code>; opened on the query root (
        <code>account.ref</code>), it is <code>[]</code>.
      </p>

      <p>
        Apply a root draft and, before you save, a server change to{' '}
        <strong>a field the form never touched</strong> becomes a conflict - the
        root row covers every field.
      </p>

      <CodeBlock
        language="typescript"
        code={`const form = createDraft(account.ref); // the root
form.ref.address.city.value = 'Busan';
form.apply();

// the server changed only name, 'Kim' -> 'Choi'
await account.refetch();
account.changes(); // [{ path: [], conflict: true, ... }]
account.ref.name.value; // 'Kim' — the new name does not show`}
      />

      <p>
        Opened on <code>address</code>, the same situation leaves a{' '}
        <code>['address']</code> row with no conflict, and <code>name</code>{' '}
        updates to <code>'Choi'</code>. If the form edits several subtrees, one
        draft per subtree is an option.
      </p>

      <h2>2. Bind the Inputs</h2>

      <CodeBlock
        language="typescript"
        code={`import { connectReact } from '@stateref/connect-react';

const useForm = connectReact(form.watch);
const useFormStatus = connectReact(form.watchStatus);

function AddressForm() {
  const address = useForm();
  const status = useFormStatus();
  return (
    <>
      <input
        value={address.city.value}
        onChange={event => (address.city.value = event.target.value)}
      />
      <button disabled={!status.dirty.value} onClick={save}>Save</button>
      <button onClick={() => form.reset()}>Cancel</button>
    </>
  );
}`}
      />

      <p>
        Input goes only to the draft, so other screens showing the same account
        do not change before the save. Cancel is one <code>reset()</code>, and
        the form stays open.
      </p>

      <h2>3. Save</h2>

      <CodeBlock
        language="typescript"
        code={`const saveAddress = client.mutation({
  mutationFn: (input: { address: Address }, { signal }) =>
    api.saveAddress(input, { signal }),
});

async function save() {
  // (1) draft -> query. Stops here on a conflict
  const applied = form.apply();
  if (!applied.ok) return applied; // { ok: false, reason: 'conflict' } and so on

  // (2) freeze the query's edits and send right away — no await in between
  const submission = account.capture();
  return saveAddress.run(
    { address: submission.value.address },
    { links: [{ query: account, submission, accept: { kind: 'refetch' } }] }
  );
}`}
      />

      <ul>
        <li>
          With no await between <code>apply()</code> and <code>capture()</code>,
          the submission has no chance to go stale (
          <a href="#/guide/sync-lifecycle">Stale Submissions</a>).
        </li>
        <li>
          Build the DTO from <code>submission.value</code>. The query recorded
          one <code>['address']</code> row, so sending the whole{' '}
          <code>address</code> is the honest match for that row.
        </li>
        <li>
          <code>{"{ kind: 'refetch' }"}</code> re-reads the server after the
          write and takes that as the new baseline - the safe choice when the
          API normalizes values.
        </li>
      </ul>

      <p>
        On success both the query and the draft are clean, and the form shows
        the saved value.
      </p>

      <CodeBlock
        language="typescript"
        code={`const result = await save(); // { kind: 'success', ... }
account.isDirty();      // false
form.isDirty();         // false
form.ref.city.value;    // 'Busan'`}
      />

      <h2>4. When the Server Moved Before the Save</h2>

      <p>
        If a READ changes the same field while the form is open, the draft row
        becomes a conflict and <code>apply()</code> stops. Show the three values
        and let the person choose.
      </p>

      <CodeBlock
        language="typescript"
        code={`form.ref.city.value = 'Busan';
await account.refetch(); // the server now says 'Gwangju'

form.changes();
// [{ path: ['city'], before: 'Seoul', after: 'Busan', source: 'Gwangju', conflict: true, ... }]
form.apply(); // { ok: false, reason: 'conflict' }

// the person chose "keep mine"
form.resolve(form.changes()[0], 'draft'); // { ok: true }
form.apply();                             // { ok: true, applied: 1 }
// then capture + run`}
      />

      <p>
        For &quot;take the server value&quot;, resolve with{' '}
        <code>'source'</code>: the edit goes away and the form shows{' '}
        <code>'Gwangju'</code>. Resolving invalidates the rows you were holding,
        so read <code>changes()</code> again each time (
        <a href="#/guide/draft-conflicts">Conflicts</a>).
      </p>

      <h2>5. Handling the Result</h2>

      <CodeBlock
        language="typescript"
        code={`const result = await save();
if ('ok' in result) {
  // apply stopped — section 4
} else {
  switch (result.kind) {
    case 'success':
      break;
    case 'rejected':
      // the server refused (MutationRejectedError); the edits stay on the query
      showError(result.error);
      break;
    case 'unknown':
    case 'sync-error':
      // unknown: it may or may not have applied / sync-error: it applied, acceptance failed
      // either way, do not resend — read again to reconcile
      await account.refetch();
      break;
  }
}`}
      />

      <ul>
        <li>
          <code>rejected</code>: omitting <code>onReject</code> means{' '}
          <code>'keep'</code>, so the input is not lost; the person can fix it
          and save again.
        </li>
        <li>
          <code>unknown</code> and <code>sync-error</code>: the edits stay and{' '}
          <code>status.unconfirmed</code> is true until a successful READ.
          Nothing is resent automatically.
        </li>
      </ul>

      <h2>6. Close</h2>

      <p>
        A draft subscribes to its source, so release it with{' '}
        <code>discard()</code> when the form closes. Whoever opened the query
        handle calls <code>dispose()</code>.
      </p>

      <CodeBlock
        language="typescript"
        code={`useEffect(() => () => {
  form.discard();
  account.dispose();
}, []);`}
      />

      <h2>Not on a Readonly Query</h2>

      <p>
        You can open and edit a draft on a query opened with{' '}
        <code>editable: false</code>, but <code>apply()</code> answers{' '}
        <code>{"{ ok: false, reason: 'readonly' }"}</code>. For a form that
        saves, open the query as editable.
      </p>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/sync-lifecycle">Edit Lifecycle</a> - capture,
          staleness, what each result does
        </li>
        <li>
          <a href="#/guide/draft-apply">apply, reset, discard</a>
        </li>
        <li>
          <a href="#/guide/draft-conflicts">Conflicts</a>
        </li>
        <li>
          <a href="#/guide/react">React</a> - the other connectors have the same
          shape
        </li>
      </ul>
    </div>
  );
});
