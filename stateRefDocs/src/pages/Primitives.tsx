import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Primitives = mount(() => {
  return () => (
    <div>
      <h1>Primitive Types</h1>

      <p>
        StateRef works seamlessly with primitive types like numbers, strings, and booleans.
        While object stores are more common, primitive stores are useful for simple counters,
        toggles, or any single-value state.
      </p>

      <h2>Creating Primitive Stores</h2>

      <p>
        Create a primitive store by passing a primitive value to <code>createStore()</code>:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

// Number store
const countWatch = createStore(0);

// String store
const nameWatch = createStore('StateRef');

// Boolean store
const toggleWatch = createStore(false);

// Null/undefined stores
const nullableWatch = createStore<string | null>(null);`}
      />

      <h2>Reading and Writing Values</h2>

      <p>
        For primitive stores, access the value directly via <code>.value</code> on the store reference:
      </p>

      <CodeBlock
        language="typescript"
        code={`const countWatch = createStore(100);
const count = countWatch();

// Read value
console.log(count.value);  // 100

// Write value
count.value = 200;
console.log(count.value);  // 200

// Increment
count.value += 1;
console.log(count.value);  // 201`}
      />

      <h2>Subscribing to Changes</h2>

      <p>
        Subscribe to primitive store changes just like object stores:
      </p>

      <CodeBlock
        language="typescript"
        code={`const countWatch = createStore(0);

// Subscribe to changes
countWatch((store, isFirst) => {
  console.log('Count:', store.value);
  console.log('Is first run?', isFirst);
});

// Trigger updates
const count = countWatch();
count.value = 10;  // Logs: Count: 10, Is first run? false
count.value = 20;  // Logs: Count: 20, Is first run? false`}
      />

      <h2>TypeScript Type Inference</h2>

      <p>
        TypeScript automatically infers the type from the initial value,
        or you can explicitly specify the type:
      </p>

      <CodeBlock
        language="typescript"
        code={`// Type inferred as number
const countWatch = createStore(0);

// Type inferred as string
const nameWatch = createStore('hello');

// Explicit type annotation
const scoreWatch = createStore<number>(0);

// Union types
const statusWatch = createStore<'idle' | 'loading' | 'done'>('idle');

// Nullable types
const userIdWatch = createStore<number | null>(null);`}
      />

      <h2>Comparison with Object Stores</h2>

      <p>
        The key difference between primitive and object stores is the access pattern:
      </p>

      <CodeBlock
        language="typescript"
        code={`// Object store
const objWatch = createStore({ count: 0 });
const objStore = objWatch();
console.log(objStore.count.value);  // Access nested property
objStore.count.value = 10;

// Primitive store
const primWatch = createStore(0);
const primStore = primWatch();
console.log(primStore.value);  // Access value directly
primStore.value = 10;`}
      />

      <h2>Common Use Cases</h2>

      <h3>Counter</h3>

      <CodeBlock
        language="typescript"
        code={`const countWatch = createStore(0);

const increment = () => {
  const count = countWatch();
  count.value += 1;
};

const decrement = () => {
  const count = countWatch();
  count.value -= 1;
};

const reset = () => {
  const count = countWatch();
  count.value = 0;
};`}
      />

      <h3>Toggle</h3>

      <CodeBlock
        language="typescript"
        code={`const toggleWatch = createStore(false);

const toggle = () => {
  const state = toggleWatch();
  state.value = !state.value;
};

// Subscribe to toggle changes
toggleWatch((store) => {
  console.log('Toggle is now:', store.value ? 'ON' : 'OFF');
});`}
      />

      <h3>Text Input</h3>

      <CodeBlock
        language="typescript"
        code={`const inputWatch = createStore('');

// In a component
const handleChange = (e: Event) => {
  const input = inputWatch();
  input.value = (e.target as HTMLInputElement).value;
};

// Subscribe to input changes
inputWatch((store, isFirst) => {
  const value = store.value;
  if (isFirst) return;

  console.log('Input changed to:', value);
});`}
      />

      <h3>Loading State</h3>

      <CodeBlock
        language="typescript"
        code={`const loadingWatch = createStore(false);

const fetchData = async () => {
  const loading = loadingWatch();
  loading.value = true;

  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } finally {
    loading.value = false;
  }
};`}
      />

      <h2>Using with AbortController</h2>

      <p>
        Cancel subscriptions to primitive stores using <code>AbortController</code>:
      </p>

      <CodeBlock
        language="typescript"
        code={`const countWatch = createStore(0);
const controller = new AbortController();

countWatch((store) => {
  console.log('Count:', store.value);
  return controller.signal;
});

const count = countWatch();
count.value = 1;  // Logs: Count: 1

controller.abort();

count.value = 2;  // No log (subscription cancelled)`}
      />

      <h2>Combining with createComputed</h2>

      <p>
        Primitive stores work well with <code>createComputed</code> for derived values:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore, createComputed } from 'state-ref';

const widthWatch = createStore(10);
const heightWatch = createStore(20);

// Computed area from two primitive stores
const areaWatch = createComputed(
  [widthWatch, heightWatch],
  ([width, height]) => width.value * height.value
);

// Subscribe to computed value
areaWatch((store) => {
  console.log('Area:', store.value);
});

// Update triggers computed recalculation
const width = widthWatch();
width.value = 15;  // Logs: Area: 300`}
      />

      <h2>Framework Integration</h2>

      <p>
        Primitive stores integrate with UI frameworks the same way as object stores:
      </p>

      <CodeBlock
        language="typescript"
        code={`// React example
import { connectReact } from '@stateref/connect-react';
import { createStore } from 'state-ref';

const countWatch = createStore(0);
const useCount = connectReact(countWatch);

function Counter() {
  const count = useCount();

  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
}`}
      />

      <h2>Best Practices</h2>

      <ul>
        <li>
          <strong>Use primitive stores for simple state</strong> - Counters, toggles, single values
        </li>
        <li>
          <strong>Use object stores for complex state</strong> - Multiple related values
        </li>
        <li>
          <strong>Type your stores</strong> - Especially for union types and nullable values
        </li>
        <li>
          <strong>Consider combining stores</strong> - Use <code>createComputed</code> or <code>combineWatch</code> when primitive stores need to work together
        </li>
      </ul>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/create-store">createStore</a> - Creating stores
        </li>
        <li>
          <a href="#/guide/state-ref-store">StateRefStore</a> - Working with store references
        </li>
        <li>
          <a href="#/guide/computed">createComputed</a> - Deriving values from stores
        </li>
        <li>
          <a href="#/guide/combine-watch">combineWatch</a> - Combining multiple stores
        </li>
      </ul>
    </div>
  );
});
