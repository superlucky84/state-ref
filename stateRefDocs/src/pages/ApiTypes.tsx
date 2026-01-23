import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ApiTypes = mount(() => {
  return () => (
    <div>
      <h1>TypeScript Types</h1>

      <p>
        This page documents the TypeScript types exported from <code>state-ref</code>.
        These types provide full type safety when working with stores.
      </p>

      <h2>Importing Types</h2>

      <CodeBlock
        language="typescript"
        code={`import type {
  StateRefStore,
  Watch,
  Renew,
  ManualSyncStore,
  Copyable
} from 'state-ref';`}
      />

      <h2>Core Types</h2>

      <h3>StateRefStore&lt;S&gt;</h3>

      <p>
        The proxy type returned when calling a watch function. Provides reactive access
        to state via the <code>.value</code> property.
      </p>

      <CodeBlock
        language="typescript"
        code={`type StateRefStore<S> = S extends object
  ? {
      [K in keyof S]: StateRefStore<S[K]>;
    } & {
      value: S;
    }
  : { value: S };`}
      />

      <h4>Behavior</h4>

      <ul>
        <li>
          <strong>Object types</strong>: Each property becomes a nested <code>StateRefStore</code>,
          plus a <code>.value</code> property for the whole object
        </li>
        <li>
          <strong>Primitive types</strong>: Simple wrapper with only <code>.value</code> property
        </li>
      </ul>

      <h4>Example</h4>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import type { StateRefStore } from 'state-ref';

// For object type
interface User {
  name: string;
  age: number;
}

const userWatch = createStore<User>({ name: 'John', age: 30 });
const userRef: StateRefStore<User> = userWatch();

// Type structure:
// userRef.name        → StateRefStore<string>
// userRef.name.value  → string
// userRef.age         → StateRefStore<number>
// userRef.age.value   → number
// userRef.value       → User

// For primitive type
const countWatch = createStore<number>(0);
const countRef: StateRefStore<number> = countWatch();

// Type structure:
// countRef.value → number`}
      />

      <h3>Watch&lt;V&gt;</h3>

      <p>
        The function type returned by <code>createStore</code>. Used to access the store
        or subscribe to changes.
      </p>

      <CodeBlock
        language="typescript"
        code={`type Watch<V> = (
  renew?: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean; editable?: boolean }
) => StateRefStore<V>;`}
      />

      <h4>Parameters</h4>

      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>renew</code></td>
            <td><code>Renew&lt;StateRefStore&lt;V&gt;&gt;</code></td>
            <td>Optional callback for subscriptions</td>
          </tr>
          <tr>
            <td><code>userOption.cache</code></td>
            <td><code>boolean</code></td>
            <td>Cache proxy for same renew (default: true)</td>
          </tr>
          <tr>
            <td><code>userOption.editable</code></td>
            <td><code>boolean</code></td>
            <td>Allow modifications (default: true)</td>
          </tr>
        </tbody>
      </table>

      <h4>Example</h4>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import type { Watch } from 'state-ref';

interface AppState {
  count: number;
  user: { name: string };
}

// Watch type is inferred
const watch = createStore<AppState>({ count: 0, user: { name: 'John' } });

// Explicit type annotation
const typedWatch: Watch<AppState> = watch;

// Call without callback - just get reference
const ref = typedWatch();

// Call with callback - subscribe to changes
typedWatch((store, isFirst) => {
  console.log(store.count.value);
});`}
      />

      <h3>Renew&lt;G&gt;</h3>

      <p>
        The callback function type for store subscriptions.
      </p>

      <CodeBlock
        language="typescript"
        code={`type Renew<G> = (
  store: G,
  isFirst: boolean
) => boolean | AbortSignal | void;`}
      />

      <h4>Parameters</h4>

      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>store</code></td>
            <td><code>G</code></td>
            <td>The StateRefStore proxy</td>
          </tr>
          <tr>
            <td><code>isFirst</code></td>
            <td><code>boolean</code></td>
            <td>True on first invocation</td>
          </tr>
        </tbody>
      </table>

      <h4>Return Values</h4>

      <table>
        <thead>
          <tr>
            <th>Return Type</th>
            <th>Effect</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>void</code></td>
            <td>Continue subscription</td>
          </tr>
          <tr>
            <td><code>false</code></td>
            <td>Unsubscribe immediately</td>
          </tr>
          <tr>
            <td><code>AbortSignal</code></td>
            <td>Unsubscribe when signal aborts</td>
          </tr>
        </tbody>
      </table>

      <h4>Example</h4>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import type { Renew, StateRefStore } from 'state-ref';

interface Counter {
  value: number;
}

const watch = createStore<Counter>({ value: 0 });

// Explicit renew function type
const callback: Renew<StateRefStore<Counter>> = (store, isFirst) => {
  const value = store.value.value;
  if (isFirst) return;

  console.log('Value changed:', value);

  // Return false to unsubscribe
  if (value >= 10) {
    return false;
  }
};

watch(callback);`}
      />

      <h3>ManualSyncStore&lt;V&gt;</h3>

      <p>
        The return type of <code>createStoreManualSync</code>.
      </p>

      <CodeBlock
        language="typescript"
        code={`type ManualSyncStore<V> = {
  watch: Watch<V>;
  updateRef: StateRefStore<V>;
  sync: () => void;
};`}
      />

      <h4>Properties</h4>

      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>watch</code></td>
            <td><code>Watch&lt;V&gt;</code></td>
            <td>Watch function for subscriptions</td>
          </tr>
          <tr>
            <td><code>updateRef</code></td>
            <td><code>StateRefStore&lt;V&gt;</code></td>
            <td>Reference for updating values</td>
          </tr>
          <tr>
            <td><code>sync</code></td>
            <td><code>() =&gt; void</code></td>
            <td>Function to trigger synchronization</td>
          </tr>
        </tbody>
      </table>

      <h4>Example</h4>

      <CodeBlock
        language="typescript"
        code={`import { createStoreManualSync } from 'state-ref';
import type { ManualSyncStore } from 'state-ref';

interface State {
  items: string[];
}

const store: ManualSyncStore<State> = createStoreManualSync({ items: [] });

const { watch, updateRef, sync } = store;

// Subscribe
watch((ref, isFirst) => {
  const items = ref.items.value;
  if (isFirst) return;
  console.log('Items synced:', items);
});

// Update without notification
updateRef.items.value = ['a', 'b', 'c'];

// Manually sync
sync();`}
      />

      <h2>Helper Types</h2>

      <h3>Copyable&lt;T, Root&gt;</h3>

      <p>
        The type returned by the <code>copyable</code> function.
      </p>

      <CodeBlock
        language="typescript"
        code={`type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(value: V) => Root;
};`}
      />

      <h4>Example</h4>

      <CodeBlock
        language="typescript"
        code={`import { copyable } from 'state-ref';
import type { Copyable } from 'state-ref';

interface State {
  user: {
    name: string;
    age: number;
  };
}

const state: State = { user: { name: 'John', age: 30 } };

// Copyable wraps the type
const wrapped: Copyable<State> = copyable(state);

// Navigate and get writeCopy
const newState: State = wrapped.user.name.writeCopy('Jane');`}
      />

      <h3>StateRefsTuple&lt;W&gt;</h3>

      <p>
        Utility type that converts an array of Watch types to an array of StateRefStore types.
        Used internally by <code>createComputed</code> and <code>combineWatch</code>.
      </p>

      <CodeBlock
        language="typescript"
        code={`type StateRefsTuple<W extends readonly Watch<any>[]> = {
  -readonly [K in keyof W]: W[K] extends Watch<infer T>
    ? StateRefStore<T>
    : never;
};`}
      />

      <h4>Example</h4>

      <CodeBlock
        language="typescript"
        code={`import { createStore, createComputed } from 'state-ref';

const watch1 = createStore(10);      // Watch<number>
const watch2 = createStore('hello'); // Watch<string>

// In createComputed callback, refs is StateRefsTuple<[Watch<number>, Watch<string>]>
// Which equals [StateRefStore<number>, StateRefStore<string>]
const computed = createComputed(
  [watch1, watch2],
  ([numRef, strRef]) => {
    // numRef: StateRefStore<number>
    // strRef: StateRefStore<string>
    return \`\${strRef.value}: \${numRef.value}\`;
  }
);`}
      />

      <h3>CombinedValue&lt;W&gt;</h3>

      <p>
        Utility type that extracts the value types from an array of Watch types.
        Used by <code>combineWatch</code> return type.
      </p>

      <CodeBlock
        language="typescript"
        code={`type CombinedValue<W extends readonly Watch<any>[]> = {
  [K in keyof W]: W[K] extends Watch<infer T> ? T : never;
};`}
      />

      <h4>Example</h4>

      <CodeBlock
        language="typescript"
        code={`import { createStore, combineWatch } from 'state-ref';

const numWatch = createStore(10);       // Watch<number>
const strWatch = createStore('hello');  // Watch<string>

// combineWatch returns Watch<CombinedValue<[Watch<number>, Watch<string>]>>
// Which equals Watch<[number, string]>
const combined = combineWatch([numWatch, strWatch]);

// The store type is StateRefStore<[number, string]>
const store = combined();`}
      />

      <h2>Internal Types</h2>

      <p>
        These types are used internally and generally not needed for typical usage.
      </p>

      <h3>StoreType&lt;V&gt;</h3>

      <CodeBlock
        language="typescript"
        code={`type StoreType<V> = { root: V };`}
      />

      <p>Internal wrapper that adds a root property to the store value.</p>

      <h3>Run</h3>

      <CodeBlock
        language="typescript"
        code={`type Run = null | ((isFirst?: boolean) => boolean | AbortSignal | void);`}
      />

      <p>Internal type for subscriber functions.</p>

      <h3>RunInfo&lt;A&gt;</h3>

      <CodeBlock
        language="typescript"
        code={`type RunInfo<A> = {
  value: A;
  getNextValue: () => A;
  key: string;
  primitiveSetter?: (newValue: A) => void;
};`}
      />

      <p>Internal type for tracking subscription information.</p>

      <h3>StoreRenderList&lt;A&gt;</h3>

      <CodeBlock
        language="typescript"
        code={`type RenderListSub<A> = Map<string, RunInfo<A>>;
type StoreRenderList<A> = Map<Run, RenderListSub<A>>;`}
      />

      <p>Internal type for managing subscriber lists.</p>

      <h2>Type Summary</h2>

      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Purpose</th>
            <th>Commonly Used</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>StateRefStore&lt;S&gt;</code></td>
            <td>Proxy store type</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td><code>Watch&lt;V&gt;</code></td>
            <td>Watch function type</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td><code>Renew&lt;G&gt;</code></td>
            <td>Subscription callback type</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td><code>ManualSyncStore&lt;V&gt;</code></td>
            <td>Manual sync store type</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td><code>Copyable&lt;T&gt;</code></td>
            <td>Copyable wrapper type</td>
            <td>Sometimes</td>
          </tr>
          <tr>
            <td><code>StateRefsTuple&lt;W&gt;</code></td>
            <td>Utility for computed</td>
            <td>Rarely</td>
          </tr>
          <tr>
            <td><code>CombinedValue&lt;W&gt;</code></td>
            <td>Utility for combine</td>
            <td>Rarely</td>
          </tr>
        </tbody>
      </table>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/api/core">Core API</a> - createStore, createComputed, combineWatch
        </li>
        <li>
          <a href="#/api/helpers">Helper API</a> - lens, copyable, cloneDeep
        </li>
        <li>
          <a href="#/guide/subscription">Subscription Guide</a> - Understanding Renew callbacks
        </li>
      </ul>
    </div>
  );
});
