import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const React = mount(() => {
  return () => (
    <div>
      <h1>React Integration</h1>

      <p>
        Use <code>@stateref/connect-react</code> to connect a StateRef store to
        React. It provides a hook that re-renders on changes automatically.
      </p>

      <h2>Install</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref @stateref/connect-react`}
      />

      <h2>Basic Usage</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

// Create a React hook from the watch
export const useProfileStore = connectReact(watch);`}
      />

      <CodeBlock
        language="tsx"
        code={`import { useProfileStore } from './profileStore';

export function ProfileCard() {
  const { name, age } = useProfileStore();

  return (
    <div>
      <p>{name.value}</p>
      <button onClick={() => (age.value += 1)}>
        Age: {age.value}
      </button>
    </div>
  );
}`}
      />

      <h2>How Updates Work</h2>

      <ul>
        <li>
          The hook subscribes on mount and re-renders when tracked values change
        </li>
        <li>
          Updates are driven by reading <code>.value</code> in the render
        </li>
        <li>
          Cleanup is automatic on unmount (AbortController)
        </li>
      </ul>

      <h2>Manual Sync with Actions</h2>

      <p>
        If you use <code>createStoreManualSync</code>, keep writes in actions and
        call <code>sync()</code> after updates.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStoreManualSync } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectReact(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}
      />

      <CodeBlock
        language="tsx"
        code={`import { useCounterStore, increment } from './counterStore';

export function Counter() {
  const { count } = useCounterStore();
  return <button onClick={increment}>{count.value}</button>;
}`}
      />

      <h2>TypeScript Tips</h2>

      <p>
        The hook preserves types from <code>createStore</code>, so you get
        strongly typed refs in components.
      </p>

      <CodeBlock
        language="typescript"
        code={`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectReact(watch);

// useTodo() returns StateRefStore<Todo>`}
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
      </ul>
    </div>
  );
});
