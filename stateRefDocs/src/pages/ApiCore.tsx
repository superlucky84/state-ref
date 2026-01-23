import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ApiCore = mount(() => {
  return () => (
    <div>
      <h1>Core API</h1>

      <p>
        This page documents the core functions exported from <code>state-ref</code>.
        These are the fundamental building blocks for state management.
      </p>

      <h2>createStore</h2>

      <p>
        Creates a reactive store with the given initial value and returns a watch function.
      </p>

      <h3>Signature</h3>

      <CodeBlock
        language="typescript"
        code={`function createStore<V>(initialValue: V): Watch<V>`}
      />

      <h3>Parameters</h3>

      <ul>
        <li>
          <code>initialValue: V</code> - The initial value of the store. Can be a primitive
          (number, string, boolean) or an object/array.
        </li>
      </ul>

      <h3>Returns</h3>

      <p>
        Returns a <code>Watch&lt;V&gt;</code> function that can be called to access
        the store or subscribe to changes.
      </p>

      <h3>Example</h3>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

// Primitive store
const countWatch = createStore(0);

// Object store
const userWatch = createStore({ name: 'John', age: 30 });

// Array store
const itemsWatch = createStore(['a', 'b', 'c']);

// Access without subscription
const count = countWatch();
console.log(count.value);  // 0

// Access with subscription
countWatch((ref, isFirst) => {
  const value = ref.value;  // Access first for subscription
  if (isFirst) return;
  console.log('Count changed:', value);
});`}
      />

      <h2>createStoreManualSync</h2>

      <p>
        Creates a store with manual synchronization control. Updates are not automatically
        propagated to subscribers until <code>sync()</code> is called.
      </p>

      <h3>Signature</h3>

      <CodeBlock
        language="typescript"
        code={`function createStoreManualSync<V>(initialValue: V): ManualSyncStore<V>

type ManualSyncStore<V> = {
  watch: Watch<V>;           // Read-only subscription
  updateRef: StateRefStore<V>;  // Reference for updates
  sync: () => void;          // Trigger synchronization
}`}
      />

      <h3>Parameters</h3>

      <ul>
        <li>
          <code>initialValue: V</code> - The initial value of the store.
        </li>
      </ul>

      <h3>Returns</h3>

      <p>
        Returns a <code>ManualSyncStore&lt;V&gt;</code> object with three properties:
      </p>

      <ul>
        <li>
          <code>watch</code> - A watch function for read-only subscriptions
        </li>
        <li>
          <code>updateRef</code> - A reference for updating values (writes don't trigger subscribers)
        </li>
        <li>
          <code>sync()</code> - A function to manually trigger all pending updates to subscribers
        </li>
      </ul>

      <h3>Example</h3>

      <CodeBlock
        language="typescript"
        code={`import { createStoreManualSync } from 'state-ref';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

// Subscribe to changes
watch((ref, isFirst) => {
  const count = ref.count.value;
  if (isFirst) return;
  console.log('Synced count:', count);
});

// Update value (no subscriber notification yet)
updateRef.count.value = 10;
updateRef.count.value = 20;
updateRef.count.value = 30;

// Manually sync - subscribers notified once with final value
sync();
// Logs: "Synced count: 30"`}
      />

      <h2>createComputed</h2>

      <p>
        Creates a computed (derived) value from one or more watches. The computed value
        is read-only and automatically updates when source stores change.
      </p>

      <h3>Signature</h3>

      <CodeBlock
        language="typescript"
        code={`function createComputed<W extends readonly Watch<any>[], R>(
  watches: W,
  callback: (refs: StateRefsTuple<W>) => R
): (computedCallback?: (proxy: { value: R }, isFirst: boolean) => void) => { value: R }`}
      />

      <h3>Parameters</h3>

      <ul>
        <li>
          <code>watches: W</code> - An array of watch functions to combine
        </li>
        <li>
          <code>callback: (refs) =&gt; R</code> - A function that receives the store references
          and returns the computed value
        </li>
      </ul>

      <h3>Returns</h3>

      <p>
        Returns a watch-like function that provides access to the computed value via <code>.value</code>.
        The returned value is read-only; attempting to set it will show a warning.
      </p>

      <h3>Example</h3>

      <CodeBlock
        language="typescript"
        code={`import { createStore, createComputed } from 'state-ref';

const priceWatch = createStore(100);
const quantityWatch = createStore(3);

// Create computed value
const totalWatch = createComputed(
  [priceWatch, quantityWatch],
  ([price, quantity]) => price.value * quantity.value
);

// Access computed value
const total = totalWatch();
console.log(total.value);  // 300

// Subscribe to computed changes
totalWatch((ref, isFirst) => {
  const value = ref.value;
  if (isFirst) return;
  console.log('Total changed:', value);
});

// Update source triggers recomputation
const price = priceWatch();
price.value = 150;
// Logs: "Total changed: 450"`}
      />

      <h2>combineWatch</h2>

      <p>
        Combines multiple watches into a single watch that delivers their values as a tuple.
        Unlike <code>createComputed</code>, it preserves individual store access.
      </p>

      <h3>Signature</h3>

      <CodeBlock
        language="typescript"
        code={`function combineWatch<W extends readonly Watch<any>[]>(
  watches: [...W]
): Watch<CombinedValue<W>>`}
      />

      <h3>Parameters</h3>

      <ul>
        <li>
          <code>watches: W</code> - An array of watch functions to combine
        </li>
      </ul>

      <h3>Returns</h3>

      <p>
        Returns a new <code>Watch</code> function. The returned store provides access to
        individual stores by index (e.g., <code>combined[0]</code>, <code>combined[1]</code>).
      </p>

      <h3>Example</h3>

      <CodeBlock
        language="typescript"
        code={`import { createStore, combineWatch } from 'state-ref';

const userWatch = createStore({ name: 'John' });
const settingsWatch = createStore({ theme: 'dark' });

// Combine watches
const combinedWatch = combineWatch([userWatch, settingsWatch]);

// Access by index
const combined = combinedWatch();
console.log(combined[0].name.value);  // 'John'
console.log(combined[1].theme.value); // 'dark'

// Subscribe to any change
combinedWatch(([user, settings], isFirst) => {
  const name = user.name.value;
  const theme = settings.theme.value;
  if (isFirst) return;
  console.log(\`User: \${name}, Theme: \${theme}\`);
});`}
      />

      <h2>Watch Function</h2>

      <p>
        The <code>Watch</code> type represents the function returned by <code>createStore</code>.
      </p>

      <h3>Type Definition</h3>

      <CodeBlock
        language="typescript"
        code={`type Watch<V> = (
  renew?: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean; editable?: boolean }
) => StateRefStore<V>`}
      />

      <h3>Parameters</h3>

      <ul>
        <li>
          <code>renew</code> (optional) - Callback function invoked on state changes
        </li>
        <li>
          <code>userOption.cache</code> (optional, default: <code>true</code>) - Whether to cache
          the proxy for the same renew function
        </li>
        <li>
          <code>userOption.editable</code> (optional, default: <code>true</code>) - Whether the
          returned reference can modify the store
        </li>
      </ul>

      <h3>Renew Callback</h3>

      <CodeBlock
        language="typescript"
        code={`type Renew<G> = (
  store: G,
  isFirst: boolean
) => boolean | AbortSignal | void

// Example with AbortSignal
const controller = new AbortController();

watch((ref, isFirst) => {
  const value = ref.value;
  if (isFirst) return controller.signal;
  console.log('Value:', value);
});

// Later, unsubscribe
controller.abort();`}
      />

      <h2>StateRefStore</h2>

      <p>
        The <code>StateRefStore</code> type represents the proxy object returned when calling
        a watch function. It provides reactive access to state via the <code>.value</code> property.
      </p>

      <h3>Type Definition</h3>

      <CodeBlock
        language="typescript"
        code={`type StateRefStore<S> = S extends object
  ? {
      [K in keyof S]: StateRefStore<S[K]>;
    } & {
      value: S;
    }
  : { value: S }`}
      />

      <h3>Behavior</h3>

      <ul>
        <li>
          <strong>Object types</strong>: Can navigate nested properties, each with its own <code>.value</code>
        </li>
        <li>
          <strong>Primitive types</strong>: Access and modify via <code>.value</code>
        </li>
        <li>
          <strong>Reading <code>.value</code></strong>: Registers a subscription for that property
        </li>
        <li>
          <strong>Writing <code>.value</code></strong>: Updates the store and notifies subscribers
        </li>
      </ul>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ user: { name: 'John', age: 30 } });
const ref = watch();

// Deep navigation
ref.user.name.value;           // 'John'
ref.user.age.value;            // 30
ref.user.value;                // { name: 'John', age: 30 }
ref.value;                     // { user: { name: 'John', age: 30 } }

// Update
ref.user.name.value = 'Jane';  // Updates and notifies
ref.user.value = { name: 'Bob', age: 25 };  // Replace entire user object`}
      />

      <h2>ManualSyncStore</h2>

      <p>
        The type returned by <code>createStoreManualSync</code>.
      </p>

      <h3>Type Definition</h3>

      <CodeBlock
        language="typescript"
        code={`type ManualSyncStore<V> = {
  watch: Watch<V>;           // For subscribing to changes
  updateRef: StateRefStore<V>;  // For updating values
  sync: () => void;          // For triggering sync
}`}
      />

      <h2>Summary Table</h2>

      <table>
        <thead>
          <tr>
            <th>Function</th>
            <th>Purpose</th>
            <th>Auto Sync</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>createStore</code></td>
            <td>Create a reactive store</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td><code>createStoreManualSync</code></td>
            <td>Create store with manual sync control</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>createComputed</code></td>
            <td>Derive new value from stores</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td><code>combineWatch</code></td>
            <td>Group stores as tuple</td>
            <td>Yes</td>
          </tr>
        </tbody>
      </table>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/create-store">createStore Guide</a> - Detailed usage guide
        </li>
        <li>
          <a href="#/guide/watch">Watch Function Guide</a> - Understanding watch functions
        </li>
        <li>
          <a href="#/guide/manual-sync">Manual Sync Guide</a> - Flux pattern with manual sync
        </li>
        <li>
          <a href="#/api/helpers">Helper API</a> - lens, copyable, cloneDeep
        </li>
        <li>
          <a href="#/api/types">TypeScript Types</a> - Complete type definitions
        </li>
      </ul>
    </div>
  );
});
