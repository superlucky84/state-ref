import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const CombineWatch = mount(() => {
  return () => (
    <div>
      <h1>combineWatch</h1>

      <p>
        <code>combineWatch</code> is a helper function that observes multiple <code>Watch</code> instances
        together and produces a new <code>Watch</code> that delivers their combined values as a tuple-like structure.
      </p>

      <p>
        Unlike <code>createComputed</code>, which produces a single derived value,
        <code>combineWatch</code> focuses on grouping multiple watches so you can react to changes
        from any of them in a single subscription.
      </p>

      <h2>Basic Usage</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore, combineWatch } from 'state-ref';

const countWatch = createStore(100);
const textWatch = createStore('hello');

// Combine multiple watches into one
const combinedWatch = combineWatch([countWatch, textWatch]);

// Subscribe to combined changes
combinedWatch(([countRef, textRef], isFirst) => {
  console.log('Count:', countRef.value);
  console.log('Text:', textRef.value);
  console.log('Is first?', isFirst);
});

// Update any watch triggers the callback
const count = countWatch();
count.value = 200;
// Logs: Count: 200, Text: hello, Is first? false`}
      />

      <h2>Syntax</h2>

      <CodeBlock
        language="typescript"
        code={`combineWatch<W extends readonly Watch<any>[]>(
  watches: [...W]
): Watch<CombinedValue<W>>`}
      />

      <h3>Parameters</h3>

      <ul>
        <li>
          <code>watches</code> - An array of watch functions to combine
        </li>
      </ul>

      <h3>Returns</h3>

      <p>
        Returns a new <code>Watch</code> function that provides access to all combined stores as a tuple.
        The returned watch can be used like any other watch function.
      </p>

      <h2>Accessing Combined Values</h2>

      <p>
        The combined store is accessed as a tuple (array) by index:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch1 = createStore(10);
const watch2 = createStore('hello');
const watch3 = createStore(true);

const combinedWatch = combineWatch([watch1, watch2, watch3]);

// Without callback - get reference
const combined = combinedWatch();

// Access by index
console.log(combined[0].value);  // 10 (number)
console.log(combined[1].value);  // 'hello' (string)
console.log(combined[2].value);  // true (boolean)

// Update individual stores
combined[0].value = 20;
combined[1].value = 'world';`}
      />

      <h2>Subscribing to Changes</h2>

      <p>
        Pass a callback to subscribe to changes from any of the combined watches:
      </p>

      <CodeBlock
        language="typescript"
        code={`const userWatch = createStore({ name: 'John' });
const settingsWatch = createStore({ theme: 'dark' });

const combinedWatch = combineWatch([userWatch, settingsWatch]);

combinedWatch(([userRef, settingsRef], isFirst) => {
  // Access .value first to collect subscriptions
  const userName = userRef.name.value;
  const theme = settingsRef.theme.value;

  if (isFirst) {
    console.log('Initial state');
    return;
  }

  console.log(\`User: \${userName}, Theme: \${theme}\`);
});

// Either update triggers the callback
const user = userWatch();
user.name.value = 'Jane';
// Logs: User: Jane, Theme: dark`}
      />

      <h2>Nested Combination</h2>

      <p>
        You can nest <code>combineWatch</code> to observe more complex structures:
      </p>

      <CodeBlock
        language="typescript"
        code={`const countWatch = createStore(100);
const textWatch = createStore('hello');
const toggleWatch = createStore(false);

// Combine countWatch and textWatch
const combinedCountTextWatch = combineWatch([countWatch, textWatch]);

// Nest the combined watch with toggleWatch
const combinedAllWatch = combineWatch([combinedCountTextWatch, toggleWatch]);

combinedAllWatch(([countTextRef, toggleRef], isFirst) => {
  const [countRef, textRef] = countTextRef;

  console.log('Count:', countRef.value);
  console.log('Text:', textRef.value);
  console.log('Toggle:', toggleRef.value);
});`}
      />

      <h2>Read-Only Root Value</h2>

      <p>
        The combined store's root <code>.value</code> is read-only and shows a warning if accessed directly.
        Always access individual stores by index:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch1 = createStore(10);
const watch2 = createStore(20);

const combinedWatch = combineWatch([watch1, watch2]);
const combined = combinedWatch();

// ✗ Avoid: Accessing .value directly on combined store
console.log(combined.value);  // Warning + returns [10, 20]

// ✓ Correct: Access individual stores by index
console.log(combined[0].value);  // 10
console.log(combined[1].value);  // 20

// ✗ Cannot assign to combined .value
combined.value = [30, 40];  // Warning, no effect

// ✓ Update individual stores
combined[0].value = 30;
combined[1].value = 40;`}
      />

      <h2>Using with as const</h2>

      <p>
        For better TypeScript inference, use <code>as const</code> with the watches array:
      </p>

      <CodeBlock
        language="typescript"
        code={`const countWatch = createStore(100);
const textWatch = createStore('hello');

// With 'as const' for precise tuple typing
const combinedWatch = combineWatch([countWatch, textWatch] as const);

combinedWatch(([countRef, textRef]) => {
  // TypeScript knows:
  // countRef.value is number
  // textRef.value is string
  console.log(countRef.value + 1);      // OK
  console.log(textRef.value.toUpperCase());  // OK
});`}
      />

      <h2>Framework Integration</h2>

      <p>
        Combined watches work with framework connectors:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore, combineWatch } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const userWatch = createStore({ name: 'John' });
const cartWatch = createStore({ items: [] });

const combinedWatch = combineWatch([userWatch, cartWatch]);

// Create React hook from combined watch
const useCombinedStore = connectReact(combinedWatch);

function Dashboard() {
  const [user, cart] = useCombinedStore();

  return (
    <div>
      <p>User: {user.name.value}</p>
      <p>Cart items: {cart.items.value.length}</p>
    </div>
  );
}`}
      />

      <h2>Comparison with createComputed</h2>

      <p>
        Choose the right tool based on your needs:
      </p>

      <ul>
        <li>
          <strong>combineWatch</strong> - Groups stores, maintains individual access
        </li>
        <li>
          <strong>createComputed</strong> - Derives a new single value from stores
        </li>
      </ul>

      <CodeBlock
        language="typescript"
        code={`import { createStore, combineWatch, createComputed } from 'state-ref';

const widthWatch = createStore(10);
const heightWatch = createStore(20);

// combineWatch: Group stores as tuple
const dimensionsWatch = combineWatch([widthWatch, heightWatch]);
const dimensions = dimensionsWatch();
console.log(dimensions[0].value);  // 10 (width)
console.log(dimensions[1].value);  // 20 (height)

// createComputed: Derive new value
const areaWatch = createComputed(
  [widthWatch, heightWatch],
  ([w, h]) => w.value * h.value
);
const area = areaWatch();
console.log(area.value);  // 200 (computed area)`}
      />

      <h2>Use Cases</h2>

      <h3>Coordinating Multiple Stores</h3>

      <CodeBlock
        language="typescript"
        code={`const authWatch = createStore({ user: null, token: null });
const uiWatch = createStore({ theme: 'light', sidebar: true });
const dataWatch = createStore({ items: [], loading: false });

// Combine all app state
const appWatch = combineWatch([authWatch, uiWatch, dataWatch]);

appWatch(([auth, ui, data], isFirst) => {
  const user = auth.user.value;
  const theme = ui.theme.value;
  const loading = data.loading.value;

  if (isFirst) return;

  console.log('App state changed');
  console.log(\`User: \${user}, Theme: \${theme}, Loading: \${loading}\`);
});`}
      />

      <h3>Form with Multiple Fields</h3>

      <CodeBlock
        language="typescript"
        code={`const nameWatch = createStore('');
const emailWatch = createStore('');
const ageWatch = createStore(0);

const formWatch = combineWatch([nameWatch, emailWatch, ageWatch]);

// Validate form on any change
formWatch(([name, email, age], isFirst) => {
  const nameVal = name.value;
  const emailVal = email.value;
  const ageVal = age.value;

  if (isFirst) return;

  const isValid = nameVal.length > 0 &&
                  emailVal.includes('@') &&
                  ageVal >= 18;

  console.log('Form valid:', isValid);
});`}
      />

      <h2>TypeScript Support</h2>

      <p>
        <code>combineWatch</code> preserves type information for each store in the tuple:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore, combineWatch } from 'state-ref';

interface User {
  id: number;
  name: string;
}

interface Settings {
  theme: 'light' | 'dark';
  lang: string;
}

const userWatch = createStore<User>({ id: 1, name: 'John' });
const settingsWatch = createStore<Settings>({ theme: 'light', lang: 'en' });

const combinedWatch = combineWatch([userWatch, settingsWatch] as const);

combinedWatch(([userRef, settingsRef]) => {
  // Fully typed access
  const userId: number = userRef.id.value;
  const userName: string = userRef.name.value;
  const theme: 'light' | 'dark' = settingsRef.theme.value;
  const lang: string = settingsRef.lang.value;

  console.log(userId, userName, theme, lang);
});`}
      />

      <h2>Best Practices</h2>

      <ul>
        <li>
          <strong>Use for grouping related stores</strong> - When you need to react to multiple stores together
        </li>
        <li>
          <strong>Access by index</strong> - Always use <code>combined[0]</code>, <code>combined[1]</code>, etc.
        </li>
        <li>
          <strong>Use <code>as const</code></strong> - For better TypeScript tuple inference
        </li>
        <li>
          <strong>Prefer createComputed for derived values</strong> - Use combineWatch only when you need individual store access
        </li>
        <li>
          <strong>Access .value first in callbacks</strong> - Ensure subscription collection before conditionals
        </li>
      </ul>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/computed">createComputed</a> - Deriving single values from stores
        </li>
        <li>
          <a href="#/guide/create-store">createStore</a> - Creating individual stores
        </li>
        <li>
          <a href="#/guide/subscription">Subscription</a> - Understanding subscriptions
        </li>
        <li>
          <a href="#/guide/watch">Watch Function</a> - The watch function API
        </li>
      </ul>
    </div>
  );
});
