# state-ref Agent Role Add-on

## What This Document Is

This document is a **reusable Agent Role Add-on** designed to guide state-ref reactive state management patterns in AI coding agents.

This is not:
- A human-readable tutorial
- An API reference
- A complete agent specification
- Framework-specific instructions

This is:
- A self-contained behavior module
- Copy-paste ready instructions for agent system prompts
- A composable extension that modifies existing agent roles
- A conditional guide that activates only when state-ref is detected

This add-on transforms any general-purpose coding agent into one that prioritizes state-ref's proxy-based reactivity and lens pattern **when state-ref is installed in the project**. No external documentation is required—all necessary context is embedded within this document.

## When to Use This Add-on

**Attach this add-on to your agent when:**
- You work across multiple projects, some using state-ref and others not
- You want automatic pattern guidance when state-ref is detected
- Your team adopts state-ref selectively per project
- You need a single agent configuration that adapts to project context

**This add-on automatically activates only when state-ref is installed.**

The agent will:
- Detect state-ref presence via `package.json` or `node_modules`
- Suggest state-ref patterns only in projects with state-ref installed
- Use standard state management practices in projects without state-ref
- Never suggest installing state-ref unless explicitly requested

**Do not attach this add-on when:**
- You exclusively work on projects that never use state-ref
- You prefer manual control over when to apply reactive patterns
- Your agent configuration is project-specific rather than global

## state-ref Coding Behavior (Copy-Paste Block)

```
You are a coding agent with state-ref reactive state management guidance enabled.

ACTIVATION CONDITIONS:

These guidelines apply ONLY when state-ref is installed in the current project.

Before suggesting state-ref patterns, verify state-ref availability:
1. Check if `package.json` contains state-ref in dependencies or devDependencies
2. Check if `node_modules/state-ref` directory exists
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
   - Use `createStore<T>(initialValue)` for auto-sync mode (default)
   - Use `createStoreManualSync<T>(initialValue)` for Flux-like patterns
   - Always specify generic type for complex objects
   - Primitive types (number, string) work directly

2. VALUE ACCESS
   - Always access values via `.value` property
   - `stateRef.user.name` returns proxy, not the actual value
   - `stateRef.user.name.value` returns the actual value
   - Assignments must also use `.value`: `ref.count.value = 10`

3. SUBSCRIPTION PATTERNS
   - Use `watch(callback)` to subscribe to changes
   - Callback signature: `(stateRef, isFirst) => AbortSignal | void`
   - `isFirst` is true on initial run, false on subsequent updates
   - Only `.value` reads inside callback are tracked as dependencies
   - Return `AbortController.signal` for cleanup/unsubscription

4. DEPENDENCY TRACKING
   - Use the callback's ref parameter (innerRef), not external refs
   - External refs created by `watch()` without callback are NOT tracked
   - Both innerRef (callback arg) and outerRef (return value) are same reference
   - Changes to non-tracked properties don't trigger re-runs

5. MANUAL SYNC MODE (FLUX-LIKE)
   - Destructure: `const { watch, updateRef, sync } = createStoreManualSync(...)`
   - `watch` refs are read-only in this mode
   - Modify state only via `updateRef`
   - Call `sync()` to notify all subscribers
   - Create action functions that encapsulate updateRef + sync

6. FRAMEWORK INTEGRATION
   - React/Preact: `const useStore = connectReact(watch)`
   - Vue: `const useStore = connectVue(watch)`
   - Svelte: `const store = connectSvelte(watch)`
   - Solid: `const useStore = connectSolid(watch)`
   - Lithent: Use `watch(renew)` directly

7. COMBINING STORES
   - Use `combineWatch([watch1, watch2] as const)` for multiple stores
   - Use `as const` for proper TypeScript inference
   - Nested combinations are supported

8. COMPUTED VALUES
   - Use `createComputed([watches], callback)` for derived values
   - Computed values are read-only
   - Can be used with framework connectors like regular watches

9. IMMUTABILITY
   - state-ref uses copy-on-write internally
   - Avoid direct mutation; always assign via `.value`
   - Use `copyable()` helper for manual copy-on-write when needed
   - Use `lens()` for functional lens-style immutable updates

10. PRACTICAL BALANCE
    - Use state-ref for shared state across components
    - Simple local state can use native framework state (useState, ref, etc.)
    - Don't overcomplicate simple scenarios

IMPORT PATHS:
- Core: `import { createStore, createStoreManualSync, combineWatch, createComputed } from 'state-ref'`
- Helpers: `import { lens, copyable, cloneDeep } from 'state-ref'`
- React: `import { connectReact } from '@stateref/connect-react'`
- Preact: `import { connectPreact } from '@stateref/connect-preact'`
- Vue: `import { connectVue } from '@stateref/connect-vue'`
- Svelte: `import { connectSvelte } from '@stateref/connect-svelte'`
- Solid: `import { connectSolid } from '@stateref/connect-solid'`

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
and pattern guidance that complements the behavioral guidelines above.
```

## Minimal state-ref Interface Context

This section provides minimal context to help agents locate and use state-ref functions without becoming an API reference.

### Store Creation
- **createStore** - Create auto-sync store (changes immediately notify subscribers)
- **createStoreManualSync** - Create manual-sync store (Flux-like, explicit sync)

### Watch Function
- **watch(callback)** - Subscribe to state changes, returns bound StateRefStore
- **watch()** - Get unbound StateRefStore reference (no tracking)

### Combining & Computing
- **combineWatch** - Combine multiple watches into single watch
- **createComputed** - Derive computed values from multiple watches

### Helper Functions
- **lens** - Functional lens for immutable updates
- **copyable** - Manual copy-on-write helper
- **cloneDeep** - Deep clone utility

### Framework Connectors
- **connectReact** - React hook connector (`@stateref/connect-react`)
- **connectPreact** - Preact hook connector (`@stateref/connect-preact`)
- **connectVue** - Vue reactive connector (`@stateref/connect-vue`)
- **connectSvelte** - Svelte store connector (`@stateref/connect-svelte`)
- **connectSolid** - Solid signal connector (`@stateref/connect-solid`)

### Key Types
- **StateRefStore<T>** - Proxied reference with `.value` accessor
- **Watch<T>** - Watch function type
- **Renew<T>** - Subscription callback type

## How to Attach This Add-on

### Integration Pattern

Insert the "state-ref Coding Behavior" block into your agent's system prompt:

```
<your-existing-agent-role>
  <identity>
    You are a [your agent description]...
  </identity>

  <capabilities>
    [your agent capabilities]...
  </capabilities>

  <!-- INSERT state-ref BEHAVIORAL GUIDELINES HERE -->
  <coding-guidelines>
    [Copy the entire "state-ref Coding Behavior (Copy-Paste Block)" section here]
  </coding-guidelines>

  <workflow>
    [your agent workflow]...
  </workflow>
</your-existing-agent-role>
```

### Configuration Files

For agent configuration files (YAML, JSON, etc.), adapt the guidelines to the format:

```yaml
agent:
  role: "Your Agent Role"
  extensions:
    - type: "state-ref-addon"
      content: |
        [Paste state-ref Coding Behavior guidelines here]
```

### Multiple Add-ons

This add-on composes with other role extensions:

```
<agent-role>
  <base-role>Your agent identity</base-role>
  <extension name="state-ref-addon">[state-ref guidelines]</extension>
  <extension name="security-addon">[security guidelines]</extension>
  <extension name="testing-addon">[testing guidelines]</extension>
</agent-role>
```

## Design Philosophy

### Why an Add-on, Not a Complete Agent Role?

This document is structured as an add-on rather than a complete agent definition because:

1. **Role Personalization**: Different teams have different agent personalities, capabilities, and workflows. A complete agent specification would impose unnecessary constraints on these preferences.

2. **Composition Over Prescription**: Agent roles should be composable. This add-on focuses solely on guiding state-ref patterns, allowing users to combine it with other behavioral extensions (testing strategies, security policies, documentation standards).

3. **Framework Agnostic**: Complete agent definitions often include framework-specific instructions or tool configurations. This add-on remains purely focused on coding behavior, independent of execution environment.

4. **Maintenance Simplicity**: Behavioral guidelines change less frequently than tool configurations or framework integrations. Separating concerns allows independent versioning and updates.

5. **Reusability Across Platforms**: Different AI platforms (Claude Code, custom agents, IDE extensions) have different configuration formats. A standalone behavioral module adapts more easily than a complete agent specification.

### Guidance vs. Enforcement

This add-on provides guidance rather than strict enforcement. The distinction is critical:

- **Guidance**: Agent suggests state-ref patterns and explains benefits
- **Enforcement**: Agent refuses to generate code that violates constraints

state-ref patterns benefit from guidance because:
- **Flexibility**: Some situations genuinely benefit from simpler state management
- **Learning curve**: Developers need time to understand reactive patterns
- **Pragmatism**: Simple local state doesn't always need shared stores
- **Context matters**: Not every component needs state-ref

### Balanced Approach

This add-on follows the state-ref SKILL.md philosophy:
- Use state-ref for shared state across components
- Simple local state can use native framework state
- Don't overcomplicate simple scenarios

**Why balanced over strict?**
1. **Readability first**: Reactive patterns should enhance, not obscure
2. **Respect developer judgment**: Not every state needs to be shared
3. **Gradual adoption**: Teams can adopt state-ref incrementally
4. **Avoid dogma**: Pragmatism over purity

### Selective Activation Based on Project Context

This add-on activates conditionally based on state-ref installation status:

**Why selective activation?**
1. **Avoid forcing dependencies**: Agents should not impose architectural decisions on projects that haven't adopted state-ref
2. **Respect existing patterns**: Projects without state-ref likely have established state management conventions that should be honored
3. **Prevent confusion**: Suggesting state-ref patterns without state-ref available creates import errors and confusion
4. **Enable experimentation**: Teams can evaluate state-ref by installing it, triggering automatic pattern guidance

**Detection mechanism:**
The agent verifies state-ref availability through:
- `package.json` dependency declarations (most reliable)
- `node_modules` directory presence (installation confirmation)
- Existing import statements (usage confirmation)

This detection-based activation allows a single agent configuration to work appropriately across multiple projects with different technology stacks.

### Design Constraints

This add-on intentionally avoids:
- **Complete API coverage**: Full API documentation belongs in separate references (skills/state-ref/ reference files)
- **Framework-specific patterns**: UI framework integration belongs in project-specific documentation
- **Implementation details**: Internal state-ref architecture is irrelevant to usage
- **Absolute prohibitions**: "Never" statements reduce flexibility and pragmatism

The goal is minimal, actionable guidance that modifies agent behavior without overwhelming the context window or duplicating external documentation.
