import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Subscription = mount(() => {
  return () => (
    <div>
      <h1>Subscription</h1>

      <p>
        Subscriptions in StateRef allow you to react to state changes automatically.
        When you pass a callback to the <code>watch()</code> function, it creates a subscription
        that runs whenever tracked properties change.
      </p>

      <h2>Basic Subscription</h2>

      <p>
        Create a subscription by passing a callback function to <code>watch()</code>:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });

// Subscribe to changes
watch((store, isFirst) => {
  console.log('State changed!');
  console.log('Count:', store.count.value);
  console.log('Name:', store.name.value);
  console.log('Is first run?', isFirst);
});

// Trigger the subscription
const ref = watch();
ref.count.value = 10;  // Logs all the values above`}
      />

      <h2>Subscription Callback Signature</h2>

      <p>
        The subscription callback receives two parameters and can optionally return an <code>AbortSignal</code>:
      </p>

      <CodeBlock
        language="typescript"
        code={`type RenewCallback<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => void | AbortSignal;

// Example usage
watch((store, isFirst) => {
  // store: StateRefStore - the tracked reference
  // isFirst: boolean - true on first execution, false on updates

  console.log(store.count.value);

  // Optionally return AbortSignal for cleanup
  return abortController.signal;
});`}
      />

      <h2>The isFirst Parameter</h2>

      <p>
        The <code>isFirst</code> parameter indicates whether this is the initial execution
        or a subsequent update. This is useful for setup logic:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ userId: null, data: null });

watch((store, isFirst) => {
  if (isFirst) {
    // Runs only once on initial subscription
    console.log('Subscription initialized');
    return;
  }

  // Runs on every update
  if (store.userId.value) {
    console.log('Fetching data for user:', store.userId.value);
    fetchUserData(store.userId.value);
  }
});`}
      />

      <h3>Common isFirst Patterns</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ items: [] });

// Pattern 1: Skip initial run
watch((store, isFirst) => {
  if (isFirst) return;
  console.log('Items updated:', store.items.value);
});

// Pattern 2: Different logic for initial vs updates
watch((store, isFirst) => {
  if (isFirst) {
    console.log('Initial items:', store.items.value);
  } else {
    console.log('Items changed to:', store.items.value);
  }
});

// Pattern 3: Run on both, but with conditional logic
watch((store, isFirst) => {
  console.log(isFirst ? 'Loading items' : 'Reloading items');
  loadItems(store.items.value);
});`}
      />

      <h2>Unsubscribing with AbortController</h2>

      <p>
        Use <code>AbortController</code> to cancel subscriptions when they're no longer needed:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });
const controller = new AbortController();

// Return the abort signal from the callback
watch((store) => {
  console.log('Count:', store.count.value);
  return controller.signal;
});

const ref = watch();
ref.count.value = 1;  // ✓ Triggers subscription

// Cancel the subscription
controller.abort();

ref.count.value = 2;  // ✗ Does NOT trigger (unsubscribed)`}
      />

      <h3>Component Cleanup Pattern</h3>

      <CodeBlock
        language="typescript"
        code={`const Component = () => {
  const controller = new AbortController();

  // Subscribe with cleanup
  const store = appWatch((innerRef) => {
    console.log('Component state:', innerRef.value);
    return controller.signal;
  });

  // Cleanup on component unmount
  onUnmount(() => {
    controller.abort();
  });

  return <div>{store.value}</div>;
};`}
      />

      <h2>Multiple Subscriptions</h2>

      <p>
        You can create multiple independent subscriptions to the same store.
        Each subscription tracks only the properties it accesses:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  count: 0,
  name: 'StateRef',
  theme: 'dark'
});

// Subscription 1: tracks count
const controller1 = new AbortController();
watch((store) => {
  console.log('Count subscription:', store.count.value);
  return controller1.signal;
});

// Subscription 2: tracks name
const controller2 = new AbortController();
watch((store) => {
  console.log('Name subscription:', store.name.value);
  return controller2.signal;
});

// Subscription 3: tracks count and theme
const controller3 = new AbortController();
watch((store) => {
  console.log('Multi subscription:', store.count.value, store.theme.value);
  return controller3.signal;
});

const ref = watch();

ref.count.value = 10;   // Triggers subscriptions 1 and 3
ref.name.value = 'New'; // Triggers subscription 2 only
ref.theme.value = 'light'; // Triggers subscription 3 only`}
      />

      <h2>Subscription Lifecycle</h2>

      <p>
        Understanding the subscription lifecycle helps prevent memory leaks and unexpected behavior:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });

// 1. Subscription created
const controller = new AbortController();

const trackedRef = watch((store, isFirst) => {
  // 2. Callback executed immediately (isFirst = true)
  console.log('Subscription running, isFirst:', isFirst);
  console.log('Count:', store.count.value);

  // 3. Return signal for cleanup
  return controller.signal;
});

// 4. State changes trigger the callback (isFirst = false)
trackedRef.count.value = 10;

// 5. Abort signal cancels the subscription
controller.abort();

// 6. Subscription is cleaned up, no more callbacks
trackedRef.count.value = 20;  // No callback triggered`}
      />

      <h2>Selective Property Tracking</h2>

      <p>
        Subscriptions only react to properties that were READ via tracked references
        (innerRef/outerRef) during the callback:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'en' }
});

const unboundRef = watch();

watch((store) => {
  // Only user.name is tracked (read via tracked ref)
  console.log('Name:', store.user.name.value);

  // settings.theme is NOT tracked (read via unbound ref)
  console.log('Theme:', unboundRef.settings.theme.value);
});

const ref = watch();

ref.user.name.value = 'Jane';        // ✓ Triggers subscription
ref.user.age.value = 31;             // ✗ Does NOT trigger (age not accessed)
ref.settings.theme.value = 'light';  // ✗ Does NOT trigger (read via unbound ref)`}
      />

      <h2>Derived State Pattern</h2>

      <p>
        Use subscriptions to compute derived state that depends on multiple properties:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  firstName: 'John',
  lastName: 'Doe',
  fullName: ''
});

// Update fullName whenever firstName or lastName changes
watch((store, isFirst) => {
  const fullName = \`\${store.firstName.value} \${store.lastName.value}\`;

  // Avoid infinite loop by checking if value actually changed
  if (store.fullName.value !== fullName) {
    store.fullName.value = fullName;
  }
});

const ref = watch();
ref.firstName.value = 'Jane';
// fullName automatically updated to "Jane Doe"`}
      />

      <h2>Side Effects Pattern</h2>

      <p>
        Subscriptions are perfect for side effects like API calls, logging, or analytics:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ searchQuery: '', results: [] });

watch((store, isFirst) => {
  if (isFirst) return; // Skip initial run

  const query = store.searchQuery.value;

  if (query.length > 2) {
    // Trigger API call when search query changes
    fetch(\`/api/search?q=\${query}\`)
      .then(res => res.json())
      .then(data => {
        store.results.value = data;
      });
  }
});`}
      />

      <h3>Debouncing Pattern</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ searchQuery: '' });

watch((store, isFirst) => {
  if (isFirst) return;

  let timeoutId: NodeJS.Timeout;

  // Debounce the API call
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    console.log('Searching for:', store.searchQuery.value);
    performSearch(store.searchQuery.value);
  }, 300);

  // Note: In a real app, you'd need to manage cleanup
  // of the timeout via AbortSignal or component lifecycle
});`}
      />

      <h2>Conditional Subscriptions</h2>

      <p>
        You can create subscriptions conditionally based on application state:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  isLoggedIn: false,
  userId: null,
  userData: null
});

let userDataSubscription: AbortController | null = null;

// Subscribe to user state changes only when logged in
watch((store, isFirst) => {
  if (store.isLoggedIn.value) {
    // User logged in - create subscription
    if (!userDataSubscription) {
      userDataSubscription = new AbortController();

      watch((innerStore) => {
        fetchUserData(innerStore.userId.value);
        return userDataSubscription!.signal;
      });
    }
  } else {
    // User logged out - cancel subscription
    if (userDataSubscription) {
      userDataSubscription.abort();
      userDataSubscription = null;
    }
  }
});`}
      />

      <h2>Subscription Performance</h2>

      <p>
        Keep subscriptions efficient by following these guidelines:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ items: [], filter: '', sort: 'asc' });

// ✗ Bad: Doing expensive work on every change
watch((store) => {
  const filtered = store.items.value
    .filter(item => item.name.includes(store.filter.value))
    .sort((a, b) => store.sort.value === 'asc' ? a.id - b.id : b.id - a.id);

  // This runs on EVERY change, even if items didn't change
  console.log(filtered);
});

// ✓ Good: Use createComputed for expensive derived state
import { createComputed } from 'state-ref';

const filteredWatch = createComputed([watch], ([store]) => {
  return store.items.value
    .filter(item => item.name.includes(store.filter.value))
    .sort((a, b) => store.sort.value === 'asc' ? a.id - b.id : b.id - a.id);
});`}
      />

      <h2>Best Practices</h2>

      <ul>
        <li>
          <strong>Always clean up subscriptions</strong> - Use AbortController to prevent memory leaks
        </li>
        <li>
          <strong>Use isFirst for initialization</strong> - Distinguish setup from updates
        </li>
        <li>
          <strong>Keep callbacks focused</strong> - Each subscription should have a single responsibility
        </li>
        <li>
          <strong>Avoid infinite loops</strong> - Don't update tracked properties without checking if values changed
        </li>
        <li>
          <strong>Be mindful of what you track</strong> - Only read properties you actually need to react to
        </li>
        <li>
          <strong>Use createComputed for derived state</strong> - More efficient than manual subscriptions
        </li>
        <li>
          <strong>Debounce expensive operations</strong> - Don't perform heavy work on every update
        </li>
      </ul>

      <h2>Common Pitfalls</h2>

      <h3>Infinite Loop</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });

// ✗ Bad: Creates infinite loop
watch((store) => {
  store.count.value += 1;  // Updates count, triggers subscription again
});

// ✓ Good: Use conditional logic
watch((store, isFirst) => {
  if (!isFirst && store.count.value < 10) {
    store.count.value += 1;
  }
});`}
      />

      <h3>Forgotten Cleanup</h3>

      <CodeBlock
        language="typescript"
        code={`// ✗ Bad: No cleanup
const Component = () => {
  watch((store) => {
    console.log(store.value);
    // Subscription never cleaned up - memory leak!
  });
};

// ✓ Good: Always clean up
const Component = () => {
  const controller = new AbortController();

  watch((store) => {
    console.log(store.value);
    return controller.signal;
  });

  onUnmount(() => controller.abort());
};`}
      />

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/watch">Watch Function</a> - Understanding the watch function
        </li>
        <li>
          <a href="#/guide/references">Understanding References</a> - How tracking works
        </li>
        <li>
          <a href="#/guide/computed">createComputed</a> - Efficient derived state
        </li>
        <li>
          <a href="#/guide/combine-watch">combineWatch</a> - Combining multiple subscriptions
        </li>
      </ul>
    </div>
  );
});
