import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Batch = mount(() => {
  return () => (
    <div>
      <h1>batch</h1>

      <p>
        <code>batch</code> groups several writes into one synchronous
        notification pass. A subscriber that reads two paths runs once with the
        final values instead of once per write.
      </p>

      <p>
        It ships as a separate entry point. Importing <code>state-ref</code>{' '}
        alone does not load it, so the core bundle stays the same size for apps
        that never call it.
      </p>

      <h2>Basic Usage</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import { batch } from 'state-ref/batch';

const watch = createStore({ b: 0, c: 0 });

watch(state => {
  console.log(state.b.value, state.c.value);
}); // runs once immediately to collect both dependencies

const ref = watch();

batch(() => {
  ref.b.value = 3;
  ref.c.value = 4;
}); // the subscriber runs once with 3, 4 - before batch returns`}
      />

      <p>
        Without the batch, that subscriber would run twice: once for{' '}
        <code>b</code> and once for <code>c</code>.
      </p>

      <h2>Values Change Immediately</h2>

      <p>
        <code>batch</code> defers <em>notification</em>, not the write. Inside
        the callback every read already sees the new value.
      </p>

      <CodeBlock
        language="typescript"
        code={`batch(() => {
  ref.b.value = 3;
  console.log(ref.b.value); // 3 - already written
  ref.c.value = ref.b.value + 1; // reads the fresh value
});`}
      />

      <h2>Writing From a Subscriber</h2>

      <p>
        The ref passed into a <code>watch</code> callback can write inside a
        batch too.
      </p>

      <CodeBlock
        language="typescript"
        code={`watch((state, isFirst) => {
  if (isFirst) return;
  batch(() => {
    state.b.value += 1;
    state.c.value += 1;
  });
});`}
      />

      <h2>Nesting</h2>

      <p>
        Nested calls flush only at the outermost boundary, so a helper that
        batches internally stays correct when a caller wraps it in another
        batch.
      </p>

      <CodeBlock
        language="typescript"
        code={`batch(() => {
  ref.b.value = 1;
  batch(() => {
    ref.c.value = 2;
  }); // does not flush here
}); // flushes once, here`}
      />

      <h2>What batch Does Not Do</h2>

      <ul>
        <li>
          <strong>It is not a transaction.</strong> If the callback throws, the
          writes already made stay written. Nothing is rolled back.
        </li>
        <li>
          <strong>
            It cannot span an <code>await</code>.
          </strong>{' '}
          The pass is synchronous; writes made after an await are outside the
          batch.
        </li>
        <li>
          <strong>It does not change ordinary writes.</strong> Writes outside a
          batch still notify synchronously, one per write.
        </li>
        <li>
          <strong>
            It does not replace <code>sync()</code>.
          </strong>{' '}
          A store made with <code>createStoreManualSync</code> still requires
          its explicit call.
        </li>
      </ul>

      <h2>UMD</h2>

      <p>
        The UMD build is a companion script. Load <code>state-ref.umd.js</code>{' '}
        first, then <code>state-ref.batch.umd.js</code>, and call{' '}
        <code>stateRefBatch.batch</code>.
      </p>

      <CodeBlock
        language="html"
        code={`<script src="state-ref.umd.js"></script>
<script src="state-ref.batch.umd.js"></script>
<script>
  const watch = stateRef.createStore({ b: 0, c: 0 });
  const ref = watch();
  stateRefBatch.batch(() => {
    ref.b.value = 3;
    ref.c.value = 4;
  });
</script>`}
      />

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/shared">Shared Across Bundles</a> - batch does not
          cross copies of state-ref
        </li>
        <li>
          <a href="#/guide/manual-sync">Manual Sync (Flux)</a> - the other way
          to control when subscribers run
        </li>
        <li>
          <a href="#/guide/subscription">Subscription</a> - how dependencies are
          collected
        </li>
        <li>
          <a href="#/guide/draft">createDraft</a> - a separate entry point for
          local edit sessions
        </li>
      </ul>
    </div>
  );
});
