import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Draft = mount(() => {
  return () => (
    <div>
      <h1>createDraft</h1>

      <p>
        A draft is an independent local edit session over an existing ref. Edits
        stay inside the draft until you <code>apply()</code> them, so a form can
        hold half-finished input without the rest of the screen seeing it.
      </p>

      <p>
        It ships as a separate entry point. Importing <code>state-ref</code>{' '}
        alone does not load it.
      </p>

      <h2>Basic Usage</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import { createDraft } from 'state-ref/draft';

const source = createStore({ address: { city: 'Seoul', zip: 100 } })();

const editor = createDraft(source.address);
editor.ref.city.value = 'Busan';

editor.isDirty();  // true
editor.changes();  // city: Seoul -> Busan
editor.apply();    // merges into the source locally; contacts no server
editor.discard();  // releases subscriptions and closes the session`}
      />

      <h2>It Starts From the Current Value</h2>

      <p>
        A draft copies the source's value <em>at the moment it is branched</em>,
        and it does not inherit the source's own change history. A source that
        is already dirty produces a draft that is clean.
      </p>

      <CodeBlock
        language="typescript"
        code={`// the source already holds an unsaved edit
source.address.city.value = 'Busan';

const editor = createDraft(source.address);

editor.ref.city.value;     // 'Busan'  - the branch point
editor.isDirty();          // false    - not the parent's history
editor.changes();          // []

editor.ref.city.value = 'Daejeon';
editor.changes()[0].before; // { exists: true, value: 'Busan' }`}
      />

      <p>
        The <code>before</code> of that change is <code>'Busan'</code>, not the
        source's original <code>'Seoul'</code>: a change is relative to where
        the draft branched, not to where the source started.
      </p>

      <h2>Two Drafts Over One Source</h2>

      <p>
        Drafts are independent of each other. Editing one does not touch the
        other, and neither touches the source until it applies.
      </p>

      <CodeBlock
        language="typescript"
        code={`const a = createDraft(source.address);
const b = createDraft(source.address);

a.ref.city.value = 'Daejeon';

a.ref.city.value;            // 'Daejeon'
b.ref.city.value;            // unchanged
source.address.city.value;   // unchanged`}
      />

      <h2>Reading the Draft</h2>

      <p>
        <code>draft.ref</code> reads and writes the draft's own value.{' '}
        <code>draft.watch</code> has the same <code>Watch</code> shape the UI
        connectors accept, so a draft binds to a component exactly like a store.
      </p>

      <CodeBlock
        language="typescript"
        code={`// with a connector, e.g. React
const useDraft = connectReact(editor.watch);

function CityField() {
  const state = useDraft();
  return (
    <input
      value={state.city.value}
      onChange={event => (state.city.value = event.target.value)}
    />
  );
}`}
      />

      <h2>Status</h2>

      <p>
        <code>draft.status</code> exposes <code>dirty</code>,{' '}
        <code>conflicts</code> and <code>version</code> as reactive values,
        without adding any field to the payload you are editing.{' '}
        <code>draft.watchStatus</code> is its subscribable form.
      </p>

      <CodeBlock
        language="typescript"
        code={`editor.status.dirty.value;      // boolean
editor.status.conflicts.value;  // number
editor.status.version.value;    // number

// or subscribe
editor.watchStatus(status => {
  console.log(status.dirty.value, status.conflicts.value);
});

// the same three, read once
editor.isDirty();
editor.version();`}
      />

      <h2>Changes</h2>

      <p>
        <code>changes()</code> returns one row per edited path. Each row carries
        what the draft had at the branch point (<code>before</code>), what it
        holds now (<code>after</code>), and what the source holds at this moment
        (<code>source</code>).
      </p>

      <CodeBlock
        language="typescript"
        code={`const [change] = editor.changes();

change.path;      // ['city']
change.before;    // { exists: true, value: 'Seoul' }
change.after;     // { exists: true, value: 'Busan' }
change.source;    // { exists: true, value: 'Seoul' }  - right now
change.conflict;  // false
change.id;        // stable within this session
change.version;   // the draft version this row was read at`}
      />

      <p>
        <code>before</code>, <code>after</code> and <code>source</code> are{' '}
        <code>{'{ exists, value }'}</code> rather than bare values, because
        &quot;the path is absent&quot; and &quot;the path holds{' '}
        <code>undefined</code>&quot; are different facts.
      </p>

      <h2>Arrays Are One Field</h2>

      <p>
        Editing one element records a change for the{' '}
        <strong>whole array</strong>, not for the index. An index is a position,
        not an identity: if the source reorders, an index-level change would
        silently land on a different item.
      </p>

      <CodeBlock
        language="typescript"
        code={`const editor = createDraft(source);
editor.ref.contacts[0].name.value = 'Kim';

editor.changes()[0].path; // ['contacts'] - not ['contacts', '0', 'name']`}
      />

      <h2>What a Draft Accepts</h2>

      <p>
        Drafts edit acyclic plain data and dense arrays. Rejected, each with its
        own error:
      </p>

      <ul>
        <li>
          functions, <code>Date</code>, <code>Map</code> and similar non-plain
          values
        </li>
        <li>core-reserved payload keys</li>
        <li>
          direct mutation of an object you obtained through the draft's{' '}
          <code>.value</code> - copy it instead
        </li>
      </ul>

      <h2>UMD</h2>

      <p>
        The UMD build is a companion script. Load <code>state-ref.umd.js</code>{' '}
        first, then <code>state-ref.draft.umd.js</code>, and use the{' '}
        <code>stateRefDraft</code> global.
      </p>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/draft-apply">apply, reset and discard</a> - moving
          edits into the source, and ending the session
        </li>
        <li>
          <a href="#/guide/draft-conflicts">Conflicts</a> - what happens when
          the source moves underneath
        </li>
        <li>
          <a href="#/guide/draft-lifetime">Lifetime</a> - subscriptions and
          cleanup
        </li>
        <li>
          <a href="#/api/draft">Draft API</a> - the full type surface
        </li>
      </ul>
    </div>
  );
});
