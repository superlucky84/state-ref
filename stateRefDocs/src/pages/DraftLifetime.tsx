import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const DraftLifetime = mount(() => {
  return () => (
    <div>
      <h1>Draft Lifetime</h1>

      <p>
        A draft is a session, not a value. It subscribes to the source so it can
        tell you when a change turns into a conflict, and those subscriptions
        live until you close it.
      </p>

      <h2>Close What You Open</h2>

      <p>
        <code>discard()</code> is the only thing that ends a draft. A draft that
        is merely unreachable is still subscribed.
      </p>

      <CodeBlock
        language="typescript"
        code={`const editor = createDraft(source.address);

// ... the screen uses it ...

editor.discard(); // releases the subscriptions it held`}
      />

      <p>
        Pair it with whatever owns the screen. In a component, that is the
        unmount path:
      </p>

      <CodeBlock
        language="typescript"
        code={`// React
useEffect(() => {
  const editor = createDraft(source.address);
  setEditor(editor);
  return () => editor.discard();
}, []);`}
      />

      <h2>Branch and Close Repeatedly</h2>

      <p>
        Opening and closing a draft leaves nothing behind. A source edit wakes
        only the drafts that are still open.
      </p>

      <CodeBlock
        language="typescript"
        code={`for (let i = 0; i < 20; i += 1) {
  const editor = createDraft(source.address);
  editor.ref.city.value = 'Busan';
  editor.discard();
}

// a later source write wakes none of those twenty
source.address.city.value = 'Daejeon';`}
      />

      <p>
        If you keep two open instead, exactly two wake up. That difference -
        zero versus two - is how a leak would show itself.
      </p>

      <h2>A Draft Is Not the Source's Child</h2>

      <p>
        Discarding a draft does not touch the source, and the source does not
        own the draft. Nothing is reference-counted between them.
      </p>

      <CodeBlock
        language="typescript"
        code={`editor.apply();   // the source keeps this
editor.discard(); // and keeps it after the draft is gone`}
      />

      <p>
        The reverse also holds: a draft outlives the screen that made it, if you
        let it. A wizard can branch on step one and apply on step three, as long
        as something holds the handle.
      </p>

      <h2>After discard</h2>

      <p>
        Every access refuses explicitly. There is no &quot;last known
        value&quot; to read.
      </p>

      <CodeBlock
        language="typescript"
        code={`editor.discard();

editor.ref.city.value;  // throws: This draft has been discarded.
editor.changes();       // throws: This draft has been discarded.
editor.isDirty();       // throws: This draft has been discarded.
editor.apply();         // throws: This draft has been discarded.`}
      />

      <p>
        If your UI can render after the session ends, keep your own flag and
        stop reading the draft - do not catch the error per row.
      </p>

      <CodeBlock
        language="typescript"
        code={`let open = true;

function close() {
  editor.discard();
  open = false;
}

// render
open ? <DraftRows draft={editor} /> : <p>Closed</p>;`}
      />

      <h2>Subscriptions the Draft Hands Out</h2>

      <p>
        <code>draft.watch</code> and <code>draft.watchStatus</code> follow the
        same rules as a store's <code>watch</code>: a callback collects
        dependencies on its first run, and it keeps running until its own
        subscription ends. Discarding the draft ends all of them at once.
      </p>

      <CodeBlock
        language="typescript"
        code={`const controller = new AbortController();

editor.watchStatus(status => {
  // read what you are handed, or nothing is registered
  void status.dirty.value;
  void status.conflicts.value;
  return controller.signal;
});

controller.abort(); // ends this one subscription
editor.discard();   // ends everything the draft holds`}
      />

      <p>
        Note the reads inside the callback. A callback that reads nothing
        registers no dependency and is never woken again - it will report a
        cheerful, permanent zero.
      </p>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/draft-apply">apply, reset and discard</a> - ending a
          session
        </li>
        <li>
          <a href="#/guide/subscription">Subscription</a> - how dependencies and
          cleanup work in the core
        </li>
        <li>
          <a href="#/guide/sync-observation">Observation</a> - counting what a
          sync client still holds
        </li>
      </ul>
    </div>
  );
});
