import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';
import {
  lithentStoreExample,
  lithentQueryExample,
  lithentSaveExample,
  lithentSsrExample,
} from '@/content/lithent-sync';

export const Lithent = mount(() => {
  return () => (
    <div>
      <h1>Lithent Integration</h1>

      <p>
        Connect ordinary editable StateRef state with{' '}
        <code>connectLithent</code>. For server queries, use{' '}
        <code>createSyncQuery</code> from{' '}
        <code>@stateref/connect-lithent/sync</code> to manage loading and
        component lifetime.
      </p>

      <h2>Ordinary state with a connector</h2>
      <p>
        The connector is prepared on this branch and has not been published yet.
        Call it once in the mounter, read <code>counter().count.value</code> in
        render, and write through the same ref in event handlers. It subscribes
        after mount and aborts immediately on unmount. Server rendering reads
        without subscribing. The base entry needs no sync dependency.
      </p>
      <CodeBlock
        language="bash"
        code="pnpm add lithent state-ref @stateref/connect-lithent"
      />
      <CodeBlock language="typescript" code={lithentStoreExample} />
      <p>
        <code>connectLithent</code> returns an editable StateRef accessor.
        <code>connectLithentView</code> preserves the watch's ref type: a query
        display stays readonly, and an editable watch stays editable. Both share
        the same subscription and cleanup, and both read with{' '}
        <code>.value</code>.
      </p>

      <h2>Server queries in a component</h2>
      <p>
        The sync connector is prepared on this branch and has not been published
        yet. Both entries use ESM imports. It uses Lithent 1.24 or later and
        sync 0.3 or later. Create one client per app, then call the helper once
        in the mounter. A getter follows live props; a fixed object is enough
        for a fixed key. Read the accessor inside the render function.
      </p>
      <CodeBlock
        language="bash"
        code="pnpm add lithent state-ref @stateref/sync @stateref/connect-lithent"
      />
      <CodeBlock language="typescript" code={lithentQueryExample} />
      <p>
        The helper loads after mount, shares pending READs, and releases its
        subscription on unmount. A fresh cache needs no READ. Key changes
        immediately show that key's cache or pending state. The display is
        readonly; name edits through the loaded borrowed handle stay local. Do
        not dispose that handle. Refetch keeps local edits; the example handles
        its rejected Promise while the display shows the query error.
      </p>
      <h3>Save an edit</h3>
      <p>
        Add <code>const save = accountSave(client, q)</code> in the mounter and
        call it from a save handler. Capture at submission time and link the
        current handle. This example expects the server's full accepted Account.
        Check the returned mutation result before showing success; never
        automatically resend an uncertain WRITE.
      </p>
      <CodeBlock language="typescript" code={lithentSaveExample} />
      <h3>Server rendering</h3>
      <p>
        Use a request-scoped <code>ssr: true</code> client. Populate its cache
        before rendering and hydrate the browser client before mounting. The
        component's server render reads cached data without subscribing or
        starting another READ.
      </p>
      <CodeBlock language="typescript" code={lithentSsrExample} />
      <h3>Optional concurrent core</h3>
      <CodeBlock
        language="typescript"
        code={`// In the application's bundler, server and browser:
resolve: {
  alias: [{ find: /^lithent$/, replacement: 'lithent-concurrent' }],
}`}
      />
      <p>
        Tested with concurrent 0.1.3. Keep helper, SSR and JSX subpaths
        unchanged. The connector reports display changes to the renderer while
        rendering watched paths. It inherits the renderer's retry limits: builds
        with mounts or update effects can still commit mixed values. Options
        getters use an update callback. For an explicit query,{' '}
        <code>connectLithentView(query.watchDisplay)</code>
        manages the UI subscription; the query owner still loads and disposes
        it.
      </p>

      <h2>Direct watch integration</h2>
      <p>
        Direct <code>watch(renew)</code> remains available. Its subscription
        ends when a later watched-path notification calls the unmounted
        component's renew. Use <code>connectLithent</code> for immediate unmount
        cleanup.
      </p>

      <CodeBlock language="bash" code={`pnpm add state-ref lithent`} />

      <h2>Basic Usage</h2>

      <p>
        Pass the <code>renew</code> function from <code>mount()</code> directly
        to <code>watch()</code>:
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

      <p>Lithent's architecture makes StateRef integration seamless:</p>

      <ul>
        <li>
          <code>mount(renew =&gt; ...)</code> provides a <code>renew</code>{' '}
          function that triggers re-renders
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
        <li>The component re-renders with updated values</li>
      </ul>

      <h2>Component Structure</h2>

      <p>Lithent components have two phases - setup and render:</p>

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

      <p>Subscribe to multiple stores in a single component:</p>

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

      <p>Access deeply nested values naturally:</p>

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

      <p>Combine with StateRef helper functions:</p>

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

      <p>Handle form inputs with direct binding:</p>

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

      <p>Full type inference works automatically:</p>

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

      <h2>State and query lifetimes</h2>

      <p>
        State and query connectors both follow the component lifetime. Direct
        watch integration also remains available:
      </p>

      <ul>
        <li>
          Lithent's <code>renew</code> function has the exact signature StateRef
          expects
        </li>
        <li>
          The setup/render separation aligns perfectly with subscription
          patterns
        </li>
        <li>No framework-specific reactivity system to bridge</li>
        <li>
          State connectors and sync helpers abort their subscriptions on unmount
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
          <a href="#/guide/manual-sync">Manual Sync (Flux)</a> - action-based
          updates
        </li>
        <li>
          <a href="#/guide/computed">createComputed</a> - derived values
        </li>
      </ul>
    </div>
  );
});
