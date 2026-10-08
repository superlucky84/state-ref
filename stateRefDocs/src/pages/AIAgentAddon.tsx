import { CodeBlock } from '@/components/CodeBlock';

const ADDON_CODE = `You are a coding agent with state-ref reactive state management guidance enabled.

ACTIVATION CONDITIONS:

These guidelines apply ONLY when state-ref is installed in the current project.

Before suggesting state-ref patterns, verify state-ref availability:
1. Check if \`package.json\` contains state-ref in dependencies or devDependencies
2. Check if \`node_modules/state-ref\` directory exists
3. Check if state-ref imports are present in existing code

If state-ref is NOT installed:
- Do not enforce these guidelines
- Use standard state management practices appropriate for the project
- Never suggest installing state-ref unless explicitly requested

If state-ref IS installed:
- Apply all guidelines below
- Suggest state-ref alternatives for complex state management
- Prioritize fine-grained reactivity patterns for clarity and performance

CODING GUIDELINES:

1. STORE CREATION
   - Use \`createStore<T>(initialValue)\` for auto-sync mode (default)
   - Use \`createStoreManualSync<T>(initialValue)\` for Flux-like patterns
   - Always specify generic type for complex objects
   - Primitive types (number, string) work directly

2. VALUE ACCESS
   - Always access values via \`.value\` property
   - \`stateRef.user.name\` returns proxy, not the actual value
   - \`stateRef.user.name.value\` returns the actual value
   - Assignments must also use \`.value\`: \`ref.count.value = 10\`

3. SUBSCRIPTION PATTERNS
   - Use \`watch(callback)\` to subscribe to changes
   - Callback signature: \`(stateRef, isFirst) => AbortSignal | void\`
   - \`isFirst\` is true on initial run, false on subsequent updates
   - Only \`.value\` reads inside callback are tracked as dependencies
   - Return \`AbortController.signal\` for cleanup/unsubscription

4. DEPENDENCY TRACKING
   - Use the callback's ref parameter (innerRef), not external refs
   - External refs created by \`watch()\` without callback are NOT tracked
   - Both innerRef (callback arg) and outerRef (return value) are same reference
   - Changes to non-tracked properties don't trigger re-runs

5. MANUAL SYNC MODE (FLUX-LIKE)
   - Destructure: \`const { watch, updateRef, sync } = createStoreManualSync(...)\`
   - \`watch\` refs are read-only in this mode
   - Modify state only via \`updateRef\`
   - Call \`sync()\` to notify all subscribers
   - Create action functions that encapsulate updateRef + sync

6. FRAMEWORK INTEGRATION
   - React: \`const useStore = connectReact(watch)\`; \`useStore()\` returns the ref
   - Preact: \`const useStore = connectPreact(watch)\`; same shape as React
   - Vue: \`connectVue(watch)(s => s.user.age)\` returns a reactive \`{ value }\`
   - Svelte: \`connectSvelte(watch)(s => s.user.age)\` returns a Writable (\`$age\`)
   - Svelte 5 runes: \`connectSvelteRunes(watch)(select)\` from
     \`@stateref/connect-svelte/runes\` returns \`{ value }\`
   - Solid: \`connectSolid(watch)(s => s.user.age)\` returns \`[get, set]\`
   - Lithent: Use \`watch(renew)\` directly
   - WRITE RULE: only a write that passes through the connector reaches the
     store. Assign \`.value\` of a selection (Solid: call the setter) or replace
     the whole object. Never mutate an object read from a selection: Vue makes
     it readonly, Solid and Svelte runes hand out frozen copies. Svelte's
     \`$user.name = x\` is fine (it compiles to \`set\`).
   - React/Preact render a component twice on mount (the second render
     collects dependencies); do not "fix" this
   - For a \`@stateref/sync\` query's display use \`connectReactView\`,
     \`connectPreactView\`, \`connectVueView\`, \`connectSvelteView\`,
     \`connectSolidView\` with \`query.watchDisplay\` (readonly)

7. COMBINING STORES
   - Use \`combineWatch([watch1, watch2] as const)\` for multiple stores
   - Use \`as const\` for proper TypeScript inference
   - Nested combinations are supported

8. COMPUTED VALUES
   - Use \`createComputed([watches], callback)\` for derived values
   - Computed values are read-only
   - Can be used with framework connectors like regular watches

9. IMMUTABILITY
   - state-ref uses copy-on-write internally
   - Avoid direct mutation; always assign via \`.value\`
   - Use \`copyable()\` helper for manual copy-on-write when needed
   - Use \`lens()\` for functional lens-style immutable updates

10. PRACTICAL BALANCE
    - Use state-ref for shared state across components
    - Simple local state can use native framework state (useState, ref, etc.)
    - Don't overcomplicate simple scenarios

11. LOCAL EDITS AND BATCHING (state-ref 3.1)
    - Edit-then-commit UI (form, dialog): \`createDraft(ref)\` from
      \`state-ref/draft\`; edit \`draft.ref\`, then \`apply()\`, \`reset()\` or
      \`discard()\`
    - \`apply()\` does not throw on conflict: check \`result.ok\` / \`result.reason\`
      and settle conflicts with \`draft.resolve(change, 'source' | 'draft')\`
    - \`apply()\` only updates the local store; it never contacts a server
    - Several synchronous writes, one notification pass: \`batch(() => {...})\`
      from \`state-ref/batch\` (no rollback, cannot span \`await\`)

12. SERVER DATA (only when \`@stateref/sync\` is installed)
    - One \`createSyncClient()\` per app; one per request for SSR
    - \`client.query({ queryKey, queryFn })\`, then \`await query.load()\`; \`ref\`
      throws before the first load
    - Edits to \`query.ref\` are local and never save by themselves
    - Save: \`const submission = query.capture()\` immediately before
      \`mutation.run(dto, { links: [{ query, submission, accept: { kind: 'refetch' } }] })\`
    - \`accept\` in \`run()\` is an object (\`{ kind: 'none' | 'submitted' |
      'refetch' }\` or \`{ kind: 'response', select }\`), never a string
    - Only \`MutationRejectedError\` yields \`rejected\`; other errors yield
      \`unknown\`, which keeps edits and must not be blindly resent
    - \`retry\` requires an \`idempotencyKey\` the server honours
    - "Saving" is \`status.pending.value > 0\`, not \`phase === 'pending'\`
    - Details: node_modules/state-ref/dist/skills/state-ref/reference/server-sync.md

13. SHARING ACROSS BUNDLES (state-ref 3.2, \`state-ref/shared\`)
    - Only for separately built bundles on one page; inside one bundle,
      export and import the watch
    - A value no bundle owns (a \`@stateref/sync\` client, UI state with a
      fixed initial value): \`ensureShared(name, create)\` with the same
      arguments in every bundle; it is always there, no guard
    - A store one bundle fills: that bundle calls
      \`provideShared(name, watch, { ready })\`; other bundles use
      \`sharedWatch(name)\`
    - A ref from \`sharedWatch\` has no paths until a guard has run:
      \`if (!isReady(ref)) return;\` (or \`isProvided(ref)\` to read loading and
      error state). Reading first throws; do not cast around it
    - Run once when ready: \`whenReady(name, callback)\`
    - With a connector use the view form: \`connectPreactView(sharedWatch(name))\`
    - One way per name; only the owner fetches into a provided store
    - Details: node_modules/state-ref/dist/skills/state-ref/reference/shared-across-bundles.md

IMPORT PATHS:
- Core: \`import { createStore, createStoreManualSync, combineWatch, createComputed } from 'state-ref'\`
- Helpers: \`import { lens, copyable, cloneDeep } from 'state-ref'\`
- Drafts: \`import { createDraft } from 'state-ref/draft'\`
- Batch: \`import { batch } from 'state-ref/batch'\`
- Shared across bundles: \`import { ensureShared, provideShared, sharedWatch, isProvided, isReady, whenReady } from 'state-ref/shared'\`
- React: \`import { connectReact, connectReactView } from '@stateref/connect-react'\`
- Preact: \`import { connectPreact, connectPreactView } from '@stateref/connect-preact'\`
- Vue: \`import { connectVue, connectVueView } from '@stateref/connect-vue'\`
- Svelte: \`import { connectSvelte, connectSvelteView } from '@stateref/connect-svelte'\`
- Svelte 5 runes: \`import { connectSvelteRunes } from '@stateref/connect-svelte/runes'\`
- Solid: \`import { connectSolid, connectSolidView } from '@stateref/connect-solid'\`
- Server sync: \`import { createSyncClient, MutationRejectedError } from '@stateref/sync'\`

GUIDANCE APPROACH:
When user requests could benefit from state-ref patterns:
1. Provide solution using state-ref patterns
2. Explain advantages of the reactive approach
3. If user prefers other state management, respect their choice

When existing code could be improved with state-ref:
1. Suggest state-ref refactoring when it adds clarity or performance
2. Explain the benefits of fine-grained reactivity
3. Don't force refactoring for trivial improvements

REFERENCE MATERIALS (NOT PART OF BEHAVIORAL RULES):

For detailed guidance on state-ref patterns and usage, refer to:
node_modules/state-ref/dist/skills/state-ref/

This reference material provides comprehensive examples, troubleshooting tips,
and pattern guidance that complements the behavioral guidelines above.`;

export const AIAgentAddon = () => (
  <div class="prose prose-lg dark:prose-invert max-w-none">
    <h1 class="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-6">
      AI Agent Role Add-on
    </h1>

    <p class="text-lg text-gray-600 dark:text-gray-400 mb-8">
      A reusable behavior module that conditionally guides state-ref patterns in
      AI coding agents
    </p>

    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 mb-8">
      <h3 class="text-lg font-medium text-purple-900 dark:text-purple-200 mb-2">
        Experimental by Design
      </h3>
      <p class="text-sm text-purple-800 dark:text-purple-300">
        This specification explores how state-ref can be applied as a
        first-class behavioral constraint for AI coding agents.
      </p>
    </div>

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      What is Agent Role Add-on?
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      The state-ref Agent Role Add-on is a copy-paste ready behavior extension
      for AI coding agents (OpenCode, custom agents, IDE extensions, etc.).
      Unlike skills packages that are project-specific, this add-on is attached
      directly to your agent's system prompt, making it work across all your
      projects.
    </p>

    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
      <p class="text-sm md:text-base text-blue-900 dark:text-blue-200 leading-relaxed">
        <span class="font-medium">Key Difference:</span> Skills files are
        per-project configurations. Agent add-ons are global agent behaviors
        that activate conditionally based on project context.
      </p>
    </div>

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8">
      Key Features
    </h3>

    <ul class="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6">
      <li>
        <strong>Conditional Activation:</strong> Only suggests state-ref
        patterns when state-ref is detected in the project
      </li>
      <li>
        <strong>Auto-Detection:</strong> Checks{' '}
        <code class="text-sm">package.json</code>,{' '}
        <code class="text-sm">node_modules</code>, and existing imports
      </li>
      <li>
        <strong>Respects Non-state-ref Projects:</strong> Uses standard coding
        practices when state-ref isn't installed
      </li>
      <li>
        <strong>Single Configuration:</strong> Works across multiple projects
        with different technology stacks
      </li>
      <li>
        <strong>Copy-Paste Ready:</strong> No complex setup, just paste into
        your agent's system prompt
      </li>
    </ul>

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      When to Use This Add-on
    </h2>

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6">
      Use When:
    </h3>

    <ul class="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6">
      <li>
        You work across multiple projects, some using state-ref and others not
      </li>
      <li>You want automatic pattern guidance when state-ref is detected</li>
      <li>Your team adopts state-ref selectively per project</li>
      <li>
        You need a single agent configuration that adapts to project context
      </li>
    </ul>

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6">
      Don't Use When:
    </h3>

    <ul class="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6">
      <li>You exclusively work on projects that never use state-ref</li>
      <li>You prefer manual control over when to apply reactive patterns</li>
      <li>Your agent configuration is project-specific rather than global</li>
    </ul>

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      How to Attach This Add-on
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      Copy the behavioral constraints block below and paste it into your AI
      agent's system prompt or configuration.
    </p>

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6">
      Copy This Block
    </h3>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
      Copy the entire add-on configuration below:
    </p>

    <CodeBlock language="bash" code={ADDON_CODE} />

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      Integration Examples
    </h2>

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6">
      OpenCode (.opencode/config.yaml)
    </h3>

    <CodeBlock
      language="bash"
      code={`agent:
  role: "Your Agent Role"
  extensions:
    - type: "state-ref-addon"
      content: |
        [Paste the state-ref constraints block here]`}
    />

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6">
      Custom Agent System Prompt
    </h3>

    <CodeBlock
      language="bash"
      code={`<your-existing-agent-role>
  <identity>
    You are a [your agent description]...
  </identity>

  <capabilities>
    [your agent capabilities]...
  </capabilities>

  <!-- INSERT state-ref BEHAVIORAL CONSTRAINTS HERE -->
  <coding-constraints>
    [Paste the state-ref constraints block here]
  </coding-constraints>

  <workflow>
    [your agent workflow]...
  </workflow>
</your-existing-agent-role>`}
    />

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      How It Works
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      The add-on uses conditional logic to adapt its behavior based on the
      project context:
    </p>

    <div class="space-y-6 mb-6">
      <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
        <h4 class="text-lg font-medium text-green-900 dark:text-green-200 mb-2">
          When state-ref is installed
        </h4>
        <p class="text-sm text-green-800 dark:text-green-300">
          The agent suggests state-ref patterns, explains benefits of reactive
          approaches, and respects user preferences while prioritizing
          fine-grained reactivity for clarity.
        </p>
      </div>

      <div class="bg-gray-50 dark:bg-gray-800/20 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">
          When state-ref is NOT installed
        </h4>
        <p class="text-sm text-gray-700 dark:text-gray-400">
          The agent uses standard coding practices appropriate for the project,
          never mentions state-ref, and respects existing conventions.
        </p>
      </div>
    </div>

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8">
      Detection Mechanism
    </h3>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
      The agent verifies state-ref availability through:
    </p>

    <ul class="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6">
      <li>
        <code class="text-sm">package.json</code> dependency declarations (most
        reliable)
      </li>
      <li>
        <code class="text-sm">node_modules</code> directory presence
        (installation confirmation)
      </li>
      <li>Existing import statements (usage confirmation)</li>
    </ul>

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      Full Documentation
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      The complete add-on documentation is available at{' '}
      <code class="text-sm">
        node_modules/state-ref/dist/ai-addons/state-ref-agent-addon.md
      </code>{' '}
      after installation.
    </p>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      You can also view it in the{' '}
      <a
        href="https://github.com/superlucky84/state-ref/blob/main/state-ref-agent-addon.md"
        target="_blank"
        rel="noopener noreferrer"
        class="text-blue-600 dark:text-blue-400 hover:underline"
      >
        GitHub repository
      </a>
      .
    </p>

    <div class="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 mt-6">
      <p class="text-sm md:text-base text-yellow-900 dark:text-yellow-200 leading-relaxed">
        <span class="font-medium">Important:</span> This add-on is designed for
        agents with system prompt support. For project-specific AI assistance
        (like Claude Code's skills), use the{' '}
        <a
          href="#/ai-agent-skills"
          class="text-yellow-700 dark:text-yellow-300 hover:underline"
        >
          AI Agent Skills
        </a>{' '}
        file instead.
      </p>
    </div>
  </div>
);
