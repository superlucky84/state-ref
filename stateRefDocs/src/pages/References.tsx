import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const References = mount(() => {
  return () => (
    <div>
      <h1>Understanding References</h1>

      <p>
        StateRef uses a reference-based tracking system to determine which state changes should trigger
        subscriptions. Understanding the difference between <strong>innerRef</strong>, <strong>outerRef</strong>,
        and <strong>unbound references</strong> is crucial for effective state management.
      </p>

      <h2>Three Types of References</h2>

      <p>
        When working with StateRef, you'll encounter three types of references:
      </p>

      <ul>
        <li>
          <strong>innerRef</strong> - The reference passed as the first parameter to subscription callbacks
        </li>
        <li>
          <strong>outerRef</strong> - The reference returned by <code>watch()</code> when subscribing
        </li>
        <li>
          <strong>Unbound reference</strong> - References created by calling <code>watch()</code> without a callback
        </li>
      </ul>

      <h2>InnerRef and OuterRef: The Same Reference</h2>

      <p>
        The most important concept to understand is that <strong>innerRef and outerRef are the same reference</strong>.
        Both are bound to the subscription and tracked for changes.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

const watch = createStore({ rowCount: 5, columnCount: 10 });

const subscribeCallback = (innerRef, isFirst) => {
  const matrixCount = innerRef.rowCount.value * innerRef.columnCount.value;
  console.log('Matrix count:', matrixCount);
};

// outerRef: Returned by watch(), bound to subscribeCallback
const outerRef = watch(subscribeCallback);

// Key insight: innerRef and outerRef are the SAME reference
// Both are tracked by the subscription`}
      />

      <h2>Key Principle: Tracking is Based on Reading, Not Writing</h2>

      <p>
        The most important concept: <strong>What matters is which reference you use to READ a property during subscription,
        not which reference you use to WRITE it later</strong>.
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ x: 1, y: 2 });

const anotherRef = watch();  // Unbound reference

const outerRef = watch((innerRef) => {
  // Reading x via innerRef → x is TRACKED
  console.log('x changed:', innerRef.x.value);

  // Reading y via anotherRef → y is NOT tracked
  console.log('y value:', anotherRef.y.value);
});

// Both trigger the callback (x was read via innerRef)
outerRef.x.value = 10;    // ✓ Triggers callback
anotherRef.x.value = 20;  // ✓ Triggers callback (because x is tracked!)

// Neither triggers the callback (y was read via anotherRef)
outerRef.y.value = 10;    // ✗ Does NOT trigger (y not tracked)
anotherRef.y.value = 20;  // ✗ Does NOT trigger (y not tracked)`}
      />

      <h2>Unbound References</h2>

      <p>
        An unbound reference is created by calling <code>watch()</code> without a callback.
        These references can read and write state but don't register any tracking.
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ count: 0, name: 'StateRef' });

// Unbound reference - no tracking
const unboundRef = watch();

// Read values
console.log(unboundRef.count.value);  // 0

// Write values - updates state but doesn't trigger subscriptions
unboundRef.count.value = 10;

// This reference exists independently of any subscription`}
      />

      <h2>Selective Property Tracking</h2>

      <p>
        Only properties <strong>read via tracked references (innerRef/outerRef)</strong> within the subscription callback are tracked.
        Once a property is tracked, <strong>any reference can modify it and trigger the callback</strong>.
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  rowCount: 5,
  columnCount: 10,
  etcCount: 3
});

// Create an unbound reference BEFORE subscription
const anotherRef = watch();

const subscribeCallback = (innerRef, isFirst) => {
  const result =
    innerRef.rowCount.value *      // ← Read via innerRef → TRACKED
    innerRef.columnCount.value *   // ← Read via innerRef → TRACKED
    anotherRef.etcCount.value;     // ← Read via unbound ref → NOT tracked

  console.log('Result:', result);
};

const outerRef = watch(subscribeCallback);

// Both trigger (rowCount was READ via innerRef → tracked)
anotherRef.rowCount.value = 10;     // ✓ Triggers
outerRef.rowCount.value = 15;       // ✓ Triggers

// Both trigger (columnCount was READ via innerRef → tracked)
anotherRef.columnCount.value = 5;   // ✓ Triggers
outerRef.columnCount.value = 8;     // ✓ Triggers

// Neither triggers (etcCount was READ via unbound ref → not tracked)
anotherRef.etcCount.value = 2;      // ✗ Does NOT trigger
outerRef.etcCount.value = 7;        // ✗ Does NOT trigger`}
      />

      <p>
        <strong>Key principle</strong>: Tracking is determined by <em>which reference was used to READ the property during subscription</em>,
        not which reference is used to WRITE it later. Once tracked, any write triggers the callback.
      </p>

      <h2>Why This Design?</h2>

      <p>
        This reference-based tracking system provides several benefits:
      </p>

      <ul>
        <li>
          <strong>Fine-grained control</strong> - You decide exactly which properties trigger updates
        </li>
        <li>
          <strong>Performance</strong> - Only tracked properties cause re-renders
        </li>
        <li>
          <strong>Flexibility</strong> - Mix tracked and untracked access in the same callback
        </li>
        <li>
          <strong>UI integration</strong> - OuterRef makes component integration seamless
        </li>
      </ul>

      <h2>Practical Example: Component Integration</h2>

      <p>
        The outerRef design makes UI library integration particularly elegant.
        Here's an example using a hypothetical component framework:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

const watch = createStore({ count: 0 });

const Component = mount((renew) => {
  // Pass renew as the subscription callback
  // It returns outerRef for use in the component
  const countRef = watch(renew);

  const increment = () => {
    // Update via outerRef - triggers renew
    countRef.value += 1;
  };

  return () => (
    <button onClick={increment}>
      Count: {countRef.value}
    </button>
  );
});`}
      />

      <h2>Multiple Independent Subscriptions</h2>

      <p>
        Each subscription has its own tracking context based on what properties were READ
        during its callback. Multiple subscriptions can coexist independently:
      </p>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ x: 1, y: 2 });

// First subscription: reads x → tracks x
const ref1 = watch((innerRef) => {
  console.log('Subscription 1 - x:', innerRef.x.value);
});

// Second subscription: reads y → tracks y
const ref2 = watch((innerRef) => {
  console.log('Subscription 2 - y:', innerRef.y.value);
});

// Triggers only first subscription (only subscription 1 tracks x)
ref1.x.value = 10;  // Logs: "Subscription 1 - x: 10"
ref2.x.value = 15;  // Also logs: "Subscription 1 - x: 15"

// Triggers only second subscription (only subscription 2 tracks y)
ref2.y.value = 20;  // Logs: "Subscription 2 - y: 20"
ref1.y.value = 25;  // Also logs: "Subscription 2 - y: 25"

// Each subscription has independent tracking`}
      />

      <h2>Common Patterns</h2>

      <h3>Avoiding Unintended Tracking</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ config: { theme: 'dark' }, data: [] });

// Create unbound ref for config (read-only, shouldn't trigger updates)
const configRef = watch();

const dataRef = watch((innerRef) => {
  // Only track data changes, not config
  console.log('Data updated:', innerRef.data.value);
  console.log('Current theme:', configRef.config.theme.value);
});

// Triggers callback (data is tracked)
dataRef.data.value = [1, 2, 3];

// Doesn't trigger callback (config accessed via unbound ref)
configRef.config.theme.value = 'light';`}
      />

      <h3>Mixed Tracking Strategy</h3>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({
  settings: { lang: 'en', notifications: true },
  user: { name: 'John', email: 'john@example.com' }
});

const settingsRef = watch();  // Unbound - for static config

const userRef = watch((innerRef) => {
  // Track user changes
  console.log('User:', innerRef.name.value, innerRef.email.value);

  // Access settings without tracking
  console.log('Language:', settingsRef.settings.lang.value);
});

// Triggers callback
userRef.name.value = 'Jane';

// Doesn't trigger callback
settingsRef.settings.lang.value = 'ko';`}
      />

      <h2>Visual Summary</h2>

      <CodeBlock
        language="typescript"
        code={`const watch = createStore({ a: 1, b: 2, c: 3 });

// ┌──────────────────────────────────────────┐
// │  Subscription Callback                   │
// ├──────────────────────────────────────────┤
// │  innerRef.a.value  ← READ via innerRef   │
// │  innerRef.b.value  ← READ via innerRef   │
// │  (c is never read)                       │
// └──────────────────────────────────────────┘
//         ↓
// ┌──────────────────────────────────────────┐
// │  Tracking Result                         │
// │  - 'a' is TRACKED                        │
// │  - 'b' is TRACKED                        │
// │  - 'c' is NOT tracked                    │
// └──────────────────────────────────────────┘
//         ↓
// ┌──────────────────────────────────────────┐
// │  ANY write to tracked properties         │
// │  triggers the callback                   │
// │                                          │
// │  outerRef.a.value = 10   ✓ triggers      │
// │  unboundRef.a.value = 10 ✓ triggers      │
// │  outerRef.b.value = 20   ✓ triggers      │
// │  unboundRef.b.value = 20 ✓ triggers      │
// │                                          │
// │  outerRef.c.value = 30   ✗ no trigger    │
// │  unboundRef.c.value = 30 ✗ no trigger    │
// └──────────────────────────────────────────┘

const outerRef = watch((innerRef) => {
  console.log(innerRef.a.value, innerRef.b.value);
});

const unboundRef = watch();

// Both trigger because 'a' was READ via innerRef
unboundRef.a.value = 10;  // ✓ Triggers
outerRef.a.value = 20;    // ✓ Triggers`}
      />

      <h2>Best Practices</h2>

      <ul>
        <li>
          <strong>Read via innerRef to track</strong> - Properties read via innerRef/outerRef are tracked; read via unbound refs to avoid tracking
        </li>
        <li>
          <strong>Use unbound refs for static data</strong> - Read configuration or constants via unbound refs so they don't trigger updates
        </li>
        <li>
          <strong>Be explicit about tracking</strong> - Make it clear which properties are tracked by choosing the right ref for reading
        </li>
        <li>
          <strong>Remember: READ determines tracking, WRITE doesn't</strong> - Any ref can trigger updates to tracked properties
        </li>
        <li>
          <strong>Leverage outerRef for components</strong> - Makes UI library integration natural
        </li>
        <li>
          <strong>Understand the tracking context</strong> - Each subscription has independent tracking
        </li>
      </ul>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/watch">Watch Function</a> - Understanding the watch function API
        </li>
        <li>
          <a href="#/guide/subscription">Subscription</a> - Advanced subscription patterns
        </li>
        <li>
          <a href="#/guide/state-ref-store">StateRefStore</a> - Working with store references
        </li>
        <li>
          <a href="#/guide/create-store">createStore</a> - Creating stores
        </li>
      </ul>
    </div>
  );
});
