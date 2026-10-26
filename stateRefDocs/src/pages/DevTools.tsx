import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';
import {
  devtoolsDemoCommand,
  devtoolsBootstrapExample,
  devtoolsHeadlessExample,
  devtoolsSyncExample,
} from '@/content/devtools-examples';

export const DevTools = mount(() => {
  return () => (
    <div>
      <h1>DevTools</h1>
      <p>
        Follow a state change from its current value to its history and the
        subscriptions it wakes. <code>@stateref/devtools</code> provides a
        read-only recorder and an optional in-app panel for React, Preact, Vue,
        Svelte, Solid and Lithent. No browser extension is required.
      </p>
      <div class="my-6 rounded-lg border border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950/30">
        <strong>Version requirements</strong>
        <p>
          This guide targets state-ref 3.3.0 or later and DevTools 0.1.0.
          State-ref 3.2.2 does not contain the observation API. Build a matching
          workspace to try it locally, or install matching versions once they
          are available in npm.
        </p>
      </div>

      <h2>What the panel shows</h2>
      <ul>
        <li>
          <strong>State:</strong> the selected store's current, bounded value
          preview.
        </li>
        <li>
          <strong>Timeline:</strong> successful writes with before/after values,
          batch groups, subscription events and recording gaps.
        </li>
        <li>
          <strong>Subscriptions:</strong> read paths, observed runs and update
          causes. These are not component render counts.
        </li>
        <li>
          <strong>Sync:</strong> cache keys, owners, status and mutation
          metadata. Query data, mutation inputs/responses and error objects are
          omitted.
        </li>
      </ul>

      <h2>Start with a ten-minute story</h2>
      <p>
        From a repository checkout, use Node 24.19.0 and pnpm 9.12.3. These
        commands assume nvm; the repository also provides Volta pins.
      </p>
      <CodeBlock language="bash" code={devtoolsDemoCommand} />
      <p>
        The last command opens{' '}
        <a href="http://localhost:5181/mission.html?devtools=1">
          Starlight Garage on localhost:5181
        </a>
        . Its Korean walkthrough guides you through selecting a ship, collecting
        stars, checking subscriptions, saving a name, editing equipment and
        pausing the recorder. Each step pairs an app action with something to
        inspect. The guide works with all six mission demos.
      </p>
      <p>
        The inspector sits beside the app; on small screens, expand “관측창”
        when needed. Failure experiments stay folded away. Vite runs the local
        memory API too: no external service or environment file is needed. Stop
        with Ctrl+C. Later visits normally need only <code>nvm use</code> and{' '}
        <code>pnpm dev:devtools</code>. Rebuild after pulling library changes.
        Reload clears the recorder; restarting the server also resets saved ship
        names. Without <code>?devtools=1</code>, the mission has no guide or
        inspector.
      </p>

      <h2>Connect your own application</h2>
      <p>
        Keep the recorder and panel behind your development build condition.
        This Vite example leaves the application store in place and imports the
        tools only in the browser's development build. Redaction happens before
        values enter history. Register each original core watch by name.
      </p>
      <CodeBlock language="typescript" code={devtoolsBootstrapExample} />
      <p>
        The default panel floats over the page. For a dedicated container, use{' '}
        <code>layout: 'inline'</code> with that element as <code>target</code>.
        Call <code>stopDebugging()</code> when the application root is disposed;
        the HMR hook handles development replacement. Imports are SSR-safe, but
        mount the panel only after a browser target exists.
      </p>

      <h2>Use the recorder without a panel</h2>
      <p>
        The recorder is an ESM entry with no DOM requirement. Vite's dev server
        selects the development core automatically. For a Node development
        script, use <code>node --conditions=development script.mjs</code>.
        Attaching to the default production core is refused with a diagnostic.
      </p>
      <CodeBlock language="typescript" code={devtoolsHeadlessExample} />
      <p>
        <code>inspectStore()</code> reads current values immediately;
        <code>getSnapshot()</code> returns metadata and history already
        received. History arrives through microtasks, so a write does not
        synchronously notify a recorder listener. Detach stops one source;
        dispose stops the session and any connected panels.
      </p>

      <h2>Observe an existing Sync client</h2>
      <p>
        Sync is optional. Attaching observes the four public metadata methods;
        it does not start a query, acquire owners or retry a mutation. Settled
        mutation events can remain in bounded recorder history after leaving the
        client's active-operation list.
      </p>
      <CodeBlock language="typescript" code={devtoolsSyncExample} />

      <h2>Recording controls and limits</h2>
      <ul>
        <li>
          <strong>Pause / Resume:</strong> stop capture, then reconnect with a
          new generation and an explicit recording gap. The app keeps running.
        </li>
        <li>
          <strong>Clear:</strong> remove received history while keeping current
          app state and registered sources.
        </li>
        <li>
          <strong>Hide:</strong> fold the panel while recording continues.
          Unmount removes panel resources; session disposal stops recording.
        </li>
        <li>
          History defaults to 200 records or 1 MiB of serialized record data.
          Old or oversized records can be omitted and are reported.
        </li>
        <li>
          Previews bound depth, node count and bytes. Truncation and masking are
          visible. Record bytes are not a JavaScript heap limit.
        </li>
      </ul>
      <p>
        There is no state editing, time travel, undo/redo, automatic remote
        upload, persistent history or Redux DevTools adapter. Computed, combined
        and shared wrapper watches are not automatically unwrapped into
        observable root stores. This is a diagnostic view, not a complete replay
        log or permission to retry a server operation.
      </p>
      <h2>Related</h2>
      <ul>
        <li>
          <a href="#/guide/subscription">Subscription lifetimes</a>
        </li>
        <li>
          <a href="#/guide/batch">Batch writes and notifications</a>
        </li>
        <li>
          <a href="#/guide/sync-observation">Sync metadata observation</a>
        </li>
        <li>
          <a href="https://github.com/superlucky84/state-ref/blob/main/packages/devtools/README.md">
            Package setup and API guide
          </a>
        </li>
      </ul>
    </div>
  );
});
