import { CodeBlock } from '@/components/CodeBlock';

export const AIAgentSkillsKo = () => (
  <div class="prose prose-lg dark:prose-invert max-w-none">
    <h1 class="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-6">
      AI Agent Skills
    </h1>

    <p class="text-lg text-gray-600 dark:text-gray-400 mb-8">
      AI 코딩 어시스턴트가 state-ref 스타일의 반응형 코드를 자동으로 작성하도록 도와줍니다
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
      AI Agent Skills란?
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      state-ref에는 AI 코딩 어시스턴트(Claude Code, GitHub Copilot, Cursor 등)가 자동으로 state-ref 스타일의 반응형 코드를 작성하도록 돕는 AI 에이전트 스킬 패키지가 포함되어 있습니다.
    </p>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      프로젝트에 이 스킬 패키지가 있으면, AI 어시스턴트는 다음을 수행합니다:
    </p>

    <ul class="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6">
      <li>반응형 상태 관리를 위해 <code class="text-sm">createStore</code> 사용</li>
      <li><code class="text-sm">.value</code> 속성을 통해 값에 올바르게 접근</li>
      <li>적절한 의존성 추적과 함께 <code class="text-sm">watch(callback)</code>을 사용한 구독</li>
      <li>정리를 위한 <code class="text-sm">AbortController</code> 처리</li>
      <li>프레임워크 커넥터(<code class="text-sm">connectReact</code>, <code class="text-sm">connectVue</code> 등)를 적절히 사용</li>
      <li>Flux 패턴을 위한 <code class="text-sm">createStoreManualSync</code> 적용</li>
    </ul>

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      Claude Code 설정
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      skills 폴더를 프로젝트의 <code class="text-sm">.claude/skills/</code> 디렉토리에 복사하세요:
    </p>

    <CodeBlock
      language="bash"
      code={`# Unix/macOS/Linux
mkdir -p .claude/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref/

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path .claude/skills/state-ref
Copy-Item node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref -Recurse

# 또는 수동으로 디렉토리를 만들고 복사
mkdir -p .claude/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref/`}
    />

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      도구가 단일 파일을 기대하는 경우, <code class="text-sm">.claude/skills/state-ref/SKILL.md</code>를 가리키거나 해당 파일을 <code class="text-sm">.claude/skills/state-ref.md</code>로 링크하세요.
    </p>

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      Codex 설정
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      Codex 스킬을 프로젝트의 <code class="text-sm">$CODEX_HOME/skills/</code> 디렉토리(기본값: <code class="text-sm">~/.codex/skills</code>)에 복사하세요:
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
      권장: 프로젝트에 CLAUDE.md 추가
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      더 나은 신뢰성을 위해 프로젝트 루트에 <code class="text-sm">CLAUDE.md</code> 파일을 생성하세요. 이렇게 하면 AI 에이전트가 코드를 작성하기 전에 state-ref 스킬 패키지를 읽게 됩니다.
    </p>

    <CodeBlock
      language="bash"
      code={`# AI 에이전트를 위한 프로젝트 지침

## 중요: state-ref 요구사항

**코드를 작성하기 전에 반드시:**

1. \`.claude/skills/state-ref/SKILL.md\`를 **완전히** 읽으세요
2. common-mistakes 섹션을 **엄격히** 따르세요
3. 예제에 표시된 패턴을 사용하세요

**협상 불가 규칙:**
- 항상 \`.value\` 속성을 통해 값에 접근
- 구독 콜백 내부에서만 의존성 추적
- 정리를 위해 \`AbortController.signal\` 사용
- manual-sync 모드에서는 \`updateRef\`를 사용하고 \`sync()\` 호출

**이것은 선택사항이 아닙니다 - 이 패턴을 위반하면 코드베이스가 손상됩니다.**`}
    />

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6 mt-6">
      이 파일을 프로젝트 루트에 <code class="text-sm">CLAUDE.md</code>로 배치하세요. Claude Code는 모든 대화 시작 시 자동으로 이 파일을 읽습니다.
    </p>

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      작동 방식
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      설정이 완료되면, AI 어시스턴트는 코드 작성을 도울 때 자동으로 state-ref 코딩 패턴을 적용합니다.
    </p>

    <h3 class="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8">
      예제: Skills 파일 적용 전
    </h3>

    <CodeBlock
      language="typescript"
      code={`// AI가 수동 상태 관리를 제안할 수 있음
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
      예제: Skills 파일 적용 후
    </h3>

    <CodeBlock
      language="typescript"
      code={`// AI가 state-ref 반응형 스타일을 제안
import { createStore } from 'state-ref';

const watch = createStore({ count: 0 });

// 변경 사항 구독
watch((ref, isFirst) => {
  console.log('Count:', ref.count.value);
});

// 상태 업데이트
const ref = watch();
ref.count.value = 10;`}
    />

    <hr class="border-t border-gray-200 dark:border-gray-700 my-10" />

    <h2 class="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4">
      Skills 파일 위치
    </h2>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      스킬 패키지는 설치 후 <code class="text-sm">node_modules/state-ref/dist/skills/state-ref/</code>에 위치합니다 (<code class="text-sm">SKILL.md</code>, <code class="text-sm">examples/</code>, <code class="text-sm">reference/</code>, <code class="text-sm">constraints/</code> 포함).
    </p>

    <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
      {' '}
      <a
        href="https://github.com/superlucky84/state-ref/blob/main/skills/state-ref/SKILL.md"
        target="_blank"
        rel="noopener noreferrer"
        class="text-blue-600 dark:text-blue-400 hover:underline"
      >
        GitHub 저장소
      </a>
      에서도 확인할 수 있습니다.
    </p>

    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mt-6">
      <p class="text-sm md:text-base text-blue-900 dark:text-blue-200 leading-relaxed">
        <span class="font-medium">팁:</span> 스킬 패키지를 설정한 후, AI 어시스턴트에게 "state-ref를 사용하여 리팩토링해줘" 또는 "반응형 상태 관리를 추가해줘"와 같은 질문을 하면 자동으로 패턴이 적용됩니다.
      </p>
    </div>
  </div>
);
