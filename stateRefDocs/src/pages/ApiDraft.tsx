import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ApiDraft = mount(() => {
  return () => (
    <div>
      <h1>Draft API</h1>

      <p>
        Everything exported from <code>state-ref/draft</code>. See{' '}
        <a href="#/guide/draft">createDraft</a> for the guide.
      </p>

      <h2>createDraft</h2>

      <CodeBlock
        language="typescript"
        code={`function createDraft<T>(source: StateRefStore<T>): Draft<T>`}
      />

      <p>
        Opens an independent local edit session over <code>source</code>,
        starting from its value at the moment of the call. The source may be a
        whole store ref or any child ref under it.
      </p>

      <h2>Draft</h2>

      <CodeBlock
        language="typescript"
        code={`type Draft<T> = Readonly<{
  ref: StateRefStore<T>;
  watch: Watch<T>;
  status: StateRefStore<DraftStatus>;
  watchStatus: Watch<DraftStatus>;
  isDirty: () => boolean;
  changes: () => readonly DraftChange[];
  version: () => number;
  apply: () => DraftApplyResult;
  resolve: (
    change: DraftChange,
    choice: 'source' | 'draft'
  ) => DraftResolveResult;
  reset: () => void;
  discard: () => void;
}>`}
      />

      <ul>
        <li>
          <code>ref</code> - reads and writes the draft's own value.
        </li>
        <li>
          <code>watch</code> / <code>watchStatus</code> - the <code>Watch</code>{' '}
          shape the UI connectors accept.
        </li>
        <li>
          <code>status</code> - reactive <code>dirty</code>,{' '}
          <code>conflicts</code> and <code>version</code>, without adding fields
          to the payload.
        </li>
        <li>
          <code>reset()</code> - drops local edits, keeps the session open.
        </li>
        <li>
          <code>discard()</code> - ends the session and releases its
          subscriptions. Every later access throws{' '}
          <code>This draft has been discarded.</code>
        </li>
      </ul>

      <h2>DraftStatus</h2>

      <CodeBlock
        language="typescript"
        code={`type DraftStatus = Readonly<{
  dirty: boolean;
  conflicts: number;
  version: number;
}>`}
      />

      <h2>DraftValue</h2>

      <CodeBlock
        language="typescript"
        code={`type DraftValue = Readonly<{ exists: boolean; value: unknown }>`}
      />

      <p>
        A wrapper rather than a bare value, so &quot;the path is absent&quot;
        and &quot;the path holds <code>undefined</code>&quot; stay distinct.
      </p>

      <h2>DraftChange</h2>

      <CodeBlock
        language="typescript"
        code={`type DraftChange = Readonly<{
  /** Opaque identity; a change from another draft is never accepted here. */
  owner: object;
  id: number;
  version: number;
  path: readonly (string | number)[];
  before: DraftValue;   // the value at the branch point
  after: DraftValue;    // what the draft holds now
  source: DraftValue;   // what the source holds right now
  conflict: boolean;
}>`}
      />

      <p>
        One row per edited path. An array is tracked as one atomic field, so
        editing an element records a change for the array.
      </p>

      <h2>DraftApplyResult</h2>

      <CodeBlock
        language="typescript"
        code={`type DraftApplyResult =
  | Readonly<{ ok: true; applied: number }>
  | Readonly<{
      ok: false;
      reason: 'readonly' | 'missing-source' | 'invalid-source' | 'conflict';
    }>`}
      />

      <p>
        A refusal changes nothing. The reasons are checked in this order: the
        source path being gone or unwritable, then <code>readonly</code>, then
        conflicts.
      </p>

      <ul>
        <li>
          <code>conflict</code> - the path still exists but no longer holds what
          the draft branched from, including a type swap.
        </li>
        <li>
          <code>missing-source</code> - the path itself is gone.
        </li>
        <li>
          <code>invalid-source</code> - the source ref cannot be written
          through.
        </li>
        <li>
          <code>readonly</code> - the source refuses every write; in practice a
          query opened with <code>editable: false</code>.
        </li>
        <li>
          <code>applied</code> - how many paths were written. A clean draft
          answers <code>{'{ ok: true, applied: 0 }'}</code>.
        </li>
      </ul>

      <h2>DraftResolveResult</h2>

      <CodeBlock
        language="typescript"
        code={`type DraftResolveResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: 'stale' | 'missing-source' | 'boundary' }>`}
      />

      <ul>
        <li>
          <code>stale</code> - the change belongs to another draft, or the draft
          version has moved since the row was read. Read <code>changes()</code>{' '}
          again.
        </li>
        <li>
          <code>missing-source</code> - there is no source side left to choose.
        </li>
        <li>
          <code>boundary</code> - keeping the draft's value would require
          writing where the source's shape does not allow.
        </li>
      </ul>

      <h2>UMD</h2>

      <p>
        Load <code>state-ref.umd.js</code> before{' '}
        <code>state-ref.draft.umd.js</code>, then use the{' '}
        <code>stateRefDraft</code> global.
      </p>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/draft">createDraft</a> - the guide
        </li>
        <li>
          <a href="#/guide/draft-conflicts">Conflicts</a>
        </li>
        <li>
          <a href="#/api/sync">Sync API</a> - the same change model over a
          server baseline
        </li>
      </ul>
    </div>
  );
});
