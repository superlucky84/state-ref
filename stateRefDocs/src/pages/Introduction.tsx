import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Introduction = mount(() => {
  return () => (
    <div>
      <h1>Introduction</h1>

      <p>
        StateRef is a universal state management library focused on data immutability.
        It combines proxies and the functional programming lens pattern to efficiently
        and safely access and modify deeply structured data.
      </p>

      <h2>Why StateRef?</h2>

      <p>
        Modern applications often deal with complex, deeply nested state. StateRef
        provides a simple yet powerful way to manage this state while maintaining
        immutability and fine-grained reactivity.
      </p>

      <h3>Key Features</h3>

      <ul>
        <li>
          <strong>Proxy-based Reactivity</strong> - Automatic dependency tracking
          using JavaScript Proxies
        </li>
        <li>
          <strong>Immutable Updates</strong> - Copy-on-write pattern ensures safe
          state modifications
        </li>
        <li>
          <strong>Lens Pattern</strong> - Functional lenses for elegant deep updates
        </li>
        <li>
          <strong>Framework Agnostic</strong> - Easy integration with React, Vue,
          Svelte, Solid, and more
        </li>
        <li>
          <strong>TypeScript Support</strong> - Full type safety and inference
        </li>
        <li>
          <strong>Lightweight</strong> - Small bundle size with zero dependencies
        </li>
      </ul>

      <h2>Core Concepts</h2>

      <h3>Watch Function</h3>

      <p>
        The <code>Watch</code> function is the fundamental abstraction in StateRef.
        It serves dual purposes:
      </p>

      <ul>
        <li>
          Called with no arguments: returns a <code>StateRefStore</code> for
          reading/writing values
        </li>
        <li>
          Called with a callback: subscribes to changes (callback receives{' '}
          <code>StateRefStore</code> and <code>isFirst</code> boolean)
        </li>
      </ul>

      <h3>StateRefStore</h3>

      <p>
        The <code>StateRefStore</code> is a proxied reference that allows you to
        access values via the <code>.value</code> property. The proxy automatically
        tracks which properties are accessed during subscription callbacks, enabling
        fine-grained reactivity.
      </p>

      <h3>Copy-on-Write</h3>

      <p>
        All mutations create new object references at the modified path while sharing
        unchanged subtrees. This enables efficient immutability checks via reference
        equality.
      </p>

      <h2>Installation</h2>

      <CodeBlock
        language="bash"
        code={`# Core library
$ npm install state-ref

# Framework connectors (choose what you need)
$ npm install @stateref/connect-react
$ npm install @stateref/connect-vue
$ npm install @stateref/connect-svelte
$ npm install @stateref/connect-solid`}
      />

      <h2>Basic Example</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

// Create a store
const watch = createStore({ count: 0 });

// Subscribe to changes
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  // First run: Count: 0
});

// Update the value
const store = watch();
store.count.value = 1;
// Logs: Count: 1`}
      />

      <h2>Usage with React</h2>

      <p>
        StateRef can be easily integrated with React using the <code>connectReact</code> helper:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const watch = createStore({ count: 0 });
export const useCountStore = connectReact(watch);`}
      />

      <CodeBlock
        language="tsx"
        code={`// Counter.tsx
import { useCountStore } from './store';

function Counter() {
  const { count } = useCountStore();

  return (
    <button onClick={() => count.value++}>
      Count: {count.value}
    </button>
  );
}`}
      />

      <p>
        The component automatically re-renders when <code>count.value</code> changes.
        Learn more in the <a href="#/guide/react">React Integration</a> guide.
      </p>

      <h2>Next Steps</h2>

      <p>
        Ready to dive deeper? Check out the <a href="#/guide/quick-start">Quick Start</a> guide
        to learn how to use StateRef in your projects.
      </p>
    </div>
  );
});
