import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Computed = mount(() => {
  return () => (
    <div>
      <h1>createComputed</h1>

      <p>
        <code>createComputed</code> is a helper function that combines multiple watches
        to produce a new computed (derived) value. It executes a callback function
        whenever the computed value changes.
      </p>

      <p>
        A watch created with <code>createComputed</code> can be used just like any other watch,
        including integrations such as <code>connectReact</code> or <code>connectPreact</code>.
      </p>

      <h2>Basic Usage</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore, createComputed } from 'state-ref';

const watch1 = createStore(10);
const watch2 = createStore(20);

// Create a computed watch from two stores
const sumWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);

// Get the computed value
const sumRef = sumWatch();
console.log(sumRef.value);  // 30

// Update a source store
const num1 = watch1();
num1.value = 15;
console.log(sumRef.value);  // 35`}
      />

      <h2>Syntax</h2>

      <CodeBlock
        language="typescript"
        code={`createComputed<W extends readonly Watch<any>[], R>(
  watches: W,
  callback: (refs: StateRefsTuple<W>) => R
): (computedCallback?: (proxy: { value: R }, isFirst: boolean) => void) => { value: R }`}
      />

      <h3>Parameters</h3>

      <ul>
        <li>
          <code>watches</code> - An array of watch functions to combine
        </li>
        <li>
          <code>callback</code> - A function that receives the store references and returns the computed value
        </li>
      </ul>

      <h3>Returns</h3>

      <p>
        Returns a watch-like function that can be called with or without a callback:
      </p>

      <ul>
        <li>
          <strong>Without callback</strong>: Returns a read-only proxy with <code>.value</code>
        </li>
        <li>
          <strong>With callback</strong>: Subscribes to changes and returns the same proxy
        </li>
      </ul>

      <h2>Subscribing to Computed Values</h2>

      <p>
        Pass a callback to subscribe to computed value changes:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch1 = createStore(100);
const watch2 = createStore(50);

const diffWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value - ref2.value
);

// Subscribe to computed changes
diffWatch((computedRef, isFirst) => {
  console.log('Difference:', computedRef.value);
  console.log('Is first run?', isFirst);
});
// Logs: Difference: 50, Is first run? true

// Update triggers recomputation
const num1 = watch1();
num1.value = 200;
// Logs: Difference: 150, Is first run? false`}
      />

      <h2>Read-Only Values</h2>

      <p>
        Computed values are read-only. Attempting to set the value will show a warning:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch1 = createStore(10);
const watch2 = createStore(20);

const sumWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);

const sumRef = sumWatch();

// Reading works
console.log(sumRef.value);  // 30

// Writing shows a warning
sumRef.value = 100;  // Console warning: "Can not setting"
console.log(sumRef.value);  // Still 30`}
      />

      <h2>Complex Computed Values</h2>

      <p>
        The computed callback can return any type, including objects:
      </p>

      <CodeBlock
        language="typescript"
        code={`const userWatch = createStore({ firstName: 'John', lastName: 'Doe' });
const settingsWatch = createStore({ showFullName: true });

const displayNameWatch = createComputed(
  [userWatch, settingsWatch],
  ([user, settings]) => {
    if (settings.showFullName.value) {
      return {
        name: \`\${user.firstName.value} \${user.lastName.value}\`,
        initials: \`\${user.firstName.value[0]}\${user.lastName.value[0]}\`
      };
    }
    return {
      name: user.firstName.value,
      initials: user.firstName.value[0]
    };
  }
);

const displayRef = displayNameWatch();
console.log(displayRef.value);
// { name: 'John Doe', initials: 'JD' }`}
      />

      <h2>Combining Multiple Stores</h2>

      <p>
        You can combine any number of stores in a single computed:
      </p>

      <CodeBlock
        language="typescript"
        code={`const priceWatch = createStore(100);
const quantityWatch = createStore(3);
const taxRateWatch = createStore(0.1);
const discountWatch = createStore(10);

const totalWatch = createComputed(
  [priceWatch, quantityWatch, taxRateWatch, discountWatch],
  ([price, quantity, taxRate, discount]) => {
    const subtotal = price.value * quantity.value;
    const tax = subtotal * taxRate.value;
    const total = subtotal + tax - discount.value;
    return {
      subtotal,
      tax,
      discount: discount.value,
      total
    };
  }
);

const total = totalWatch();
console.log(total.value);
// { subtotal: 300, tax: 30, discount: 10, total: 320 }`}
      />

      <h2>Using with Framework Connectors</h2>

      <p>
        Computed watches work seamlessly with framework connectors:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore, createComputed } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

// Source stores
const widthWatch = createStore(10);
const heightWatch = createStore(20);

// Computed store
const areaWatch = createComputed(
  [widthWatch, heightWatch],
  ([width, height]) => width.value * height.value
);

// Create React hook from computed watch
const useArea = connectReact(areaWatch);

function AreaDisplay() {
  const area = useArea();

  return <div>Area: {area.value}</div>;
}`}
      />

      <h2>Chaining Computed Values</h2>

      <p>
        Computed watches can be used as inputs to other computed watches:
      </p>

      <CodeBlock
        language="typescript"
        code={`const baseWatch = createStore(100);
const multiplierWatch = createStore(2);

// First computed
const multipliedWatch = createComputed(
  [baseWatch, multiplierWatch],
  ([base, mult]) => base.value * mult.value
);

// Second computed using the first
const formattedWatch = createComputed(
  [multipliedWatch],
  ([multiplied]) => \`Result: \${multiplied.value}\`
);

const formatted = formattedWatch();
console.log(formatted.value);  // "Result: 200"

// Update base value
const base = baseWatch();
base.value = 50;
console.log(formatted.value);  // "Result: 100"`}
      />

      <h2>TypeScript Support</h2>

      <p>
        <code>createComputed</code> provides full TypeScript inference:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore, createComputed } from 'state-ref';
import type { Watch } from 'state-ref';

interface User {
  name: string;
  age: number;
}

const userWatch = createStore<User>({ name: 'John', age: 30 });
const multiplierWatch = createStore<number>(2);

// Return type is automatically inferred
const computedWatch = createComputed(
  [userWatch, multiplierWatch],
  ([user, mult]) => ({
    userName: user.name.value,        // string
    doubleAge: user.age.value * mult.value  // number
  })
);

const result = computedWatch();
// result.value is typed as { userName: string; doubleAge: number }`}
      />

      <h2>Performance Considerations</h2>

      <ul>
        <li>
          <strong>Computed values are cached</strong> - The callback only runs when source values change
        </li>
        <li>
          <strong>Fine-grained updates</strong> - Only accessed properties trigger recomputation
        </li>
        <li>
          <strong>Avoid heavy computations</strong> - Keep callback functions efficient
        </li>
      </ul>

      <CodeBlock
        language="typescript"
        code={`// Good: Simple computation
const simpleComputed = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);

// Caution: Heavy computation - consider memoization
const heavyComputed = createComputed(
  [itemsWatch, filterWatch],
  ([items, filter]) => {
    // This runs on every change
    return items.value
      .filter(item => item.name.includes(filter.value))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
);`}
      />

      <h2>Comparison with combineWatch</h2>

      <p>
        <code>createComputed</code> and <code>combineWatch</code> serve different purposes:
      </p>

      <ul>
        <li>
          <strong>createComputed</strong> - Derives a <em>new value</em> from multiple stores
        </li>
        <li>
          <strong>combineWatch</strong> - Groups multiple stores into a <em>tuple structure</em>
        </li>
      </ul>

      <CodeBlock
        language="typescript"
        code={`import { createStore, createComputed, combineWatch } from 'state-ref';

const watch1 = createStore(10);
const watch2 = createStore(20);

// createComputed: Returns a derived value
const sumWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);
const sum = sumWatch();
console.log(sum.value);  // 30 (single value)

// combineWatch: Returns grouped stores
const combinedWatch = combineWatch([watch1, watch2]);
const combined = combinedWatch();
console.log(combined[0].value);  // 10
console.log(combined[1].value);  // 20`}
      />

      <h2>Best Practices</h2>

      <ul>
        <li>
          <strong>Keep computations pure</strong> - No side effects in the callback
        </li>
        <li>
          <strong>Access only needed values</strong> - Don't read properties you don't use
        </li>
        <li>
          <strong>Use for derived state</strong> - Perfect for values that depend on other state
        </li>
        <li>
          <strong>Prefer over manual subscriptions</strong> - Cleaner and more efficient
        </li>
      </ul>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/create-store">createStore</a> - Creating source stores
        </li>
        <li>
          <a href="#/guide/combine-watch">combineWatch</a> - Grouping multiple watches
        </li>
        <li>
          <a href="#/guide/subscription">Subscription</a> - Understanding subscriptions
        </li>
        <li>
          <a href="#/guide/react">React Integration</a> - Using with React
        </li>
      </ul>
    </div>
  );
});
