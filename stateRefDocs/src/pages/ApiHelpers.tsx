import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ApiHelpers = mount(() => {
  return () => (
    <div>
      <h1>Helper API</h1>

      <p>
        This page documents the helper functions exported from <code>state-ref</code>.
        These utilities assist with immutable updates and deep copying.
      </p>

      <h2>lens</h2>

      <p>
        Creates a lens for navigating and immutably updating nested data structures.
        Lenses provide a functional approach to accessing and modifying deeply nested properties.
      </p>

      <h3>Signature</h3>

      <CodeBlock
        language="typescript"
        code={`function lens<T extends object>(
  sceneList?: (string | number | symbol)[]
): Lens<T, T>`}
      />

      <h3>Parameters</h3>

      <ul>
        <li>
          <code>sceneList</code> (optional) - Initial path array for the lens. Defaults to empty array.
        </li>
      </ul>

      <h3>Returns</h3>

      <p>
        Returns a <code>Lens</code> instance with the following methods:
      </p>

      <h3>Lens Class</h3>

      <CodeBlock
        language="typescript"
        code={`class Lens<Root extends object, Focus = Root> {
  // Navigate to a nested property
  chain<K extends keyof Focus>(prop: K): Lens<Root, Focus[K]>

  // Get the focused value from an object
  get(targetObject: Root): Focus

  // Create an immutable update function
  set(value: Focus): (targetObject: Root) => Root
}`}
      />

      <h3>Methods</h3>

      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Description</th>
            <th>Returns</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>chain(prop)</code></td>
            <td>Navigate to a nested property</td>
            <td>New <code>Lens</code> focused on the property</td>
          </tr>
          <tr>
            <td><code>get(obj)</code></td>
            <td>Extract the focused value</td>
            <td>The value at the focused path</td>
          </tr>
          <tr>
            <td><code>set(value)</code></td>
            <td>Create an update function</td>
            <td>Function that returns a new object with the update</td>
          </tr>
        </tbody>
      </table>

      <h3>Example</h3>

      <CodeBlock
        language="typescript"
        code={`import { lens } from 'state-ref';

interface State {
  user: {
    profile: {
      name: string;
      age: number;
    };
    settings: {
      theme: string;
    };
  };
}

const state: State = {
  user: {
    profile: { name: 'John', age: 30 },
    settings: { theme: 'dark' }
  }
};

// Create a lens and navigate to nested property
const nameLens = lens<State>().chain('user').chain('profile').chain('name');

// Get the value
console.log(nameLens.get(state));  // 'John'

// Set the value (returns new object, original unchanged)
const newState = nameLens.set('Jane')(state);
console.log(newState.user.profile.name);  // 'Jane'
console.log(state.user.profile.name);     // 'John' (unchanged)

// Works with arrays too
interface ListState {
  items: { id: number; name: string }[];
}

const listState: ListState = {
  items: [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ]
};

const firstItemNameLens = lens<ListState>()
  .chain('items')
  .chain(0)
  .chain('name');

console.log(firstItemNameLens.get(listState));  // 'Item 1'`}
      />

      <h2>copyable</h2>

      <p>
        Wraps an object to provide a convenient <code>writeCopy</code> method for immutable updates.
        Combines lens navigation with a fluent API.
      </p>

      <h3>Signature</h3>

      <CodeBlock
        language="typescript"
        code={`function copyable<T extends { [key: string | symbol]: unknown }>(
  origObj: T,
  lensInit?: Lens<T, any>
): Copyable<T>

type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(value: V) => Root;
}`}
      />

      <h3>Parameters</h3>

      <ul>
        <li>
          <code>origObj: T</code> - The object to wrap
        </li>
        <li>
          <code>lensInit</code> (optional) - Initial lens for the wrapper
        </li>
      </ul>

      <h3>Returns</h3>

      <p>
        Returns a <code>Copyable</code> proxy that allows:
      </p>

      <ul>
        <li>Property navigation (like regular object access)</li>
        <li><code>writeCopy(value)</code> method to create an immutable update</li>
      </ul>

      <h3>Example</h3>

      <CodeBlock
        language="typescript"
        code={`import { copyable } from 'state-ref';

const state = {
  user: {
    name: 'John',
    profile: {
      age: 30,
      city: 'Seoul'
    }
  }
};

// Navigate and update immutably
const newState = copyable(state).user.profile.age.writeCopy(31);

console.log(newState.user.profile.age);  // 31
console.log(state.user.profile.age);     // 30 (unchanged)

// Multiple updates
const state2 = copyable(newState).user.name.writeCopy('Jane');
console.log(state2.user.name);           // 'Jane'
console.log(state2.user.profile.age);    // 31

// Direct property assignment throws error
try {
  copyable(state).user.name = 'Jane';  // Error!
} catch (e) {
  console.log(e.message);
  // "Property modification is not supported on a copyable object..."
}`}
      />

      <h3>Use with StateRef</h3>

      <CodeBlock
        language="typescript"
        code={`import { createStore, copyable } from 'state-ref';

const watch = createStore({
  todos: [
    { id: 1, text: 'Learn StateRef', done: false },
    { id: 2, text: 'Build app', done: false }
  ]
});

const ref = watch();

// Update nested array item immutably
ref.todos.value = copyable(ref.todos.value)[0].done.writeCopy(true);

console.log(ref.todos.value[0].done);  // true`}
      />

      <h2>cloneDeep</h2>

      <p>
        Creates a deep copy of a value. Recursively clones objects and arrays.
      </p>

      <h3>Signature</h3>

      <CodeBlock
        language="typescript"
        code={`function cloneDeep<T>(value: T): T`}
      />

      <h3>Parameters</h3>

      <ul>
        <li>
          <code>value: T</code> - The value to clone
        </li>
      </ul>

      <h3>Returns</h3>

      <p>
        Returns a deep copy of the input value. For primitives, returns the value as-is.
        For objects and arrays, creates new instances with recursively cloned contents.
      </p>

      <h3>Behavior</h3>

      <table>
        <thead>
          <tr>
            <th>Input Type</th>
            <th>Behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>null</code> / <code>undefined</code></td>
            <td>Returns as-is</td>
          </tr>
          <tr>
            <td>Primitives (number, string, boolean)</td>
            <td>Returns as-is</td>
          </tr>
          <tr>
            <td>Arrays</td>
            <td>Creates new array with cloned elements</td>
          </tr>
          <tr>
            <td>Objects</td>
            <td>Creates new object with cloned properties</td>
          </tr>
        </tbody>
      </table>

      <h3>Example</h3>

      <CodeBlock
        language="typescript"
        code={`import { cloneDeep } from 'state-ref';

const original = {
  name: 'John',
  scores: [85, 90, 78],
  address: {
    city: 'Seoul',
    zip: '12345'
  }
};

const cloned = cloneDeep(original);

// Modifications to clone don't affect original
cloned.name = 'Jane';
cloned.scores.push(95);
cloned.address.city = 'Busan';

console.log(original.name);           // 'John'
console.log(original.scores);         // [85, 90, 78]
console.log(original.address.city);   // 'Seoul'

console.log(cloned.name);             // 'Jane'
console.log(cloned.scores);           // [85, 90, 78, 95]
console.log(cloned.address.city);     // 'Busan'

// Primitives
console.log(cloneDeep(42));           // 42
console.log(cloneDeep('hello'));      // 'hello'
console.log(cloneDeep(null));         // null`}
      />

      <h3>Use Cases</h3>

      <CodeBlock
        language="typescript"
        code={`import { createStore, cloneDeep } from 'state-ref';

const watch = createStore({
  items: [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ]
});

const ref = watch();

// Clone before making multiple mutations
const newItems = cloneDeep(ref.items.value);
newItems[0].name = 'Updated Item 1';
newItems.push({ id: 3, name: 'Item 3' });

// Assign the cloned and modified array
ref.items.value = newItems;`}
      />

      <h2>Summary Table</h2>

      <table>
        <thead>
          <tr>
            <th>Function</th>
            <th>Purpose</th>
            <th>Mutates Original</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>lens</code></td>
            <td>Navigate and update nested structures</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>copyable</code></td>
            <td>Fluent API for immutable updates</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>cloneDeep</code></td>
            <td>Deep copy values</td>
            <td>No (creates copy)</td>
          </tr>
        </tbody>
      </table>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/lens">Lens Pattern Guide</a> - Detailed lens usage guide
        </li>
        <li>
          <a href="#/guide/copyable">copyable Guide</a> - copyable usage guide
        </li>
        <li>
          <a href="#/guide/clone-deep">cloneDeep Guide</a> - cloneDeep usage guide
        </li>
        <li>
          <a href="#/api/core">Core API</a> - createStore, createComputed, combineWatch
        </li>
        <li>
          <a href="#/api/types">TypeScript Types</a> - Complete type definitions
        </li>
      </ul>
    </div>
  );
});
