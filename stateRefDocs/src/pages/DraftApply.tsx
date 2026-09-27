import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const DraftApply = mount(() => {
  return () => (
    <div>
      <h1>apply, reset and discard</h1>

      <p>
        A draft ends in one of three ways: its edits move into the source (
        <code>apply</code>), its edits are thrown away but the session stays
        open (<code>reset</code>), or the session closes (<code>discard</code>).
      </p>

      <h2>apply</h2>

      <p>
        <code>apply()</code> merges the edited paths into the source's{' '}
        <strong>latest</strong> value and answers a result object rather than
        throwing.
      </p>

      <CodeBlock
        language="typescript"
        code={`const editor = createDraft(source.address);
editor.ref.city.value = 'Busan';

const result = editor.apply();
// { ok: true, applied: 1 }

source.address.value; // { city: 'Busan', zip: 100 }`}
      />

      <p>
        It is a local merge. Nothing is sent anywhere - a draft has no idea
        whether a server exists.
      </p>

      <h3>After a successful apply</h3>

      <p>
        The session stays open and rebases: the applied edits are gone from{' '}
        <code>changes()</code> and the draft is clean again. You can keep
        editing.
      </p>

      <CodeBlock
        language="typescript"
        code={`editor.apply();      // { ok: true, applied: 1 }

editor.changes();    // []
editor.isDirty();    // false
editor.ref.city.value; // 'Busan' - now agreeing with the source`}
      />

      <h3>Applying with nothing to apply</h3>

      <p>
        A clean draft applies successfully and reports zero. It is not an error
        - there was simply nothing to move.
      </p>

      <CodeBlock
        language="typescript"
        code={`createDraft(source.address).apply(); // { ok: true, applied: 0 }`}
      />

      <h3>When apply refuses</h3>

      <p>
        A refusal carries a <code>reason</code> and changes nothing. The source
        is left exactly as it was.
      </p>

      <CodeBlock
        language="typescript"
        code={`const result = editor.apply();

if (!result.ok) {
  switch (result.reason) {
    case 'conflict':
      // the path still exists, but it no longer holds what the draft
      // branched from - see the Conflicts page
      break;
    case 'missing-source':
      // the path the draft was branched from no longer exists at all
      break;
    case 'invalid-source':
      // the source ref cannot be written through
      break;
    case 'readonly':
      // the source refuses every write - e.g. a readonly sync query
      break;
  }
}`}
      />

      <p>
        <code>conflict</code> and <code>missing-source</code> are the two you
        will actually meet, and the line between them is whether{' '}
        <strong>the path is still there</strong>:
      </p>

      <CodeBlock
        language="typescript"
        code={`// the value changed under the draft -> conflict
source.address.city.value = 'Gwangju';
editor.apply(); // { ok: false, reason: 'conflict' }

// the parent was removed out from under a child draft -> missing-source
const room = createDraft(source.office.room);
room.ref.value = '999';
source.office.value = null;
room.apply(); // { ok: false, reason: 'missing-source' }`}
      />

      <p>
        A type swap counts as a conflict, not a missing source: the path is
        alive, it just holds a different kind of thing.
      </p>

      <CodeBlock
        language="typescript"
        code={`source.office.room.value = ['301']; // string -> string[]
room.apply(); // { ok: false, reason: 'conflict' }`}
      />

      <p>
        <code>readonly</code> is not reachable from a plain store. It appears
        when the source is a ref that refuses writes, which in practice means a
        query opened with <code>editable: false</code> in{' '}
        <a href="#/guide/sync-query">@stateref/sync</a>. Such a source can still
        be branched and edited; only <code>apply()</code> refuses.
      </p>

      <h3>apply is atomic</h3>

      <p>
        Every edited path is written in one pass, and the check happens{' '}
        <strong>before</strong> the source is touched. A refusal never leaves
        half the edits applied.
      </p>

      <h2>reset</h2>

      <p>
        <code>reset()</code> throws the local edits away and keeps the session
        open. The draft returns to the source's current value.
      </p>

      <CodeBlock
        language="typescript"
        code={`editor.ref.city.value = 'Busan';
editor.isDirty(); // true

editor.reset();

editor.ref.city.value; // 'Seoul' - back to the source
editor.isDirty();      // false
editor.changes();      // []

// still usable
editor.ref.city.value = 'Daejeon';`}
      />

      <p>
        This is what a &quot;Cancel&quot; button on a form wants: the input goes
        away, the form stays open.
      </p>

      <h2>discard</h2>

      <p>
        <code>discard()</code> ends the session and releases the subscriptions
        the draft held. It does not undo anything that was already applied.
      </p>

      <CodeBlock
        language="typescript"
        code={`editor.apply();   // the source now holds 'Busan'
editor.discard();

source.address.city.value; // 'Busan' - discard is not an undo`}
      />

      <p>
        After discarding, every access refuses explicitly rather than returning
        a stale value:
      </p>

      <CodeBlock
        language="typescript"
        code={`editor.ref.city.value = 'X'; // throws: This draft has been discarded.
editor.changes();            // throws: This draft has been discarded.`}
      />

      <p>
        That refusal is deliberate. A discarded draft that kept answering would
        let a component keep writing into a session nobody is listening to.
      </p>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/draft-conflicts">Conflicts</a> - reading a conflict
          and resolving it
        </li>
        <li>
          <a href="#/guide/draft-lifetime">Lifetime</a> - what a draft holds and
          when it lets go
        </li>
        <li>
          <a href="#/guide/sync-query">query and resource</a> - where{' '}
          <code>readonly</code> comes from
        </li>
      </ul>
    </div>
  );
});
