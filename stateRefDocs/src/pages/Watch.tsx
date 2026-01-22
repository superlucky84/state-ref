import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Watch = mount(() => {
  return () => (
    <div>
      <h1>Watch Function</h1>

      <p>
        The <code>watch</code> function is the core interface returned by <code>createStore()</code>.
        It serves dual purposes: accessing state references and subscribing to state changes.
      </p>

      <h2>Overview</h2>

      <p>
        When you call <code>createStore()</code>, it returns a <code>watch</code> function that can be used in two ways:
      </p>

      <ul>
        <li>
          <strong>Without arguments</strong>: Returns a <code>StateRefStore</code> reference for reading/writing values
        </li>
        <li>
          <strong>With a callback</strong>: Subscribes to changes and returns a tracked <code>StateRefStore</code> reference
        </li>
      </ul>

      <h2>Basic Usage</h2>

      <h3>Getting a Reference (No Subscription)</h3>

      <p>
        Call <code>watch()</code> without arguments to get a reference for reading and writing state:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });

// Get a reference without subscribing
const store = watch();

// Read values
console.log(store.count.value); // 0
console.log(store.name.value);  // 'StateRef'

// Write values
store.count.value = 10;
store.name.value = 'Updated';`}
      />

      <h3>Subscribing to Changes</h3>

      <p>
        Call <code>watch()</code> with a callback function to subscribe to state changes:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });

// Subscribe to changes
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('Is first run?', isFirst);
});

// Updates will trigger the callback
const store = watch();
store.count.value = 1; // Logs: "Count: 1" and "Is first run? false"`}
      />

      <h2>Callback Signature</h2>

      <p>
        The subscription callback receives two parameters:
      </p>

      <CodeBlock
        language="typescript"
        code={`type RenewCallback<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => void | AbortSignal;`}
      />

      <h3>Parameters</h3>

      <ul>
        <li>
          <code>store</code> - The <code>StateRefStore</code> reference (innerRef) that is automatically tracked
        </li>
        <li>
          <code>isFirst</code> - Boolean indicating if this is the first execution of the callback
        </li>
      </ul>

      <h3>Return Value</h3>

      <p>
        The callback can optionally return an <code>AbortSignal</code> to unsubscribe when the signal is aborted.
      </p>

      <h2>Understanding isFirst Parameter</h2>

      <p>
        The <code>isFirst</code> parameter helps distinguish between the initial callback execution
        and subsequent updates:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });

watch((store, isFirst) => {
  if (isFirst) {
    console.log('Initial setup, count:', store.count.value);
  } else {
    console.log('Count updated to:', store.count.value);
  }
});

// Output: "Initial setup, count: 0"

const store = watch();
store.count.value = 5;
// Output: "Count updated to: 5"`}
      />

      <h2>InnerRef vs OuterRef</h2>

      <p>
        Understanding innerRef and outerRef is crucial: they are <strong>the same reference</strong>,
        both bound to the subscription. What matters is <strong>which reference you use to READ properties</strong>
        during the callback.
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ x: 1, y: 2 });

const anotherRef = watch();  // Unbound reference

// The callback receives innerRef
const outerRef = watch((innerRef, isFirst) => {
  // Reading x via innerRef → x is TRACKED
  console.log('x changed:', innerRef.x.value);

  // Reading y via unbound ref → y is NOT tracked
  console.log('y value:', anotherRef.y.value);
});

// Both trigger the callback (x was READ via innerRef)
outerRef.x.value = 10;
// ✓ Logs: "x changed: 10"

anotherRef.x.value = 20;
// ✓ Logs: "x changed: 20" (x is tracked!)

// Neither triggers the callback (y was READ via unbound ref)
outerRef.y.value = 10;    // ✗ Does NOT trigger
anotherRef.y.value = 20;  // ✗ Does NOT trigger`}
      />

      <p>
        <strong>Key principle</strong>: Tracking is based on which reference was used to READ
        the property during subscription, not which reference is used to WRITE it later.
      </p>

      <h2>Unsubscribing with AbortController</h2>

      <p>
        Use <code>AbortController</code> to cancel subscriptions:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });
const controller = new AbortController();

// Return the abort signal from the callback
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  return controller.signal;
});

const store = watch();
store.count.value = 1; // ✓ Triggers callback

// Cancel subscription
controller.abort();

store.count.value = 2; // ✗ Does NOT trigger callback (unsubscribed)`}
      />

      <h2>Multiple Subscriptions</h2>

      <p>
        You can create multiple independent subscriptions to the same store:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });

// First subscription
const ref1 = watch((store) => {
  console.log('Subscription 1:', store.count.value);
});

// Second subscription
const ref2 = watch((store) => {
  console.log('Subscription 2:', store.count.value);
});

// Both subscriptions are independent
ref1.count.value = 10;
// Output:
// "Subscription 1: 10"

ref2.count.value = 20;
// Output:
// "Subscription 2: 20"`}
      />

      <h2>Combining Reference Access and Subscription</h2>

      <p>
        The subscription callback returns a tracked reference, which you can use immediately:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0, name: 'StateRef' });

// Subscribe and get the tracked reference
const trackedStore = watch((store) => {
  console.log('State changed:', store.count.value);
});

// Also get an untracked reference for other operations
const untrackedStore = watch();

// Update via tracked reference - triggers callback
trackedStore.count.value = 5;
// ✓ Logs: "State changed: 5"

// Update via untracked reference - does NOT trigger callback
untrackedStore.count.value = 10;
// ✗ Does NOT log anything`}
      />

      <h2>Selective Property Tracking</h2>

      <p>
        Subscriptions only track properties that are accessed within the callback:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ x: 1, y: 2, z: 3 });

const store = watch((innerRef) => {
  // Only accessing x, so only x changes trigger this callback
  console.log('x changed:', innerRef.x.value);
});

store.x.value = 10; // ✓ Triggers callback
store.y.value = 20; // ✗ Does NOT trigger (y was never accessed)
store.z.value = 30; // ✗ Does NOT trigger (z was never accessed)`}
      />

      <h2>Common Patterns</h2>

      <h3>Component Integration</h3>

      <CodeBlock
        language="typescript"
        code={`// In a UI framework component
const MyComponent = () => {
  const store = appWatch((innerRef) => {
    // This triggers re-render when count changes
    console.log('Count updated:', innerRef.count.value);

    // Return component's cleanup signal
    return cleanupSignal;
  });

  return <div>{store.count.value}</div>;
};`}
      />

      <h3>Derived State</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ firstName: 'John', lastName: 'Doe' });

watch((store) => {
  const fullName = \`\${store.firstName.value} \${store.lastName.value}\`;
  console.log('Full name:', fullName);
});

const store = watch();
store.firstName.value = 'Jane';
// Logs: "Full name: Jane Doe"`}
      />

      <h3>Side Effects</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ userId: null });

watch((store, isFirst) => {
  if (!isFirst && store.userId.value) {
    // Fetch user data when userId changes
    fetchUserData(store.userId.value);
  }
});`}
      />

      <h2>Best Practices</h2>

      <ul>
        <li>
          <strong>Use isFirst for initialization</strong> - Distinguish setup logic from update logic
        </li>
        <li>
          <strong>Return AbortSignal for cleanup</strong> - Always clean up subscriptions in components
        </li>
        <li>
          <strong>Be mindful of tracking</strong> - Only the outerRef (returned by subscription) is tracked
        </li>
        <li>
          <strong>Access only needed properties</strong> - Subscriptions track only accessed properties
        </li>
        <li>
          <strong>Avoid creating references in loops</strong> - Create watch references at module or component level
        </li>
      </ul>

      <h2>Type Safety</h2>

      <p>
        The watch function is fully typed with TypeScript:
      </p>

      <CodeBlock
        language="typescript"
        code={`interface User {
  id: number;
  name: string;
  email: string;
}

const watch = createStore<User>({
  id: 1,
  name: 'John',
  email: 'john@example.com'
});

// Type-safe reference access
const store = watch();
store.name.value = 'Jane';      // ✓ OK
store.age.value = 30;            // ✗ Error: Property 'age' does not exist

// Type-safe subscription
watch((innerRef) => {
  const name: string = innerRef.name.value;  // ✓ Type inferred correctly
  const id: number = innerRef.id.value;      // ✓ Type inferred correctly
});`}
      />

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/create-store">createStore</a> - Creating stores that return watch functions
        </li>
        <li>
          <a href="#/guide/references">Understanding References</a> - Deep dive into innerRef, outerRef, and unbound references
        </li>
        <li>
          <a href="#/guide/subscription">Subscription</a> - Advanced subscription patterns
        </li>
        <li>
          <a href="#/guide/state-ref-store">StateRefStore</a> - Working with store references
        </li>
      </ul>
    </div>
  );
});
