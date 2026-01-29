import { CodeBlock } from '@/components/CodeBlock';

export const AIAgentSkills = () => (
  <div class="prose prose-lg dark:prose-invert max-w-none">
    <h1 class="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-6">
      AI Agent Skills
    </h1>

    <p class="text-lg text-gray-600 dark:text-gray-400 mb-8">
      Help AI coding assistants write state-ref-style reactive code automatically
    </p>

    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 mb-8">
      <h3 class="text-lg font-medium text-purple-900 dark:text-purple-200 mb-2">
        Experimental by Design
      </h3>
      <p class="text-sm text-purple-800 dark:text-purple-300">
        This specification explores how state-ref can be applied as a first-class behavioral constraint for AI coding agents.
      </p>
    </div>

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      What is AI Agent Skills?
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      state-ref includes an AI agent skills package that helps AI coding assistants (Claude Code, GitHub Copilot, Cursor, etc.) automatically write state-ref-style reactive code.
    </p>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      When you have this skills package in your project, AI assistants will:
    </p>

    <ul class="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6">
      <li>Use <code class="text-sm">createStore</code> for reactive state management</li>
      <li>Access values via <code class="text-sm">.value</code> property correctly</li>
      <li>Use <code class="text-sm">watch(callback)</code> for subscriptions with proper dependency tracking</li>
      <li>Handle <code class="text-sm">AbortController</code> for cleanup</li>
      <li>Use framework connectors (<code class="text-sm">connectReact</code>, <code class="text-sm">connectVue</code>, etc.) appropriately</li>
      <li>Apply <code class="text-sm">createStoreManualSync</code> for Flux-like patterns</li>
    </ul>

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      Setup for Claude Code
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      Copy the skills folder to your project's <code class="text-sm">.claude/skills/</code> directory:
    </p>

    <CodeBlock
      language="bash"
      code={`# Unix/macOS/Linux
mkdir -p .claude/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref/

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path .claude/skills/state-ref
Copy-Item node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref -Recurse

# Or manually create the directory and copy
mkdir -p .claude/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref/`}
    />

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      If your tool expects a single file, point it to <code class="text-sm">.claude/skills/state-ref/SKILL.md</code> or link that file to <code class="text-sm">.claude/skills/state-ref.md</code>.
    </p>

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      Setup for Codex
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      Copy the Codex skill to your project's <code class="text-sm">$CODEX_HOME/skills/</code> directory (default: <code class="text-sm">~/.codex/skills</code>):
    </p>

    <CodeBlock
      language="bash"
      code={`# Unix/macOS/Linux
mkdir -p ~/.codex/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* ~/.codex/skills/state-ref/

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$HOME/.codex/skills/state-ref"
Copy-Item node_modules/state-ref/dist/skills/state-ref/* $HOME/.codex/skills/state-ref -Recurse`}
    />

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      Recommended: Add CLAUDE.md to Your Project
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      For better reliability, create a <code class="text-sm">CLAUDE.md</code> file in your project root. This ensures AI agents read the state-ref skills package before writing code.
    </p>

    <CodeBlock
      language="bash"
      code={`# Project Instructions for AI Agents

## CRITICAL: state-ref Requirements

**Before writing ANY code, you MUST:**

1. Read \`.claude/skills/state-ref/SKILL.md\` **completely**
2. Follow the common-mistakes section **strictly**
3. Use the patterns shown in examples

**Non-negotiable rules:**
- Always access values via \`.value\` property
- Track dependencies inside subscription callbacks only
- Use \`AbortController.signal\` for cleanup
- In manual-sync mode, use \`updateRef\` and call \`sync()\`

**This is not optional - violating these patterns will break the codebase.**`}
    />

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6 mt-6">
      Place this file as <code class="text-sm">CLAUDE.md</code> in your project root. Claude Code will automatically read this file at the start of every conversation.
    </p>

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      How It Works
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      Once configured, AI assistants will automatically apply state-ref coding patterns when helping you write code.
    </p>

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8">
      Example: Before Skills File
    </h3>

    <CodeBlock
      language="typescript"
      code={`// AI might suggest manual state management
let count = 0;
const listeners: (() => void)[] = [];

function subscribe(callback: () => void) {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) listeners.splice(index, 1);
  };
}

function setCount(value: number) {
  count = value;
  listeners.forEach(fn => fn());
}`}
    />

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8">
      Example: After Skills File
    </h3>

    <CodeBlock
      language="typescript"
      code={`// AI suggests state-ref reactive style
import { createStore } from 'state-ref';

const watch = createStore({ count: 0 });

// Subscribe to changes
watch((ref, isFirst) => {
  console.log('Count:', ref.count.value);
});

// Update state
const ref = watch();
ref.count.value = 10;`}
    />

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      Skills File Location
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      The skills package is located at <code class="text-sm">node_modules/state-ref/dist/skills/state-ref/</code> after installation (includes <code class="text-sm">SKILL.md</code>, <code class="text-sm">examples/</code>, <code class="text-sm">reference/</code>, and <code class="text-sm">constraints/</code>).
    </p>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      You can also view it in the{' '}
      <a
        href="https://github.com/superlucky84/state-ref/blob/main/skills/state-ref/SKILL.md"
        target="_blank"
        rel="noopener noreferrer"
        class="text-blue-600 dark:text-blue-400 hover:underline"
      >
        GitHub repository
      </a>.
    </p>

    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mt-6">
      <p class="text-sm md:text-base text-blue-900 dark:text-blue-200 leading-relaxed">
        <span class="font-medium">Tip:</span> After setting up the skills package, you can ask your AI assistant questions like "refactor this to use state-ref" or "add reactive state management", and it will automatically apply the patterns.
      </p>
    </div>
  </div>
);
