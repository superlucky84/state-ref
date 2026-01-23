import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const Lithent = mount(() => {
  return () => (
    <div>
      <h1>Lithent Integration</h1>

      <p>
        Lithent is a lightweight Virtual DOM library. StateRef integrates directly with Lithent
        without needing a separate connector package. Simply pass the <code>renew</code> function
        to <code>watch()</code>.
      </p>

      <h2>Install</h2>

      <CodeBlock
        language="bash"
        code={`pnpm add state-ref lithent`}
      />

      <h2>Basic Usage</h2>

      <p>
        Pass the <code>renew</code> function from <code>mount()</code> directly to <code>watch()</code>:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStore } from 'state-ref';

type Profile = { name: string; age: number };

export const profileStore = createStore<Profile>({ name: 'Lee', age: 20 });`}
      />

      <CodeBlock
        language="tsx"
        code={`import { mount } from 'lithent';
import { profileStore } from './store';

export const ProfileCard = mount(renew => {
  // Pass renew directly to watch - no connector needed
  const store = profileStore(renew);

  return () => (
    <div>
      <p>Name: {store.name.value}</p>
      <button onClick={() => store.age.value += 1}>
        Age: {store.age.value}
      </button>
    </div>
  );
});`}
      />

      <h2>How It Works</h2>

      <p>
        Lithent's architecture makes StateRef integration seamless:
      </p>

      <ul>
        <li>
          <code>mount(renew =&gt; ...)</code> provides a <code>renew</code> function that triggers re-renders
        </li>
        <li>
          <code>watch(renew)</code> registers <code>renew</code> as a subscriber
        </li>
        <li>
          Returns a <code>StateRefStore</code> for reading and writing values
        </li>
        <li>
          Access values via <code>.value</code> property
        </li>
        <li>
          When values change, <code>renew</code> is called automatically
        </li>
        <li>
          The component re-renders with updated values
        </li>
      </ul>

      <h2>Component Structure</h2>

      <p>
        Lithent components have two phases - setup and render:
      </p>

      <CodeBlock
        language="tsx"
        code={`import { mount } from 'lithent';
import { profileStore } from './store';

export const MyComponent = mount(renew => {
  // Setup phase: runs once when component mounts
  const store = profileStore(renew);

  // You can define handlers here
  const incrementAge = () => {
    store.age.value += 1;
  };

  // Return render function
  return () => (
    // Render phase: runs on every update
    <div>
      <p>{store.name.value}</p>
      <button onClick={incrementAge}>
        Age: {store.age.value}
      </button>
    </div>
  );
});`}
      />

      <h2>Multiple Stores</h2>

      <p>
        Subscribe to multiple stores in a single component:
      </p>

      <CodeBlock
        language="typescript"
        code={`// stores.ts
import { createStore } from 'state-ref';

export const userStore = createStore({ name: 'John', age: 30 });
export const settingsStore = createStore({ theme: 'dark', lang: 'en' });`}
      />

      <CodeBlock
        language="tsx"
        code={`import { mount } from 'lithent';
import { userStore, settingsStore } from './stores';

export const Dashboard = mount(renew => {
  // Subscribe to multiple stores with the same renew
  const user = userStore(renew);
  const settings = settingsStore(renew);

  return () => (
    <div class={settings.theme.value}>
      <h1>Welcome, {user.name.value}!</h1>
      <p>Language: {settings.lang.value}</p>
      <button onClick={() => {
        settings.theme.value = settings.theme.value === 'dark' ? 'light' : 'dark';
      }}>
        Toggle Theme
      </button>
    </div>
  );
});`}
      />

      <h2>Nested Properties</h2>

      <p>
        Access deeply nested values naturally:
      </p>

      <CodeBlock
        language="tsx"
        code={`import { mount } from 'lithent';
import { createStore } from 'state-ref';

const appStore = createStore({
  user: {
    profile: {
      name: 'John',
      avatar: '/img/default.png'
    },
    preferences: {
      notifications: true
    }
  }
});

export const UserProfile = mount(renew => {
  const store = appStore(renew);

  return () => (
    <div>
      <img src={store.user.profile.avatar.value} alt="avatar" />
      <p>{store.user.profile.name.value}</p>
      <label>
        <input
          type="checkbox"
          checked={store.user.preferences.notifications.value}
          onChange={(e) => {
            store.user.preferences.notifications.value = e.target.checked;
          }}
        />
        Enable notifications
      </label>
    </div>
  );
});`}
      />

      <h2>Manual Sync with Actions</h2>

      <p>
        Use <code>createStoreManualSync</code> for Flux-style state management:
      </p>

      <CodeBlock
        language="typescript"
        code={`// store.ts
import { createStoreManualSync } from 'state-ref';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const counterStore = watch;

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};

export const decrement = () => {
  updateRef.count.value -= 1;
  sync();
};`}
      />

      <CodeBlock
        language="tsx"
        code={`import { mount } from 'lithent';
import { counterStore, increment, decrement } from './store';

export const Counter = mount(renew => {
  const store = counterStore(renew);

  return () => (
    <div>
      <button onClick={decrement}>-</button>
      <span>{store.count.value}</span>
      <button onClick={increment}>+</button>
    </div>
  );
});`}
      />

      <h2>Using with Helper Functions</h2>

      <p>
        Combine with StateRef helper functions:
      </p>

      <CodeBlock
        language="tsx"
        code={`import { mount } from 'lithent';
import { createStore, createComputed, combineWatch } from 'state-ref';

const firstNameStore = createStore({ value: 'John' });
const lastNameStore = createStore({ value: 'Doe' });

// Create computed value
const fullName = createComputed(
  [firstNameStore, lastNameStore],
  (first, last) => \`\${first.value.value} \${last.value.value}\`
);

export const NameDisplay = mount(renew => {
  const firstName = firstNameStore(renew);
  const lastName = lastNameStore(renew);
  const computed = fullName(renew);

  return () => (
    <div>
      <input
        value={firstName.value.value}
        onInput={(e) => firstName.value.value = e.target.value}
      />
      <input
        value={lastName.value.value}
        onInput={(e) => lastName.value.value = e.target.value}
      />
      <p>Full name: {computed.value}</p>
    </div>
  );
});`}
      />

      <h2>Form Handling</h2>

      <p>
        Handle form inputs with direct binding:
      </p>

      <CodeBlock
        language="tsx"
        code={`import { mount } from 'lithent';
import { createStore } from 'state-ref';

const formStore = createStore({
  name: '',
  email: '',
  message: ''
});

export const ContactForm = mount(renew => {
  const form = formStore(renew);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log({
      name: form.name.value,
      email: form.email.value,
      message: form.message.value
    });
  };

  return () => (
    <form onSubmit={handleSubmit}>
      <input
        value={form.name.value}
        onInput={(e) => form.name.value = e.target.value}
        placeholder="Name"
      />
      <input
        value={form.email.value}
        onInput={(e) => form.email.value = e.target.value}
        type="email"
        placeholder="Email"
      />
      <textarea
        value={form.message.value}
        onInput={(e) => form.message.value = e.target.value}
        placeholder="Message"
      />
      <button type="submit">Send</button>
    </form>
  );
});`}
      />

      <h2>TypeScript Tips</h2>

      <p>
        Full type inference works automatically:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';

type Todo = { title: string; done: boolean };
const todoStore = createStore<Todo>({ title: 'Write docs', done: false });

// In component
const store = todoStore(renew);
// store.title is StateRefStore<string>
// store.title.value is string
// store.done.value is boolean`}
      />

      <h2>Why No Connector?</h2>

      <p>
        Unlike other frameworks, Lithent doesn't need a connector because:
      </p>

      <ul>
        <li>
          Lithent's <code>renew</code> function has the exact signature StateRef expects
        </li>
        <li>
          The setup/render separation aligns perfectly with subscription patterns
        </li>
        <li>
          No framework-specific reactivity system to bridge
        </li>
        <li>
          Direct integration means zero overhead
        </li>
      </ul>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/create-store">createStore</a> - store creation
        </li>
        <li>
          <a href="#/guide/watch">Watch Function</a> - subscription behavior
        </li>
        <li>
          <a href="#/guide/manual-sync">Manual Sync (Flux)</a> - action-based updates
        </li>
        <li>
          <a href="#/guide/computed">createComputed</a> - derived values
        </li>
      </ul>
    </div>
  );
});
