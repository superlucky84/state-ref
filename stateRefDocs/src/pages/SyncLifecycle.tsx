import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncLifecycle = mount(() => {
  return () => (
    <div>
      <h1>Edit Lifecycle: From capture to Acceptance</h1>

      <p>
        This page follows one edit: typed into a ref, made dirty, frozen by{' '}
        <code>capture()</code>, sent by a mutation, and then cleared or kept
        depending on the result. The rules were spread across several pages;
        here they are in one line.
      </p>

      <h2>Four Words</h2>

      <table>
        <thead>
          <tr>
            <th>Word</th>
            <th>Meaning</th>
            <th>Where you see it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>baseline</td>
            <td>
              The value the server last confirmed. A READ or an acceptance moves
              it
            </td>
            <td>
              <code>change.before</code>
            </td>
          </tr>
          <tr>
            <td>local edit</td>
            <td>
              A value on top of the baseline that the server does not know yet.
              Writing to the ref creates one
            </td>
            <td>
              <code>changes()</code>, <code>status.dirty</code>
            </td>
          </tr>
          <tr>
            <td>submission</td>
            <td>
              The caller&apos;s statement &quot;this WRITE is about these
              edits&quot;. <code>capture()</code> makes it
            </td>
            <td>
              <code>link.submission</code>
            </td>
          </tr>
          <tr>
            <td>acceptance</td>
            <td>Moving the baseline to a new value after a successful WRITE</td>
            <td>
              <code>link.accept</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>At a Glance</h2>

      <CodeBlock
        language="bash"
        code={`write to the ref ───────► a row appears in changes() (dirty)
      │
      │ capture()           freezes value · rows · version
      ▼
run(input, { links: [{ query, submission, accept }] })
      │
      │ same version? ── no ─► 'Submission is stale' (no WRITE)
      ▼
    WRITE
      ├─ success ───────► move the baseline per accept ─► submitted rows clear
      ├─ rejected ──────► onReject: 'keep' keeps them, 'remove' reverts them
      ├─ unknown ───────► edits stay, unconfirmed. Nothing is resent
      └─ sync-error ────► WRITE succeeded, acceptance failed. Edits stay, unconfirmed`}
      />

      <h2>1. Editing</h2>

      <p>
        Writing to the ref creates one change row per edited path, and every
        write moves the resource version by one. Assigning the same value again
        is not a write and does not move the version.
      </p>

      <CodeBlock
        language="typescript"
        code={`// server: { address: { city: 'Seoul', zip: '100' }, name: 'Kim' }
await account.load();
account.version(); // 0

account.ref.address.city.value = 'Busan';
account.ref.name.value = 'Lee';
account.version(); // 2

account.changes();
// [
//   { id: 1, path: ['address', 'city'], before: { exists: true, value: 'Seoul' },
//     after: { exists: true, value: 'Busan' }, conflict: false, ... },
//   { id: 2, path: ['name'], before: { exists: true, value: 'Kim' },
//     after: { exists: true, value: 'Lee' }, conflict: false, ... },
// ]`}
      />

      <h2>2. Why capture Exists</h2>

      <p>
        The input you send (the DTO) can have a different shape from the query
        data. If the save API takes only <code>{"{ city: 'Busan' }"}</code>, the
        client has no way to know which of the two edits that DTO saved. Names
        do not line up reliably, and APIs that merge or split fields are common.
      </p>

      <p>
        So the caller says it. Passing the submission that{' '}
        <code>capture()</code> made to a link is the statement &quot;this WRITE
        is about these rows&quot;. With it, the client can clear exactly those
        rows on success and revert exactly those rows on rejection.
      </p>

      <h2>3. What capture Freezes</h2>

      <CodeBlock
        language="typescript"
        code={`const submission = account.capture();
submission.version; // 2 — the resource version right now
submission.value;   // { address: { city: 'Busan', zip: '100' }, name: 'Lee' } (frozen copy)
submission.changes; // the two current rows (frozen copies)`}
      />

      <ul>
        <li>
          <code>value</code> is the <strong>whole current value</strong>, edits
          included. Build the DTO from it and the payload cannot drift if
          something writes to the ref after the capture.
        </li>
        <li>
          <code>changes</code> are the rows being submitted: all of them with no
          argument, or only the IDs you pass (see &quot;Partial Save&quot;).
        </li>
        <li>
          <code>version</code> is what the staleness check compares (next
          section).
        </li>
        <li>
          Capture succeeds with no edits; the submission just has empty{' '}
          <code>changes</code>.
        </li>
      </ul>

      <p>capture itself refuses in three cases:</p>

      <CodeBlock
        language="typescript"
        code={`account.capture([999]);   // TypeError: Unknown or repeated resource change ID.
account.capture([1, 1]);  // TypeError: Unknown or repeated resource change ID.
settings.capture();       // an editable: false query — TypeError: This query is readonly.`}
      />

      <h2>4. Stale Submissions</h2>

      <p>
        If the version moves between the capture and <code>run</code>, the
        submission is stale. The link refuses it <strong>before</strong> the
        WRITE is sent, and <code>mutationFn</code> is never called.
      </p>

      <CodeBlock
        language="typescript"
        code={`const submission = account.capture();
account.ref.address.zip.value = '200'; // even a field outside the submission

save.start(input, { links: [{ query: account, submission, accept: { kind: 'submitted' } }] });
// throws synchronously: Error: Submission is stale. Capture the current edits again.

await save.run(input, { links: [{ query: account, submission, accept: { kind: 'submitted' } }] });
// rejects with the same message`}
      />

      <ul>
        <li>
          An edit to <strong>any</strong> field makes it stale. The check uses
          the version, not the path.
        </li>
        <li>
          A completed READ makes it stale too: <code>refetch()</code> moves the
          baseline and the version.
        </li>
        <li>Assigning the same value again does not.</li>
      </ul>

      <p>
        So capture{' '}
        <strong>right before sending, in the same synchronous flow</strong> -
        capture in the save button&apos;s handler and call <code>run</code>{' '}
        immediately. If an await sits in between, such as a confirmation dialog,
        capture again after it.
      </p>

      <h2>5. While the WRITE Is in Flight</h2>

      <p>
        Once <code>run</code> starts, the query&apos;s{' '}
        <code>status.pending</code> is 1, and until the result arrives:
      </p>

      <ul>
        <li>
          <strong>Input keeps working.</strong> An edit made during the WRITE is
          separate from the submission and survives whatever the result is.
        </li>
        <li>
          A second linked write is refused, not queued:{' '}
          <code>A linked operation is already pending for this query.</code>
        </li>
        <li>
          <code>acceptServer()</code> is refused:{' '}
          <code>A linked operation is pending for this query.</code>
        </li>
        <li>
          Automatic READs (focus, reconnect, polling) hold off. The unanswered
          operation is still deciding the baseline.
        </li>
      </ul>

      <CodeBlock
        language="typescript"
        code={`account.ref.address.city.value = 'Busan';
const submission = account.capture();
const pending = save.run({ city: 'Busan' }, {
  links: [{ query: account, submission, accept: { kind: 'submitted' } }],
});

account.ref.address.zip.value = '999'; // input during the WRITE

await pending; // { kind: 'success', ... }
account.ref.value;  // { address: { city: 'Busan', zip: '999' }, ... }
account.changes();  // only the zip row remains (before: '100')`}
      />

      <h2>6. What Each Result Does to Your Edits</h2>

      <table>
        <thead>
          <tr>
            <th>Result</th>
            <th>Baseline</th>
            <th>Submitted edits</th>
            <th>
              <code>unconfirmed</code>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>success</code> + <code>{"{ kind: 'submitted' }"}</code>
            </td>
            <td>moves to the submitted values</td>
            <td>cleared</td>
            <td>false</td>
          </tr>
          <tr>
            <td>
              <code>success</code> + <code>{"{ kind: 'response' }"}</code>
            </td>
            <td>
              moves to <code>select(response)</code>
            </td>
            <td>
              cleared. If the server corrected the value (<code>lee</code> →{' '}
              <code>LEE</code>), the corrected value shows
            </td>
            <td>false</td>
          </tr>
          <tr>
            <td>
              <code>success</code> + <code>{"{ kind: 'refetch' }"}</code>
            </td>
            <td>moves to the re-read value</td>
            <td>cleared</td>
            <td>false</td>
          </tr>
          <tr>
            <td>
              <code>success</code> + <code>{"{ kind: 'none' }"}</code> (the
              default)
            </td>
            <td>unchanged</td>
            <td>
              <strong>kept</strong> (still dirty)
            </td>
            <td>true, until the next successful READ</td>
          </tr>
          <tr>
            <td>
              <code>rejected</code> + <code>onReject: 'keep'</code> (the
              default)
            </td>
            <td>unchanged</td>
            <td>kept</td>
            <td>false</td>
          </tr>
          <tr>
            <td>
              <code>rejected</code> + <code>onReject: 'remove'</code>
            </td>
            <td>unchanged</td>
            <td>
              rows not edited again during the WRITE revert to the baseline
            </td>
            <td>false</td>
          </tr>
          <tr>
            <td>
              <code>unknown</code>
            </td>
            <td>unchanged</td>
            <td>kept. Nothing is resent</td>
            <td>true</td>
          </tr>
          <tr>
            <td>
              <code>sync-error</code>
            </td>
            <td>
              unchanged. With several links, the ones already accepted are not
              rolled back
            </td>
            <td>kept</td>
            <td>true</td>
          </tr>
        </tbody>
      </table>

      <p>
        In every row, <strong>edits made during the WRITE survive.</strong>{' '}
        Success clears only the rows that were in the submission; later input
        continues as edits on top of the new baseline.
      </p>

      <p>
        A link can exist without a submission, but combinations that only make
        sense with one are refused:
      </p>

      <CodeBlock
        language="typescript"
        code={`{ query, accept: { kind: 'submitted' } } // TypeError: Submitted acceptance requires a submission.
{ query, onReject: 'remove' }             // TypeError: Removing rejected edits requires a submission.
{ query: account, submission: other.capture() } // TypeError: Submission belongs to another resource.`}
      />

      <p>
        How <code>rejected</code> and <code>unknown</code> are told apart (
        <code>MutationRejectedError</code>) and the retry rules are in{' '}
        <a href="#/guide/sync-mutation">mutation and link</a>.
      </p>

      <h2>7. Partial Save</h2>

      <p>
        When a screen saves only some of the edits, pick change-row{' '}
        <code>id</code>s and capture those. Rows you did not submit stay dirty.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.ref.address.city.value = 'Busan';
account.ref.address.zip.value = '200';

const cityId = account
  .changes()
  .find(change => change.path.join('.') === 'address.city')!.id;
const submission = account.capture([cityId]);

submission.changes.map(change => change.path); // [['address', 'city']]
submission.value.address.zip;                  // '200' — value is still the whole thing

await saveCity.run(
  { city: submission.value.address.city },
  { links: [{ query: account, submission, accept: { kind: 'submitted' } }] }
);
account.changes(); // only the zip row remains`}
      />

      <p>
        <code>value</code> is the whole value regardless of which rows you
        picked. Keeping the DTO fields and the picked rows in agreement is the
        caller&apos;s job - claim a change was submitted when it was not and the
        baseline goes wrong, with nothing to catch it.
      </p>

      <h2>8. Settling a Conflict on a Query</h2>

      <p>
        When a READ brings a different value for a path that still has an edit,
        that row becomes a conflict. The screen keeps showing the local value.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.ref.address.city.value = 'Busan';
await account.refetch(); // the server now says 'Gwangju'

const [change] = account.changes();
change.before;   // { exists: true, value: 'Gwangju' } — the new baseline
change.after;    // { exists: true, value: 'Busan' }   — the local value
change.conflict; // true
account.status.value.conflicts; // 1
account.ref.address.city.value;  // 'Busan'`}
      />

      <p>
        Unlike a <a href="#/guide/draft-conflicts">draft</a>, a query handle has{' '}
        <strong>no</strong> <code>resolve()</code>. With what exists today there
        are three ways to settle it.
      </p>

      <h3>Take the server value</h3>

      <p>
        Write the new baseline value (<code>change.before.value</code>) to that
        path. The local edit now equals the baseline and the row disappears.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.ref.address.city.value = change.before.value as string; // 'Gwangju'
account.isDirty();              // false
account.status.value.conflicts; // 0`}
      />

      <h3>Keep your value</h3>

      <p>
        Writing your value again does not settle it - neither the same value nor
        a third one clears the conflict, because the server still does not know
        it. Keeping your value means <strong>saving it</strong>.
      </p>

      <CodeBlock
        language="typescript"
        code={`const submission = account.capture();
await save.run(
  { city: submission.value.address.city },
  { links: [{ query: account, submission, accept: { kind: 'submitted' } }] }
);
account.isDirty();              // false
account.status.value.conflicts; // 0
account.ref.address.city.value; // 'Busan'`}
      />

      <p>
        Accepting with <code>{"{ kind: 'refetch' }"}</code> settles it too; the
        value the server answers with then becomes the baseline.
      </p>

      <h3>Let a person choose</h3>

      <p>
        To show both values side by side and let someone pick, render the{' '}
        <code>before</code> and <code>after</code> above and run one of the two
        paths depending on the choice. If a separate form is doing the editing,
        keeping that form in a draft is easier - you get the draft&apos;s{' '}
        <code>resolve()</code> as is. See{' '}
        <a href="#/guide/sync-form">Form Save Recipe</a>.
      </p>

      <p>
        If you already know a server value equal to the local one,{' '}
        <code>acceptServer(value)</code> clears the row too. It sends nothing
        and only moves the baseline.
      </p>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/sync-mutation">mutation and link</a> - result
          classification, retry, <code>start()</code>
        </li>
        <li>
          <a href="#/guide/sync-query">query and resource</a> - the change list
          and rebasing
        </li>
        <li>
          <a href="#/guide/sync-form">Form Save Recipe</a> - the save flow with
          a draft
        </li>
        <li>
          <a href="#/guide/sync-persistence">Persistence and SSR</a> - carrying
          a submission across a restart
        </li>
      </ul>
    </div>
  );
});
