import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Solid = mount(() => {
  return () => (
    <div>
      <h1>Solid Integration</h1>

      <p>
        Use <code>@stateref/connect-solid</code> to connect a StateRef store to Solid.js.
        It returns Solid <code>Signal</code> pairs that integrate with Solid's fine-grained reactivity.
      </p>

      <h2>Install</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-solid`}
      />

      <h2>Basic Usage</h2>

      <p>
        The Solid connector uses a callback pattern to select which part of the store to track:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStore } from 'state-ref';
import { connectSolid } from '@stateref/connect-solid';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectSolid(watch);`}
      />

      <CodeBlock
        language="tsx"
        code={`import { useProfile } from './store';

function ProfileCard() {
  // Returns [getter, setter] Signal pair
  const [name, setName] = useProfile(store => store.name);
  const [age, setAge] = useProfile(store => store.age);

  return (
    <div>
      <p>{name()}</p>
      <button onClick={() => setAge(prev => prev + 1)}>
        Age: {age()}
      </button>
    </div>
  );
}`}
      />

      <h2>How It Works</h2>

      <p>
        The Solid connector bridges StateRef with Solid's signal system:
      </p>

      <ul>
        <li>
          <code>connectSolid(watch)</code> returns a function that accepts a selector callback
        </li>
        <li>
          The selector receives the StateRefStore and returns the specific property to track
        </li>
        <li>
          Returns a Solid <code>Signal</code> pair: <code>[getter, setter]</code>
        </li>
        <li>
          Call the getter function to read values: <code>name()</code>
        </li>
        <li>
          Use the setter function to update values: <code>setName('Jane')</code>
        </li>
        <li>
          Two-way binding: Solid changes sync back to StateRef, and vice versa
        </li>
        <li>
          Cleanup is automatic via <code>onCleanup</code>
        </li>
      </ul>

      <h2>Selecting Properties</h2>

      <p>
        Use the selector callback to pick specific properties:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'en' }
});

const useStore = connectSolid(watch);`}
      />

      <CodeBlock
        language="tsx"
        code={`import { useStore } from './store';

function Settings() {
  const [userName, setUserName] = useStore(store => store.user.name);
  const [userAge, setUserAge] = useStore(store => store.user.age);
  const [theme, setTheme] = useStore(store => store.settings.theme);

  return (
    <div>
      {/* Access values with getter function */}
      <p>Name: {userName()}</p>
      <p>Theme: {theme()}</p>

      {/* Update values with setter function */}
      <button onClick={() => setUserName('Jane')}>Change Name</button>
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </button>
    </div>
  );
}`}
      />

      <h2>Working with Objects</h2>

      <p>
        You can also select entire objects:
      </p>

      <CodeBlock
        language="tsx"
        code={`import { useStore } from './store';

function UserCard() {
  // Select entire user object
  const [user, setUser] = useStore(store => store.user);

  return (
    <div>
      {/* Access nested values */}
      <p>Name: {user().name}</p>
      <p>Age: {user().age}</p>

      {/* Replace entire object */}
      <button onClick={() => setUser({ name: 'Jane', age: 25 })}>
        Update User
      </button>
    </div>
  );
}`}
      />

      <h2>Manual Sync with Actions</h2>

      <p>
        With <code>createStoreManualSync</code>, keep writes in actions:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectSolid } from '@stateref/connect-solid';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectSolid(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}
      />

      <CodeBlock
        language="tsx"
        code={`import { useCounter, increment } from './store';

function Counter() {
  const [count] = useCounter(store => store.count);

  return (
    <button onClick={increment}>
      Count: {count()}
    </button>
  );
}`}
      />

      <h2>Using with Solid's Reactive Primitives</h2>

      <p>
        Combine with Solid's reactive primitives for derived values:
      </p>

      <CodeBlock
        language="tsx"
        code={`import { createMemo } from 'solid-js';
import { useStore } from './store';

function FullName() {
  const [firstName] = useStore(store => store.firstName);
  const [lastName] = useStore(store => store.lastName);

  // Derived value using createMemo
  const fullName = createMemo(() => \`\${firstName()} \${lastName()}\`);

  return <p>Full Name: {fullName()}</p>;
}`}
      />

      <h2>Input Binding Pattern</h2>

      <p>
        Handle input binding with Solid:
      </p>

      <CodeBlock
        language="tsx"
        code={`import { useStore } from './store';

function Form() {
  const [name, setName] = useStore(store => store.name);
  const [email, setEmail] = useStore(store => store.email);

  return (
    <div>
      <input
        value={name()}
        onInput={(e) => setName(e.currentTarget.value)}
        placeholder="Name"
      />
      <input
        value={email()}
        onInput={(e) => setEmail(e.currentTarget.value)}
        type="email"
        placeholder="Email"
      />

      <p>Name: {name()}</p>
      <p>Email: {email()}</p>
    </div>
  );
}`}
      />

      <h2>TypeScript Tips</h2>

      <p>
        The connector preserves types from your store:
      </p>

      <CodeBlock
        language="typescript"
        code={`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectSolid(watch);

// TypeScript knows the types
const [title, setTitle] = useTodo(store => store.title);
// title is Accessor<string>, setTitle is Setter<string>

const [done, setDone] = useTodo(store => store.done);
// done is Accessor<boolean>, setDone is Setter<boolean>`}
      />

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/create-store">createStore</a> - store creation
        </li>
        <li>
          <a href="#/guide/manual-sync">Manual Sync (Flux)</a> - action-based updates
        </li>
        <li>
          <a href="#/guide/watch">Watch Function</a> - subscription behavior
        </li>
        <li>
          <a href="#/guide/svelte">Svelte</a> - Svelte integration
        </li>
      </ul>
    </div>
  );
});
