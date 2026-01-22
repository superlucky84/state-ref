import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const CreateStore = mount(() => {
  return () => (
    <div>
      <h1>createStore</h1>

      <p>
        The <code>createStore</code> function is the primary way to create a reactive state store in StateRef.
        It accepts an initial value and returns a <code>watch</code> function that you use to access and subscribe to the state.
      </p>

      <h2>Basic Usage</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

// Create a store with an initial value
const watch = createStore({ count: 0, name: 'StateRef' });`}
      />

      <h2>Syntax</h2>

      <CodeBlock
        language="typescript"
        code={`createStore<T>(initialValue: T): Watch<T>`}
      />

      <h3>Parameters</h3>

      <ul>
        <li>
          <code>initialValue</code> - The initial state value. Can be any type: object, array, primitive, etc.
        </li>
      </ul>

      <h3>Returns</h3>

      <p>
        Returns a <code>Watch</code> function that serves dual purposes:
      </p>

      <ul>
        <li>
          <strong>Without arguments</strong>: Returns a <code>StateRefStore</code> reference for reading/writing values
        </li>
        <li>
          <strong>With callback</strong>: Subscribes to changes and returns a tracked <code>StateRefStore</code> reference
        </li>
      </ul>

      <h2>Creating Object Stores</h2>

      <p>
        Object stores are the most common use case. They allow you to manage complex nested state:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: {
    name: 'John',
    age: 30,
    settings: {
      theme: 'dark',
      notifications: true
    }
  },
  todos: [
    { id: 1, text: 'Learn StateRef', done: false },
    { id: 2, text: 'Build app', done: false }
  ]
});

// Access nested values
const store = watch();
console.log(store.user.name.value); // 'John'
console.log(store.todos[0].text.value); // 'Learn StateRef'

// Update nested values
store.user.settings.theme.value = 'light';
store.todos[0].done.value = true;`}
      />

      <h2>Creating Primitive Stores</h2>

      <p>
        StateRef also works seamlessly with primitive types like numbers, strings, and booleans:
      </p>

      <CodeBlock
        language="typescript"
        code={`// Number store
const countWatch = createStore(0);
const count = countWatch();
count.value = 10;

// String store
const nameWatch = createStore('StateRef');
const name = nameWatch();
name.value = 'Updated Name';

// Boolean store
const toggleWatch = createStore(false);
const toggle = toggleWatch();
toggle.value = true;`}
      />

      <h2>TypeScript Type Inference</h2>

      <p>
        StateRef provides full TypeScript support with automatic type inference:
      </p>

      <CodeBlock
        language="typescript"
        code={`// Type is inferred from initial value
const watch = createStore({ count: 0 });
// watch: Watch<{ count: number }>

// Explicit type annotation
const watch = createStore<{ count: number }>({ count: 0 });

// Generic type
interface User {
  id: number;
  name: string;
  email: string;
}

const userWatch = createStore<User>({
  id: 1,
  name: 'John',
  email: 'john@example.com'
});`}
      />

      <h2>Using the Returned Watch Function</h2>

      <p>
        The <code>watch</code> function returned by <code>createStore</code> is the core interface for your store:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });

// Get a reference without subscribing
const store = watch();
store.count.value = 10;

// Subscribe to changes
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('Is first run?', isFirst);
});

// Both forms can be used together
const trackedStore = watch((store) => {
  console.log('Count changed:', store.count.value);
});

// This update triggers the subscription
trackedStore.count.value = 20;`}
      />

      <h2>Auto-sync Mode</h2>

      <p>
        By default, <code>createStore</code> operates in <strong>auto-sync</strong> mode,
        which means changes immediately trigger subscriptions:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0 });

watch((store) => {
  console.log('Count:', store.count.value);
});

const store = watch();
store.count.value = 1; // ✓ Immediately triggers subscription
store.count.value = 2; // ✓ Immediately triggers subscription`}
      />

      <p>
        For manual control over when updates propagate, see <a href="#/guide/manual-sync">Manual Sync (Flux)</a>.
      </p>

      <h2>Working with Arrays</h2>

      <p>
        Arrays are fully supported with copy-on-write semantics:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  items: [1, 2, 3, 4, 5]
});

const store = watch();

// Access array elements
console.log(store.items[0].value); // 1

// Update array elements
store.items[0].value = 10;

// Replace entire array (creates new reference)
store.items.value = [10, 20, 30];

// Array methods work on .value
store.items.value.push(40);
store.items.value = [...store.items.value]; // Trigger update`}
      />

      <h2>Best Practices</h2>

      <ul>
        <li>
          <strong>Keep stores focused</strong> - Create separate stores for different domains of your application
        </li>
        <li>
          <strong>Use TypeScript</strong> - Type your stores for better IDE support and type safety
        </li>
        <li>
          <strong>Initialize with complete state</strong> - Provide all properties in the initial value to ensure proper type inference
        </li>
        <li>
          <strong>Don't create stores in render functions</strong> - Create stores at the module level or in hooks
        </li>
      </ul>

      <h2>Common Patterns</h2>

      <h3>Single Store Module</h3>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStore } from 'state-ref';

export const appWatch = createStore({
  user: null as User | null,
  theme: 'light' as 'light' | 'dark',
  isLoading: false
});`}
      />

      <h3>Multiple Stores</h3>

      <CodeBlock
        language="typescript"
        code={`// stores/user.ts
export const userWatch = createStore<User | null>(null);

// stores/settings.ts
export const settingsWatch = createStore({
  theme: 'light',
  language: 'en'
});

// stores/todos.ts
export const todosWatch = createStore<Todo[]>([]);`}
      />

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/watch">Watch Function</a> - Understanding the watch function
        </li>
        <li>
          <a href="#/guide/state-ref-store">StateRefStore</a> - Working with store references
        </li>
        <li>
          <a href="#/guide/manual-sync">Manual Sync</a> - createStoreManualSync for Flux-like patterns
        </li>
      </ul>
    </div>
  );
});
