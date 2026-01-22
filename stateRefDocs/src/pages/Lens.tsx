import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Lens = mount(() => {
  return () => (
    <div>
      <h1>Lens Pattern</h1>

      <p>
        The <code>lens</code> helper provides immutable, deep updates by
        describing a path into your data. StateRef uses the same lens pattern
        internally, and you can use it directly for custom immutable updates.
      </p>

      <h2>Basic Usage</h2>

      <CodeBlock
        language="typescript"
        code={`import { lens } from 'state-ref';

type State = {
  user: { name: string; age: number };
  settings: { theme: string };
};

const state: State = {
  user: { name: 'Lee', age: 20 },
  settings: { theme: 'light' }
};

const nameLens = lens<State>().chain('user').chain('name');

// Read
const name = nameLens.get(state); // 'Lee'

// Update (returns a new root object)
const next = nameLens.set('Min')(state);
console.log(next.user.name); // 'Min'`}
      />

      <h2>Chaining Deep Paths</h2>

      <p>
        Use <code>chain</code> with object keys and array indices to build deep
        paths.
      </p>

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

const firstTitle = lens<State>().chain('todos').chain(0).chain('title');
const next = firstTitle.set('Review docs')(state);

console.log(next.todos[0].title); // 'Review docs'`}
      />

      <h2>Reusable Lenses</h2>

      <p>
        Build reusable lenses by chaining from a base lens.
      </p>

      <CodeBlock
        language="typescript"
        code={`type State = { user: { name: string; email: string } };

const userLens = lens<State>().chain('user');
const userNameLens = userLens.chain('name');
const userEmailLens = userLens.chain('email');`}
      />

      <h2>Immutability (Copy-On-Write)</h2>

      <p>
        <code>set()</code> performs shallow copies only along the path, keeping
        unrelated branches referentially equal.
      </p>

      <CodeBlock
        language="typescript"
        code={`type State = {
  user: { name: string };
  settings: { theme: string };
};

const state: State = {
  user: { name: 'Lee' },
  settings: { theme: 'light' }
};

const nameLens = lens<State>().chain('user').chain('name');
const next = nameLens.set('Min')(state);

console.log(next !== state); // true
console.log(next.user !== state.user); // true
console.log(next.settings === state.settings); // true`}
      />

      <h2>TypeScript Support</h2>

      <p>
        <code>lens</code> preserves types through <code>chain</code>, so
        <code>get</code> and <code>set</code> are strongly typed.
      </p>

      <CodeBlock
        language="typescript"
        code={`type State = { user: { name: string; age: number } };

const nameLens = lens<State>().chain('user').chain('name');

const name: string = nameLens.get({ user: { name: 'Lee', age: 20 } });
const next = nameLens.set('Min')({ user: { name: 'Lee', age: 20 } });`}
      />

      <h2>When to Use</h2>

      <ul>
        <li>
          <strong>Custom immutable updates</strong> outside StateRef stores
        </li>
        <li>
          <strong>Integration code</strong> that needs predictable deep writes
        </li>
        <li>
          <strong>Internal helpers</strong> for shared update logic
        </li>
      </ul>

      <h2>API Summary</h2>

      <CodeBlock
        language="typescript"
        code={`lens<T>(sceneList?: (string | number | symbol)[]): Lens<T, T>

class Lens<Root, Focus> {
  chain(prop: string | number | symbol): Lens<Root, any>;
  get(target: Root): Focus;
  set(value: Focus): (target: Root) => Root;
}`}
      />

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/create-store">createStore</a> - StateRef store creation
        </li>
        <li>
          <a href="#/guide/state-ref-store">StateRefStore</a> - proxy references
        </li>
        <li>
          <a href="#/guide/computed">createComputed</a> - derived values
        </li>
      </ul>
    </div>
  );
});
