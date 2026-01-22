import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const StateRefStore = mount(() => {
  return () => (
    <div>
      <h1>StateRefStore</h1>

      <p>
        <code>StateRefStore</code> is the proxied reference type returned by the <code>watch()</code> function.
        It wraps your state with a Proxy that enables reactive tracking and provides access to values
        through the <code>.value</code> property.
      </p>

      <h2>The .value Property</h2>

      <p>
        All state access in StateRef happens through the <code>.value</code> property.
        This is the fundamental interface for both reading and writing state:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });
const store = watch();

// Read values via .value
const currentCount = store.count.value;      // 0
const currentName = store.name.value;        // 'StateRef'

// Write values via .value
store.count.value = 10;
store.name.value = 'Updated';

console.log(store.count.value);  // 10`}
      />

      <h2>Proxy-Based Reactivity</h2>

      <p>
        StateRefStore uses JavaScript Proxies to intercept property access.
        When you access a property, you get another proxy wrapping that nested value:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: {
    profile: {
      name: 'John',
      age: 30
    }
  }
});

const store = watch();

// Each property access returns a proxy
console.log(store);              // Proxy wrapping entire state
console.log(store.user);         // Proxy wrapping user object
console.log(store.user.profile); // Proxy wrapping profile object

// Only .value gives you the actual value
console.log(store.user.profile.name.value);  // 'John' (actual string)`}
      />

      <h2>Deep Nested Access</h2>

      <p>
        StateRefStore supports arbitrarily deep nesting. Each level returns a new proxy,
        allowing natural chained property access:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  company: {
    departments: {
      engineering: {
        teams: {
          frontend: {
            members: ['Alice', 'Bob']
          }
        }
      }
    }
  }
});

const store = watch();

// Deep nested read
const members = store.company.departments.engineering.teams.frontend.members.value;
console.log(members);  // ['Alice', 'Bob']

// Deep nested write
store.company.departments.engineering.teams.frontend.members.value = [
  'Alice', 'Bob', 'Charlie'
];`}
      />

      <h2>Working with Objects</h2>

      <p>
        When working with object properties, you can update individual fields or replace entire objects:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: {
    name: 'John',
    age: 30,
    email: 'john@example.com'
  }
});

const store = watch();

// Update individual properties
store.user.name.value = 'Jane';
store.user.age.value = 31;

// Replace entire object
store.user.value = {
  name: 'Bob',
  age: 25,
  email: 'bob@example.com'
};`}
      />

      <h2>Working with Arrays</h2>

      <p>
        Arrays work seamlessly with StateRefStore, supporting both index access and array replacement:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  todos: [
    { id: 1, text: 'Learn StateRef', done: false },
    { id: 2, text: 'Build app', done: false }
  ]
});

const store = watch();

// Access array elements by index
console.log(store.todos[0].text.value);  // 'Learn StateRef'

// Update array element properties
store.todos[0].done.value = true;

// Update entire array element
store.todos[1].value = { id: 2, text: 'Build amazing app', done: true };

// Replace entire array (creates new reference)
store.todos.value = [
  { id: 1, text: 'New task', done: false }
];

// Array methods work on .value
const currentTodos = store.todos.value;
currentTodos.push({ id: 3, text: 'Deploy', done: false });
store.todos.value = [...currentTodos];  // Trigger update`}
      />

      <h2>Copy-on-Write Semantics</h2>

      <p>
        StateRef uses copy-on-write to maintain immutability. When you update a nested property,
        only the path to that property is copied, sharing unchanged subtrees:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  a: { b: { c: 1 }, d: 2 },
  e: 3
});

const store = watch();

// Save original references
const originalA = store.a.value;
const originalB = store.a.b.value;

// Update deeply nested value
store.a.b.c.value = 10;

// Path to the change has new references
console.log(store.a.value === originalA);      // false (new reference)
console.log(store.a.b.value === originalB);    // false (new reference)

// Unchanged branches keep their references
const originalE = store.e.value;
console.log(store.e.value === originalE);      // true (same reference)`}
      />

      <h2>Primitive Types</h2>

      <p>
        StateRefStore also works with primitive types (number, string, boolean).
        For primitives, the store itself has a <code>.value</code> property:
      </p>

      <CodeBlock
        language="typescript"
        code={`// Number store
const countWatch = createStore(0);
const count = countWatch();
console.log(count.value);  // 0
count.value = 10;
console.log(count.value);  // 10

// String store
const nameWatch = createStore('StateRef');
const name = nameWatch();
console.log(name.value);   // 'StateRef'
name.value = 'Updated';

// Boolean store
const toggleWatch = createStore(false);
const toggle = toggleWatch();
console.log(toggle.value);  // false
toggle.value = true;`}
      />

      <h2>Type Safety with TypeScript</h2>

      <p>
        StateRefStore is fully typed with TypeScript, providing autocomplete and type checking:
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

const store = watch();

// TypeScript knows the structure
store.name.value = 'Jane';         // ✓ OK
store.email.value = 'jane@...';    // ✓ OK

store.age.value = 30;               // ✗ Error: Property 'age' does not exist
store.name.value = 123;             // ✗ Error: Type 'number' is not assignable to 'string'

// Type inference works
const userName: string = store.name.value;  // ✓ Correctly inferred as string
const userId: number = store.id.value;      // ✓ Correctly inferred as number`}
      />

      <h2>Reading Without .value</h2>

      <p>
        If you access a property without <code>.value</code>, you get the proxy itself, not the actual value:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 10 });
const store = watch();

// Without .value - returns proxy
const countProxy = store.count;
console.log(countProxy);        // Proxy object

// With .value - returns actual value
const countValue = store.count.value;
console.log(countValue);        // 10

// Common mistake
if (store.count === 10) {       // ✗ Wrong: comparing proxy to number
  // This won't work as expected
}

// Correct way
if (store.count.value === 10) { // ✓ Correct: comparing value to number
  // This works
}`}
      />

      <h2>Reference Equality</h2>

      <p>
        StateRefStore maintains reference equality for unchanged objects,
        which is crucial for optimization in UI frameworks:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: { name: 'John' },
  settings: { theme: 'dark' }
});

const store = watch();

// Save references
const userRef1 = store.user.value;
const settingsRef1 = store.settings.value;

// Update settings
store.settings.theme.value = 'light';

// Get references again
const userRef2 = store.user.value;
const settingsRef2 = store.settings.value;

// User unchanged - same reference
console.log(userRef1 === userRef2);      // true

// Settings changed - new reference
console.log(settingsRef1 === settingsRef2);  // false`}
      />

      <h2>Common Patterns</h2>

      <h3>Conditional Updates</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0, max: 10 });
const store = watch();

const increment = () => {
  if (store.count.value < store.max.value) {
    store.count.value += 1;
  }
};`}
      />

      <h3>Batch Updates</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: { name: '', email: '', age: 0 }
});
const store = watch();

// Individual updates (triggers subscription for each)
store.user.name.value = 'John';
store.user.email.value = 'john@example.com';
store.user.age.value = 30;

// Better: Single update (triggers subscription once)
store.user.value = {
  name: 'John',
  email: 'john@example.com',
  age: 30
};`}
      />

      <h3>Reading for Computation</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  width: 10,
  height: 20
});
const store = watch();

// Compute derived value
const area = store.width.value * store.height.value;
console.log(area);  // 200

// Update and recompute
store.width.value = 15;
const newArea = store.width.value * store.height.value;
console.log(newArea);  // 300`}
      />

      <h2>Performance Considerations</h2>

      <ul>
        <li>
          <strong>Proxy overhead is minimal</strong> - Modern JavaScript engines optimize proxy access well
        </li>
        <li>
          <strong>Copy-on-write is efficient</strong> - Only changed paths are copied, unchanged data is shared
        </li>
        <li>
          <strong>Reference equality enables optimization</strong> - UI frameworks can skip rendering unchanged subtrees
        </li>
        <li>
          <strong>Batch updates when possible</strong> - Update entire objects instead of individual properties to reduce subscription triggers
        </li>
      </ul>

      <h2>Best Practices</h2>

      <ul>
        <li>
          <strong>Always use .value for actual values</strong> - Remember that property access without .value returns a proxy
        </li>
        <li>
          <strong>Prefer immutable updates</strong> - Replace objects/arrays rather than mutating them when possible
        </li>
        <li>
          <strong>Leverage reference equality</strong> - Use strict equality checks for optimization
        </li>
        <li>
          <strong>Type your stores</strong> - Use TypeScript interfaces for better type safety and autocomplete
        </li>
        <li>
          <strong>Batch related updates</strong> - Update entire objects to minimize subscription triggers
        </li>
      </ul>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/create-store">createStore</a> - Creating stores that return StateRefStore references
        </li>
        <li>
          <a href="#/guide/watch">Watch Function</a> - Getting StateRefStore references via watch
        </li>
        <li>
          <a href="#/guide/references">Understanding References</a> - How StateRefStore references work with tracking
        </li>
        <li>
          <a href="#/guide/primitives">Primitive Types</a> - Working with primitive type stores
        </li>
      </ul>
    </div>
  );
});
