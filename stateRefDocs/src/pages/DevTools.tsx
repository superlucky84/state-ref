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
        Wrap a root watch with <code>devtools()</code> from{' '}
        <code>@stateref/devtools/auto</code>. It returns the exact original
        watch, preserving its type and your framework connector calls. In Vite
        development, the first enabled registration starts one shared recorder
        and lazily opens one panel. Mask sensitive paths before recording.
      </p>
      <CodeBlock language="typescript" code={devtoolsBootstrapExample} />
      <p>
        The default panel floats over the page. Optional{' '}
        <code>{"panel: { target: element, layout: 'inline' }"}</code> on the
        first registration places it in your container. Passing{' '}
        <code>hot: import.meta.hot</code> releases that module's registration on
        HMR. Without it, registration lasts until explicit cleanup or page
        reload. <code>stopDevtools(watch)</code> stops that target;
        <code>stopDevtools()</code> stops all automatic registrations and
        removes the panel. Separate headless sessions are independent.
      </p>

      <p>
        The default production export is an identity function even with{' '}
        <code>enabled: true</code>; it imports no recorder or panel. SSR and{' '}
        <code>enabled: false</code> also leave the target untouched. Vite's
        development/production resolution and Node's development condition are
        verified; other bundlers must select the appropriate export condition.
        Repeating the same target does not duplicate it. Different targets can
        share a name; conflicting explicit names or masks for one target are
        rejected. Keep the same settings when registering it again.
      </p>

      <h2>Move the toggle button</h2>
      <p>
        Open Settings → Toggle button position to choose a corner without
        editing application code. Hide places the toggle there; reopening keeps
        the panel's original layout. The choice is remembered for the same
        origin. A saved valid choice overrides the optional initial{' '}
        <code>panel.buttonPosition</code>; otherwise the default is
        bottom-right. Options are top-left, top-right, bottom-left and
        bottom-right.
      </p>
      <p>
        Escape closes open settings first. If localStorage is blocked, movement
        still works for the current mount. Only the corner preference is saved,
        never app values or history. Inline panels keep their toggle inside the
        container and do not show this setting or access its storage.
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
        The same wrapper accepts a Sync client and returns the exact original
        client. Register the existing application client once; all six framework
        sync connectors keep their existing calls. Sync remains an optional
        dependency. Observation uses only public metadata: it starts no query,
        acquires no owners and retries no mutation. Settled mutation events may
        remain in bounded history after leaving the active-operation list.
        Continue creating a separate client per SSR request.
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
