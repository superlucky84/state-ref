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
   - React/Preact: \`const useStore = connectReact(watch)\`
   - Vue: \`const useStore = connectVue(watch)\`
   - Svelte: \`const store = connectSvelte(watch)\`
   - Solid: \`const useStore = connectSolid(watch)\`
   - Lithent: Use \`watch(renew)\` directly

IMPORT PATHS:
- Core: \`import { createStore, createStoreManualSync, combineWatch, createComputed } from 'state-ref'\`
- Helpers: \`import { lens, copyable, cloneDeep } from 'state-ref'\`
- React: \`import { connectReact } from '@stateref/connect-react'\`
- Preact: \`import { connectPreact } from '@stateref/connect-preact'\`
- Vue: \`import { connectVue } from '@stateref/connect-vue'\`
- Svelte: \`import { connectSvelte } from '@stateref/connect-svelte'\`
- Solid: \`import { connectSolid } from '@stateref/connect-solid'\`

GUIDANCE APPROACH:
When user requests could benefit from state-ref patterns:
1. Provide solution using state-ref patterns
2. Explain advantages of the reactive approach
3. If user prefers other state management, respect their choice

REFERENCE MATERIALS (NOT PART OF BEHAVIORAL RULES):

For detailed guidance on state-ref patterns and usage, refer to:
node_modules/state-ref/dist/skills/state-ref/

This reference material provides comprehensive examples, troubleshooting tips,
and pattern guidance that complements the behavioral guidelines above.`;

export const AIAgentAddonKo = () => (
  <div class="prose prose-lg dark:prose-invert max-w-none">
    <h1 class="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-6">
      AI Agent Role Add-on
    </h1>

    <p class="text-lg text-gray-600 dark:text-gray-400 mb-8">
      AI 코딩 에이전트에서 state-ref 패턴을 조건부로 가이드하는 재사용 가능한 행동 모듈
    </p>

    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 mb-8">
      <h3 class="text-lg font-medium text-purple-900 dark:text-purple-200 mb-2">
        실험적 기능
      </h3>
      <p class="text-sm text-purple-800 dark:text-purple-300">
        이 스펙은 state-ref가 AI 코딩 에이전트의 일급 행동 제약으로 어떻게 적용될 수 있는지 탐구합니다.
      </p>
    </div>

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      Agent Role Add-on이란?
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      state-ref Agent Role Add-on은 AI 코딩 에이전트(OpenCode, 커스텀 에이전트, IDE 확장 등)를 위한 복사-붙여넣기 준비된 행동 확장입니다. 프로젝트별 스킬 패키지와 달리, 이 add-on은 에이전트의 시스템 프롬프트에 직접 첨부되어 모든 프로젝트에서 작동합니다.
    </p>

    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
      <p class="text-sm md:text-base text-blue-900 dark:text-blue-200 leading-relaxed">
        <span class="font-medium">주요 차이점:</span> Skills 파일은 프로젝트별 구성입니다. Agent add-on은 프로젝트 컨텍스트에 따라 조건부로 활성화되는 글로벌 에이전트 행동입니다.
      </p>
    </div>

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8">
      주요 기능
    </h3>

    <ul class="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6">
      <li><strong>조건부 활성화:</strong> 프로젝트에서 state-ref가 감지된 경우에만 state-ref 패턴을 제안</li>
      <li><strong>자동 감지:</strong> <code class="text-sm">package.json</code>, <code class="text-sm">node_modules</code>, 기존 import 확인</li>
      <li><strong>비 state-ref 프로젝트 존중:</strong> state-ref가 설치되지 않은 경우 표준 코딩 관행 사용</li>
      <li><strong>단일 구성:</strong> 다양한 기술 스택을 가진 여러 프로젝트에서 작동</li>
      <li><strong>복사-붙여넣기 준비:</strong> 복잡한 설정 없이 에이전트의 시스템 프롬프트에 붙여넣기만 하면 됨</li>
    </ul>

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      이 Add-on을 사용해야 할 때
    </h2>

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6">
      사용해야 할 때:
    </h3>

    <ul class="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6">
      <li>state-ref를 사용하는 프로젝트와 사용하지 않는 프로젝트를 오가며 작업할 때</li>
      <li>state-ref가 감지되면 자동으로 패턴 가이드를 원할 때</li>
      <li>팀이 프로젝트별로 선택적으로 state-ref를 채택할 때</li>
      <li>프로젝트 컨텍스트에 맞게 적응하는 단일 에이전트 구성이 필요할 때</li>
    </ul>

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6">
      사용하지 말아야 할 때:
    </h3>

    <ul class="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6">
      <li>state-ref를 절대 사용하지 않는 프로젝트에서만 작업할 때</li>
      <li>반응형 패턴을 적용할 시점을 수동으로 제어하길 원할 때</li>
      <li>에이전트 구성이 글로벌이 아닌 프로젝트별일 때</li>
    </ul>

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      이 Add-on 첨부 방법
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      아래의 행동 제약 블록을 복사하여 AI 에이전트의 시스템 프롬프트 또는 구성에 붙여넣으세요.
    </p>

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6">
      이 블록 복사하기
    </h3>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
      아래의 전체 add-on 구성을 복사하세요:
    </p>

    <CodeBlock
      language="bash"
      code={ADDON_CODE}
    />

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      통합 예제
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
        [여기에 state-ref 제약 블록을 붙여넣으세요]`}
    />

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6">
      커스텀 에이전트 시스템 프롬프트
    </h3>

    <CodeBlock
      language="bash"
      code={`<your-existing-agent-role>
  <identity>
    You are a [에이전트 설명]...
  </identity>

  <capabilities>
    [에이전트 능력]...
  </capabilities>

  <!-- 여기에 state-ref 행동 제약 삽입 -->
  <coding-constraints>
    [여기에 state-ref 제약 블록을 붙여넣으세요]
  </coding-constraints>

  <workflow>
    [에이전트 워크플로우]...
  </workflow>
</your-existing-agent-role>`}
    />

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      작동 방식
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      add-on은 프로젝트 컨텍스트에 따라 행동을 조정하는 조건부 로직을 사용합니다:
    </p>

    <div class="space-y-6 mb-6">
      <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
        <h4 class="text-lg font-medium text-green-900 dark:text-green-200 mb-2">
          state-ref가 설치된 경우
        </h4>
        <p class="text-sm text-green-800 dark:text-green-300">
          에이전트가 state-ref 패턴을 제안하고, 반응형 접근 방식의 이점을 설명하며, 명확성을 위해 세밀한 반응성을 우선시하면서 사용자 선호도를 존중합니다.
        </p>
      </div>

      <div class="bg-gray-50 dark:bg-gray-800/20 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">
          state-ref가 설치되지 않은 경우
        </h4>
        <p class="text-sm text-gray-700 dark:text-gray-400">
          에이전트가 프로젝트에 적합한 표준 코딩 관행을 사용하고, state-ref를 언급하지 않으며, 기존 규칙을 존중합니다.
        </p>
      </div>
    </div>

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8">
      감지 메커니즘
    </h3>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
      에이전트는 다음을 통해 state-ref 가용성을 확인합니다:
    </p>

    <ul class="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6">
      <li><code class="text-sm">package.json</code> 의존성 선언 (가장 신뢰할 수 있음)</li>
      <li><code class="text-sm">node_modules</code> 디렉토리 존재 (설치 확인)</li>
      <li>기존 import 문 (사용 확인)</li>
    </ul>

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      전체 문서
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      완전한 add-on 문서는 설치 후 <code class="text-sm">node_modules/state-ref/dist/ai-addons/state-ref-agent-addon.md</code>에서 확인할 수 있습니다.
    </p>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      {' '}
      <a
        href="https://github.com/superlucky84/state-ref/blob/main/state-ref-agent-addon.md"
        target="_blank"
        rel="noopener noreferrer"
        class="text-blue-600 dark:text-blue-400 hover:underline"
      >
        GitHub 저장소
      </a>
      에서도 확인할 수 있습니다.
    </p>

    <div class="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 mt-6">
      <p class="text-sm md:text-base text-yellow-900 dark:text-yellow-200 leading-relaxed">
        <span class="font-medium">중요:</span> 이 add-on은 시스템 프롬프트를 지원하는 에이전트를 위해 설계되었습니다. 프로젝트별 AI 지원(Claude Code의 skills 등)의 경우 <a href="#/ko/ai-agent-skills" class="text-yellow-700 dark:text-yellow-300 hover:underline">AI Agent Skills</a> 파일을 대신 사용하세요.
      </p>
    </div>
  </div>
);
