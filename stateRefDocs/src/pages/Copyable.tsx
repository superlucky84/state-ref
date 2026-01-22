import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Copyable = mount(() => {
  return () => (
    <div>
      <h1>copyable</h1>

      <p>
        <code>copyable</code> creates a proxy that builds a path through property
        access and returns a new root object with copy-on-write updates via
        <code>writeCopy</code>. It’s useful when you need immutable updates
        outside of StateRef stores.
      </p>

      <h2>Basic Usage</h2>

      <CodeBlock
        language="typescript"
        code={`import { copyable } from 'state-ref';

type State = {
  user: { name: string; age: number };
  settings: { theme: string };
};

const state: State = {
  user: { name: 'Lee', age: 20 },
  settings: { theme: 'light' }
};

const c = copyable(state);

// Build path via property access, then write
const next = c.user.name.writeCopy('Min');

console.log(state.user.name); // 'Lee'
console.log(next.user.name);  // 'Min'`}
      />

      <h2>Deep Updates (Arrays Included)</h2>

      <CodeBlock
        language="typescript"
        code={`type State = {
  todos: { title: string; done: boolean }[];
};

const state: State = {
  todos: [
    { title: 'Write docs', done: false },
    { title: 'Ship', done: false }
  ]
};

const c = copyable(state);
const next = c.todos[1].done.writeCopy(true);

console.log(next.todos[1].done); // true`}
      />

      <h2>Read-Only Proxy</h2>

      <p>
        Direct assignment is not allowed. Use <code>writeCopy</code> for changes.
      </p>

      <CodeBlock
        language="typescript"
        code={`const state = { count: 0 };
const c = copyable(state);

// ✗ Not allowed
c.count = 1; // Error: Property modification is not supported

// ✓ Allowed
const next = c.count.writeCopy(1);`}
      />

      <h2>Copy-On-Write Behavior</h2>

      <p>
        Only the path you update is shallow-copied. Unrelated branches keep the
        same references.
      </p>

      <CodeBlock
        language="typescript"
        code={`const state = {
  user: { name: 'Lee' },
  settings: { theme: 'light' }
};

const c = copyable(state);
const next = c.user.name.writeCopy('Min');

console.log(next !== state); // true
console.log(next.user !== state.user); // true
console.log(next.settings === state.settings); // true`}
      />

      <h2>Important: Use the Latest Root</h2>

      <p>
        <code>copyable</code> writes against the root object you pass in. If you
        create a new root, call <code>copyable</code> again with that new object.
      </p>

      <CodeBlock
        language="typescript"
        code={`let state = { count: 0 };

let c = copyable(state);
state = c.count.writeCopy(1);

// Recreate copyable with the latest root
c = copyable(state);
state = c.count.writeCopy(2);`}
      />

      <h2>API Summary</h2>

      <CodeBlock
        language="typescript"
        code={`copyable<T>(orig: T): Copyable<T>

type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(v: V) => Root;
};`}
      />

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/lens">Lens Pattern</a> - path-based immutable updates
        </li>
        <li>
          <a href="#/guide/clone-deep">cloneDeep</a> - full deep copy utility
        </li>
        <li>
          <a href="#/guide/state-ref-store">StateRefStore</a> - proxy updates in stores
        </li>
      </ul>
    </div>
  );
});
