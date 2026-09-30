import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const DraftConflicts = mount(() => {
  return () => (
    <div>
      <h1>Conflicts</h1>

      <p>
        A draft holds edits while the source keeps living. When the source moves
        under a path the draft has edited, that change becomes a{' '}
        <strong>conflict</strong>: two answers now exist for one field and the
        draft will not pick between them for you.
      </p>

      <h2>A Conflict Appears Before You Apply</h2>

      <p>
        You do not have to call <code>apply()</code> to find out. The change row
        flips the moment the source moves.
      </p>

      <CodeBlock
        language="typescript"
        code={`const editor = createDraft(source.address);
editor.ref.city.value = 'Busan';

// somebody else moves the source
source.address.city.value = 'Gwangju';

const [change] = editor.changes();
change.before;   // { exists: true, value: 'Seoul' }   - the branch point
change.after;    // { exists: true, value: 'Busan' }   - what the draft holds
change.source;   // { exists: true, value: 'Gwangju' } - what the source holds now
change.conflict; // true

editor.status.conflicts.value; // 1
editor.apply();                // { ok: false, reason: 'conflict' }`}
      />

      <p>
        The three values are the whole story: where the draft started, where it
        went, and where the source went. A screen can render exactly that and
        let a person choose.
      </p>

      <h2>Resolving</h2>

      <p>
        <code>resolve(change, choice)</code> settles one change. The choice is
        which side wins.
      </p>

      <CodeBlock
        language="typescript"
        code={`// take the source's value and drop this edit
editor.resolve(editor.changes()[0], 'source');
// { ok: true }
editor.ref.city.value; // 'Gwangju'
editor.isDirty();      // false - the edit is gone
editor.changes();      // []

// or keep the draft's value and re-base the edit onto the new source
editor.resolve(editor.changes()[0], 'draft');
// { ok: true }  - the change stays, no longer in conflict`}
      />

      <p>
        <code>'source'</code> removes the edit. <code>'draft'</code> keeps it
        and moves its <code>before</code> to the source's current value, so the
        row stops being a conflict and a later <code>apply()</code> can go
        through.
      </p>

      <h2>Resolve Refuses a Stale Row</h2>

      <p>
        A <code>DraftChange</code> is a snapshot taken at a particular draft
        version. If the draft moved since you read it, resolving with that old
        row is refused - it would settle a question that has already changed.
      </p>

      <CodeBlock
        language="typescript"
        code={`const row = editor.changes()[0];

editor.ref.zip.value = 999;   // the draft version moves

editor.resolve(row, 'draft'); // { ok: false, reason: 'stale' }

// read it again and it works
editor.resolve(editor.changes()[0], 'draft'); // { ok: true }`}
      />

      <p>
        A row from a <em>different</em> draft is refused the same way. Each
        change carries an opaque <code>owner</code>, and one draft never accepts
        another's.
      </p>

      <CodeBlock
        language="typescript"
        code={`const a = createDraft(source.address);
const b = createDraft(source.address);

a.resolve(b.changes()[0], 'draft'); // { ok: false, reason: 'stale' }`}
      />

      <h3>The other two refusals</h3>

      <ul>
        <li>
          <code>missing-source</code> - the path the draft branched from is gone
          entirely, so there is no source side to choose.
        </li>
        <li>
          <code>boundary</code> - keeping the draft's value would require
          writing somewhere the source's shape does not allow.
        </li>
      </ul>

      <h2>A Resolution Loop</h2>

      <p>
        Because a resolve invalidates the rows you were holding, read the list
        again on each pass rather than iterating a snapshot.
      </p>

      <CodeBlock
        language="typescript"
        code={`function resolveAll(draft, choice: 'source' | 'draft') {
  for (;;) {
    const next = draft.changes().find(change => change.conflict);
    if (!next) return;

    const result = draft.resolve(next, choice);
    if (!result.ok) return result; // missing-source or boundary
  }
}`}
      />

      <h2>Conflicts Are Not Errors</h2>

      <p>
        A conflict is a fact about two edits, not a failure. The draft keeps
        working: you can go on editing other fields, and only the conflicting
        rows block <code>apply()</code>. The library refuses to guess, which is
        why the choice is an API call and not a merge strategy option.
      </p>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/draft-apply">apply, reset and discard</a> - what a
          conflict does to <code>apply()</code>
        </li>
        <li>
          <a href="#/guide/draft">createDraft</a> - reading{' '}
          <code>changes()</code>
        </li>
        <li>
          <a href="#/guide/sync-query">query and resource</a> - the same change
          model over a server baseline
        </li>
      </ul>
    </div>
  );
});
