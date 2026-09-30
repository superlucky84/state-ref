import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ApiPlugin = mount(() => {
  return () => (
    <div>
      <h1>Plugin API</h1>

      <p>
        <code>state-ref/plugin</code> is the seam that{' '}
        <code>state-ref/draft</code> and <code>@stateref/sync</code> are built
        on. It lets a package look at a ref - where it points, whether it is
        writable, what it currently reads - and observe writes, without going
        through the subscription system a UI uses.
      </p>

      <p>
        <strong>Read this framing first.</strong> The source calls it{' '}
        <em>
          &quot;an optional integration surface for draft and sync
          packages&quot;
        </em>{' '}
        and{' '}
        <em>
          &quot;an internal, opt-in view of a ref … not part of the package root
          API&quot;
        </em>
        . It is documented here because building your own layer on top of{' '}
        <code>state-ref</code> is the case it exists for - not because it
        carries the same stability promise as the root exports. If you only need
        to read and write state, you do not need this page.
      </p>

      <h2>connectRef</h2>

      <CodeBlock
        language="typescript"
        code={`import { connectRef } from 'state-ref/plugin';

function connectRef<T>(source: StateRefStore<T>): RefConnection<T>

type RefConnection<T> = {
  readonly owner: object;
  readonly parent: RefPathCursor;
  readonly segment: string | symbol | null;
  readonly editable: boolean;
  readonly read: () => T | undefined;
  readonly exists: () => boolean;
};`}
      />

      <p>
        Turns a ref into a description of itself. It throws{' '}
        <code>Expected a state-ref reference.</code> for anything that is not
        one.
      </p>

      <ul>
        <li>
          <code>owner</code> - the root object this ref belongs to. Two refs
          from the same store share it.
        </li>
        <li>
          <code>parent</code> / <code>segment</code> - where the ref points.{' '}
          <code>segment</code> is <code>null</code> for a root ref.
        </li>
        <li>
          <code>editable</code> - whether writes are allowed through it. This is
          what a layer must consult before offering an edit; a readonly query's
          ref answers <code>false</code>.
        </li>
        <li>
          <code>read()</code> - the current value, or <code>undefined</code>.
        </li>
        <li>
          <code>exists()</code> - whether the path is present at all. Separate
          from <code>read()</code>, because a path holding{' '}
          <code>undefined</code> and a path that is gone are different facts -
          the same distinction <code>DraftValue</code> carries.
        </li>
      </ul>

      <h2>observeRef</h2>

      <CodeBlock
        language="typescript"
        code={`import { observeRef } from 'state-ref/plugin';

function observeRef<T>(
  source: StateRefStore<T>,
  callback: (value: T | undefined) => void
): () => void`}
      />

      <p>
        Listens to <strong>that path only</strong> and returns a disposer. The
        ordinary runner still decides whether the value actually changed,
        including when an ancestor replaces the whole branch, so a callback is
        not woken by an unrelated write that happened to pass overhead.
      </p>

      <CodeBlock
        language="typescript"
        code={`const stop = observeRef(source.address.city, value => {
  console.log('city is now', value);
});

stop();`}
      />

      <h2>Write Observation</h2>

      <p>
        A store can report every successful ref setter, before its subscribers
        run. The hook is installed when the store is created.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { create } from 'state-ref';

const store = create(
  { address: { city: 'Seoul' } },
  {
    // the parameter type is inferred; see the shape below
    onWrite: write => {
      write.parent;   // a path cursor - the core's stable path nodes
      write.segment;  // the key written, or null for a root write
      write.before;
      write.after;
    },
  }
);`}
      />

      <p>
        The cursor uses the core's path nodes rather than an array, so an
        ordinary setter does not pay for building a path nobody reads. A layer
        that records the write materializes the path itself.
      </p>

      <p>Its shape:</p>

      <CodeBlock
        language="typescript"
        code={`type RefWrite = Readonly<{
  parent: RefPathCursor;
  segment: string | symbol | null;
  before: unknown;
  after: unknown;
}>;

type RefPathCursor = {
  readonly segment: string | symbol;
  readonly parent: RefPathCursor | null;
};`}
      />

      <p>
        Two things about this boundary are worth stating plainly rather than
        discovering later. <code>onWrite</code> is an option of{' '}
        <code>create</code>, and <code>create</code> is marked in the core
        source as an internal seam rather than documented API -{' '}
        <code>createStore</code> does not take it. And <code>RefWrite</code>{' '}
        itself is <strong>not exported</strong> from <code>state-ref</code> or{' '}
        <code>state-ref/plugin</code>, so the callback parameter is typed by
        inference. That is the honest state of this surface today.
      </p>

      <h2>guardWriteObserver</h2>

      <CodeBlock
        language="typescript"
        code={`import { guardWriteObserver } from 'state-ref/plugin';

const onWrite = guardWriteObserver(write => {
  // ...
});`}
      />

      <p>
        Wraps an observer so that a write attempted <em>from inside it</em> is
        rejected with{' '}
        <code>A write observer cannot write to its own store.</code> - before
        the nested setter can publish and overwrite the outer tree. Use it
        whenever your observer runs code that might write back.
      </p>

      <h2>createWriteJournal</h2>

      <CodeBlock
        language="typescript"
        code={`import { createWriteJournal } from 'state-ref/plugin';

const journal = createWriteJournal();

const store = create(value, { onWrite: journal.onWrite });

journal.version();      // advances on every write
journal.entries();      // a copy of the user writes so far
journal.lastOrigin();
journal.clearEntries(); // after folding them into your own change model

journal.runAs('accepted-server-result', () => {
  ref.address.city.value = fromServer; // advances version, records no entry
});`}
      />

      <p>
        An opt-in edit log for one owner. The point is the <code>origin</code>{' '}
        distinction:
      </p>

      <CodeBlock
        language="typescript"
        code={`type WriteOrigin =
  | 'user'
  | 'source-refresh'
  | 'accepted-server-result'
  | 'rollback';

type JournalEntry = Readonly<{ version: number; write: RefWrite }>;`}
      />

      <p>
        Only <code>'user'</code> writes become entries. A baseline refresh, an
        accepted server result and a rollback all{' '}
        <strong>advance the version</strong> but are not the user's changes -
        which is exactly what lets a resource tell &quot;you edited this&quot;
        from &quot;the server moved it&quot;. Wrap the synchronous setter with{' '}
        <code>runAs</code>, not an async request or a promise chain.
      </p>

      <p>
        The observer mutates its private array only after all validation, and
        never calls user code.
      </p>

      <h2>Where This Is Used</h2>

      <p>
        <a href="#/guide/draft">createDraft</a> uses it to know its source's
        path, editability and current value, and to journal edits into{' '}
        <code>changes()</code>. <a href="#/guide/sync">@stateref/sync</a> uses
        the same surface to keep a server baseline and a local edit apart on one
        ref.
      </p>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/custom-connector">Custom Connector</a> - the ordinary
          way to integrate a UI library
        </li>
        <li>
          <a href="#/api/draft">Draft API</a>
        </li>
        <li>
          <a href="#/guide/sync-observation">Observation</a> - the sync-side
          boundary built on this
        </li>
      </ul>
    </div>
  );
});
