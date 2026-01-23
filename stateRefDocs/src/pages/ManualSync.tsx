import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ManualSync = mount(() => {
  return () => (
    <div>
      <h1>Manual Sync (Flux)</h1>

      <p>
        <code>createStoreManualSync</code> lets you control when updates notify
        subscribers. This is useful for Flux-style action flows, batching
        multiple changes, or enforcing a strict “read-only in views” policy.
      </p>

      <h2>Basic Usage</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStoreManualSync } from 'state-ref';

const { watch, updateRef, sync } = createStoreManualSync({
  count: 0,
  user: { name: 'Lee' }
});

// Subscribe (reads are tracked)
watch((store, isFirst) => {
  console.log('Count:', store.count.value, 'First?', isFirst);
});

// Read-only reference for consumers
const store = watch();
console.log(store.user.name.value); // 'Lee'

// Mutate through updateRef
updateRef.count.value += 1;
updateRef.user.name.value = 'Min';

// Notify subscribers explicitly
sync();`}
      />

      <h2>How It Works</h2>

      <ul>
        <li>
          <strong>watch</strong> returns a read-only reference in manual mode
        </li>
        <li>
          <strong>updateRef</strong> is the writable reference used by actions
        </li>
        <li>
          <strong>sync()</strong> flushes changes and triggers subscriptions
        </li>
      </ul>

      <h2>Read-Only in Views</h2>

      <p>
        In manual sync, direct mutation from <code>watch()</code> is blocked and
        throws an error. Always update via <code>updateRef</code>.
      </p>

      <CodeBlock
        language="typescript"
        code={`const { watch, updateRef } = createStoreManualSync({ count: 0 });

const store = watch();

// ✗ Not allowed in manual sync
store.count.value = 1; // Error: direct modification is not allowed

// ✓ Allowed
updateRef.count.value = 1;`}
      />

      <h2>Flux-Style Actions</h2>

      <p>
        Keep mutations inside action functions, then call <code>sync()</code> to
        publish updates.
      </p>

      <CodeBlock
        language="typescript"
        code={`type Profile = { john: { age: number } };

const { watch, updateRef, sync } = createStoreManualSync<Profile>({
  john: { age: 20 }
});

export const changeJohnAge = (age: number) => {
  updateRef.john.age.value = age;
  sync();
};

// View layer
watch(store => {
  console.log('John age:', store.john.age.value);
});`}
      />

      <h2>Batch Multiple Updates</h2>

      <p>
        Make several changes first, then call <code>sync()</code> once to reduce
        re-renders or side effects.
      </p>

      <CodeBlock
        language="typescript"
        code={`const { updateRef, sync } = createStoreManualSync({
  count: 0,
  theme: 'light',
  sidebar: true
});

updateRef.count.value += 1;
updateRef.theme.value = 'dark';
updateRef.sidebar.value = false;

// Single flush
sync();`}
      />

      <h2>Using with Framework Connectors</h2>

      <p>
        Manual sync works with connectors because <code>watch</code> is still the
        subscription source.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStoreManualSync } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectReact(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};

function Counter() {
  const { count } = useCounterStore();
  return <button onClick={increment}>{count.value}</button>;
}`}
      />

      <h2>API Summary</h2>

      <ul>
        <li>
          <code>createStoreManualSync(initial)</code> →{' '}
          <code>{`{ watch, updateRef, sync }`}</code>
        </li>
        <li>
          <code>watch(callback?)</code> - subscribe or get a read-only reference
        </li>
        <li>
          <code>updateRef</code> - writable reference for actions
        </li>
        <li>
          <code>sync()</code> - flushes changes to subscribers
        </li>
      </ul>

      <h2>Best Practices</h2>

      <ul>
        <li>
          <strong>Centralize writes</strong> in action functions
        </li>
        <li>
          <strong>Batch updates</strong> and call <code>sync()</code> once
        </li>
        <li>
          <strong>Keep views read-only</strong> to avoid accidental mutations
        </li>
      </ul>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/create-store">createStore</a> - automatic sync mode
        </li>
        <li>
          <a href="#/guide/watch">Watch Function</a> - subscription basics
        </li>
        <li>
          <a href="#/guide/subscription">Subscription</a> - lifecycle and cleanup
        </li>
      </ul>
    </div>
  );
});
