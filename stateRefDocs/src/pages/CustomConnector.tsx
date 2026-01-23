import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const CustomConnector = mount(() => {
  return () => (
    <div>
      <h1>Custom Connector</h1>

      <p>
        Learn how to create your own connector to integrate StateRef with any UI framework.
        This guide walks through the patterns used by official connectors.
      </p>

      <h2>Core Concepts</h2>

      <p>
        A connector bridges StateRef's subscription system with a framework's reactivity:
      </p>

      <ul>
        <li>
          <strong>Subscribe</strong>: Call <code>watch(callback)</code> to receive updates
        </li>
        <li>
          <strong>Trigger re-render</strong>: When StateRef notifies, update the framework's state
        </li>
        <li>
          <strong>Cleanup</strong>: Use <code>AbortController</code> to unsubscribe on unmount
        </li>
        <li>
          <strong>Two-way sync</strong>: Optionally sync framework state back to StateRef
        </li>
      </ul>

      <h2>The Watch Callback Signature</h2>

      <p>
        The <code>watch</code> function accepts a callback with this signature:
      </p>

      <CodeBlock
        language="typescript"
        code={`type Renew<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => AbortSignal | void;`}
      />

      <ul>
        <li>
          <code>store</code>: The StateRefStore for reading/writing values
        </li>
        <li>
          <code>isFirst</code>: <code>true</code> on initial call, <code>false</code> on updates
        </li>
        <li>
          Return an <code>AbortSignal</code> to enable unsubscription
        </li>
      </ul>

      <h2>Pattern 1: Direct Hook (React-style)</h2>

      <p>
        The simplest pattern returns a hook that provides the store directly.
        This is how <code>connectReact</code> works:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { useState, useRef, useEffect } from 'react';
import type { StateRefStore, Watch } from 'state-ref';

export function connectReact<T>(watch: Watch<T>) {
  // Create a custom hook factory
  const useForceUpdate = () => {
    const [, setDummy] = useState(0);
    const abortController = useRef(new AbortController());

    // Create the renewal callback
    const forceUpdateRef = useRef((
      _: StateRefStore<T>,
      isFirst: boolean
    ) => {
      // Skip re-render on first call (initial subscription)
      if (!isFirst) {
        setDummy(prev => prev + 1);
      }
      // Return signal for cleanup
      return abortController.current.signal;
    });

    // Cleanup on unmount
    useEffect(() => () => abortController.current.abort(), []);

    return forceUpdateRef.current;
  };

  // Return hook that subscribes and returns store
  return () => watch(useForceUpdate());
}`}
      />

      <p>
        Key points:
      </p>

      <ul>
        <li>
          Use <code>useState</code> with a dummy counter to force re-renders
        </li>
        <li>
          <code>isFirst</code> check prevents unnecessary initial re-render
        </li>
        <li>
          <code>AbortController</code> handles cleanup when component unmounts
        </li>
        <li>
          Returns the <code>StateRefStore</code> directly for <code>.value</code> access
        </li>
      </ul>

      <h2>Pattern 2: Selector Callback (Vue-style)</h2>

      <p>
        For frameworks with their own reactivity, use a selector pattern that returns
        framework-native reactive objects:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { reactive, watch, onUnmounted } from 'vue';
import type { Reactive, UnwrapRef } from 'vue';
import { cloneDeep } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';

export function connectVue<T>(refWatch: Watch<T>) {
  // Return a function that accepts a selector
  return <V>(
    callback: (store: StateRefStore<T>) => StateRefStore<V>
  ): Reactive<{ value: V }> => {
    const abortController = new AbortController();
    let reactiveValue!: Reactive<{ value: V }>;
    let stateRef!: StateRefStore<V>;
    let changing = false;

    // Helper to prevent sync loops
    const change = (cb: () => void) => {
      changing = true;
      cb();
      queueMicrotask(() => (changing = false));
    };

    // Cleanup on unmount
    onUnmounted(() => abortController.abort());

    // Subscribe to StateRef
    refWatch(stateInnerRef => {
      stateRef = callback(stateInnerRef);

      if (reactiveValue?.value !== stateRef.value && !changing) {
        change(() => {
          if (reactiveValue?.value) {
            reactiveValue.value = stateRef.value as UnwrapRef<V>;
          } else {
            reactiveValue = reactive({ value: stateRef.value });
          }
        });
      }

      return abortController.signal;
    });

    // Watch Vue reactive for two-way sync
    watch(reactiveValue, newValues => {
      if (stateRef.value !== newValues.value && !changing) {
        const newV = typeof newValues.value === 'object'
          ? cloneDeep(newValues.value)
          : newValues.value;

        change(() => {
          stateRef.value = newV as V;
        });
      }
    });

    return reactiveValue;
  };
}`}
      />

      <p>
        Key points:
      </p>

      <ul>
        <li>
          Selector callback lets users pick specific properties to track
        </li>
        <li>
          Returns framework-native reactive object (Vue's <code>Reactive</code>)
        </li>
        <li>
          <code>changing</code> flag prevents infinite sync loops
        </li>
        <li>
          <code>cloneDeep</code> ensures proper object copying
        </li>
        <li>
          Two-way sync: Vue changes update StateRef, StateRef changes update Vue
        </li>
      </ul>

      <h2>Pattern 3: Signal Pair (Solid-style)</h2>

      <p>
        For frameworks with signal patterns, return getter/setter pairs:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createSignal, onCleanup } from 'solid-js';
import type { Accessor, Setter } from 'solid-js';
import type { StateRefStore, Watch } from 'state-ref';

export function connectSolid<T>(refWatch: Watch<T>) {
  return <V>(
    callback: (store: StateRefStore<T>) => StateRefStore<V>
  ): [Accessor<V>, Setter<V>] => {
    const abortController = new AbortController();
    let stateRef!: StateRefStore<V>;
    let changing = false;

    const change = (cb: () => void) => {
      changing = true;
      cb();
      queueMicrotask(() => (changing = false));
    };

    // Get initial value
    const initialStore = refWatch();
    const initialRef = callback(initialStore);
    const [value, setValue] = createSignal<V>(initialRef.value);

    onCleanup(() => abortController.abort());

    // Subscribe to StateRef changes
    refWatch(stateInnerRef => {
      stateRef = callback(stateInnerRef);

      if (value() !== stateRef.value && !changing) {
        change(() => setValue(() => stateRef.value));
      }

      return abortController.signal;
    });

    // Custom setter that syncs back to StateRef
    const customSetter: Setter<V> = (newValue) => {
      const resolvedValue = typeof newValue === 'function'
        ? (newValue as (prev: V) => V)(value())
        : newValue;

      if (stateRef.value !== resolvedValue && !changing) {
        change(() => {
          stateRef.value = resolvedValue as V;
          setValue(() => resolvedValue as V);
        });
      }

      return resolvedValue as V;
    };

    return [value, customSetter as Setter<V>];
  };
}`}
      />

      <h2>Building Your Own Connector</h2>

      <p>
        Follow these steps to create a connector for any framework:
      </p>

      <h3>Step 1: Identify the Re-render Mechanism</h3>

      <p>
        Every UI framework has a way to trigger re-renders:
      </p>

      <CodeBlock
        language="typescript"
        code={`// React: useState setter
const [, setDummy] = useState(0);
const rerender = () => setDummy(n => n + 1);

// Vue: reactive()
const state = reactive({ value: initialValue });
// Mutating state.value triggers re-render

// Svelte: writable()
const store = writable(initialValue);
// Calling store.set() triggers re-render

// Solid: createSignal()
const [value, setValue] = createSignal(initialValue);
// Calling setValue() triggers re-render`}
      />

      <h3>Step 2: Set Up Subscription</h3>

      <CodeBlock
        language="typescript"
        code={`const abortController = new AbortController();

watch(store => {
  // Access .value to register tracking
  const currentValue = store.someProperty.value;

  // Update framework state here
  frameworkState = currentValue;

  // Return signal for cleanup
  return abortController.signal;
});`}
      />

      <h3>Step 3: Handle Cleanup</h3>

      <CodeBlock
        language="typescript"
        code={`// React
useEffect(() => () => abortController.abort(), []);

// Vue
onUnmounted(() => abortController.abort());

// Svelte
onDestroy(() => abortController.abort());

// Solid
onCleanup(() => abortController.abort());`}
      />

      <h3>Step 4: Two-Way Sync (Optional)</h3>

      <CodeBlock
        language="typescript"
        code={`let changing = false;

const change = (cb: () => void) => {
  changing = true;
  cb();
  queueMicrotask(() => (changing = false));
};

// When StateRef changes -> update framework
watch(store => {
  if (!changing) {
    change(() => {
      frameworkState = store.prop.value;
    });
  }
  return abortController.signal;
});

// When framework changes -> update StateRef
frameworkWatch(newValue => {
  if (!changing) {
    change(() => {
      stateRef.prop.value = newValue;
    });
  }
});`}
      />

      <h2>Minimal Example</h2>

      <p>
        Here's a minimal connector for a hypothetical framework:
      </p>

      <CodeBlock
        language="typescript"
        code={`import type { StateRefStore, Watch } from 'state-ref';

export function connectMyFramework<T>(watch: Watch<T>) {
  return () => {
    const abortController = new AbortController();
    let store!: StateRefStore<T>;

    // Subscribe
    watch((stateRef, isFirst) => {
      store = stateRef;

      if (!isFirst) {
        // Trigger re-render using framework's mechanism
        myFrameworkRerender();
      }

      return abortController.signal;
    });

    // Setup cleanup
    myFrameworkOnDestroy(() => abortController.abort());

    return store;
  };
}`}
      />

      <h2>Important Considerations</h2>

      <ul>
        <li>
          <strong>isFirst check</strong>: Skip re-render on initial subscription to avoid double render
        </li>
        <li>
          <strong>Sync loop prevention</strong>: Use a <code>changing</code> flag for two-way binding
        </li>
        <li>
          <strong>Object cloning</strong>: Use <code>cloneDeep</code> when passing objects between systems
        </li>
        <li>
          <strong>AbortController</strong>: Always return the signal and abort on cleanup
        </li>
        <li>
          <strong>queueMicrotask</strong>: Reset flags asynchronously to handle batched updates
        </li>
      </ul>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/watch">Watch Function</a> - understanding watch behavior
        </li>
        <li>
          <a href="#/guide/subscription">Subscription</a> - subscription patterns
        </li>
        <li>
          <a href="#/guide/react">React</a> - React connector usage
        </li>
        <li>
          <a href="#/guide/vue">Vue</a> - Vue connector usage
        </li>
        <li>
          <a href="#/guide/lithent">Lithent</a> - direct integration without connector
        </li>
      </ul>
    </div>
  );
});
