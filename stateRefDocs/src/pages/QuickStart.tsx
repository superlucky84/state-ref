import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const QuickStart = mount(() => {
  return () => (
    <div>
      <h1>Quick Start</h1>

      <p>
        This guide will help you get started with StateRef in just a few minutes.
        You'll learn how to create a store, subscribe to changes, and update values.
      </p>

      <h2>Installation</h2>

      <p>First, install the core library:</p>

      <CodeBlock
        language="bash"
        code={`$ npm install state-ref`}
      />

      <h2>Creating Your First Store</h2>

      <p>
        Use <code>createStore()</code> to create a reactive store with an initial value:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

// Create a store with an object
const watch = createStore({ count: 0, name: 'StateRef' });

// Or with a primitive value
const numberWatch = createStore(42);`}
      />

      <h2>Reading and Writing Values</h2>

      <p>
        Access and modify values using the <code>.value</code> property:
      </p>

      <CodeBlock
        language="typescript"
        code={`// Get a reference to the store
const store = watch();

// Read values
console.log(store.count.value); // 0

// Write values
store.count.value = 10;
store.name.value = 'Updated';`}
      />

      <h2>Subscribing to Changes</h2>

      <p>
        Pass a callback function to <code>watch()</code> to subscribe to state changes.
        The callback receives the store reference and an <code>isFirst</code> flag:
      </p>

      <CodeBlock
        language="typescript"
        code={`watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('Is first run?', isFirst);
  // First run: Count: 0, Is first run? true
});

// Update triggers the callback
const store = watch();
store.count.value = 5;
// Logs: Count: 5, Is first run? false`}
      />

      <h2>Understanding References</h2>

      <p>
        The <code>watch</code> function returns the same reference whether called with
        or without a callback. Both the returned reference (<code>outerRef</code>) and
        the callback argument (<code>innerRef</code>) track dependencies:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ x: 1, y: 2 });

// Subscribe and get a tracked reference
const outerRef = watch((innerRef, isFirst) => {
  // innerRef and outerRef are the same reference
  console.log(innerRef.x.value);
});

// Both trigger the subscription
outerRef.x.value = 10;  // ✓ Triggers callback
innerRef.x.value = 20;  // ✓ Triggers callback

// Untracked reference
const anotherRef = watch();
anotherRef.y.value = 5;  // ✗ Does NOT trigger callback`}
      />

      <h3>Key Points</h3>

      <ul>
        <li>Only values accessed through a <strong>subscribed reference</strong> trigger updates</li>
        <li>Both <code>innerRef</code> and <code>outerRef</code> are tracked when created with a callback</li>
        <li>References created without a callback are <strong>not tracked</strong></li>
      </ul>

      <h2>Canceling Subscriptions</h2>

      <p>
        Use <code>AbortController</code> to unsubscribe from changes:
      </p>

      <CodeBlock
        language="typescript"
        code={`const abortController = new AbortController();

watch((store) => {
  console.log('Count:', store.count.value);
  return abortController.signal;
});

// Later, cancel the subscription
abortController.abort();`}
      />

      <h2>Working with Primitive Types</h2>

      <p>
        StateRef works seamlessly with primitive types like numbers and strings:
      </p>

      <CodeBlock
        language="typescript"
        code={`const numberWatch = createStore(100);

numberWatch((store) => {
  console.log('Number:', store.value);
});

const numStore = numberWatch();
numStore.value = 200; // Triggers callback`}
      />

      <h2>Next Steps</h2>

      <p>
        Now that you understand the basics, explore these topics:
      </p>

      <ul>
        <li>
          <a href="#/guide/create-store">createStore API</a> - Deep dive into store creation
        </li>
        <li>
          <a href="#/guide/watch">Watch Function</a> - Advanced watch patterns
        </li>
        <li>
          <a href="#/guide/react">React Integration</a> - Use StateRef with React
        </li>
        <li>
          <a href="#/guide/computed">createComputed</a> - Derive values from multiple stores
        </li>
      </ul>
    </div>
  );
});
