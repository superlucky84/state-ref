import { lmount, mountCallback, ref } from 'lithent';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import css from 'highlight.js/lib/languages/css';

// Register languages
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('tsx', typescript); // TSX uses TypeScript highlighting
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('css', css); // CSS must be registered before HTML for embedded CSS highlighting
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml); // HTML uses XML highlighting
hljs.registerLanguage('jsx', typescript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);

interface CodeBlockProps {
  code: string;
  language?: string;
}

const isTaggedTemplate = (code: string) => code.includes('lTag`');

const swapLTagToHtml = (code: string) => code.replace(/lTag`/g, 'html`');
const swapHtmlToLTag = (html: string) => html.replace(/html`/g, 'lTag`');

export const CodeBlock = lmount<CodeBlockProps>(() => {
  const codeRef = ref<HTMLElement | null>(null);

  mountCallback(() => {
    if (!codeRef.value) return;

    const lang =
      codeRef.value.className.match(/language-(\w+)/)?.[1] || 'typescript';

    // Bash는 별도 처리
    if (lang === 'bash') {
      hljs.highlightElement(codeRef.value);
      if (codeRef.value.innerHTML) {
        codeRef.value.innerHTML = codeRef.value.innerHTML.replace(
          /^(\s*)\$(\s)/gm,
          '$1<span class="bash-prompt">$</span>$2'
        );
      }
      return;
    }

    // lTag 템플릿을 html 템플릿처럼 하이라이트하기 위해 임시 치환
    const original = codeRef.value.textContent || '';
    const needsSwap = isTaggedTemplate(original);
    const targetCode = needsSwap ? swapLTagToHtml(original) : original;

    const highlighted = hljs.highlight(targetCode, { language: lang }).value;
    codeRef.value.innerHTML = needsSwap
      ? swapHtmlToLTag(highlighted)
      : highlighted;
  });

  return ({ code, language }) => (
    <pre class="code-block bg-gray-100 dark:bg-[#1e1e1e] p-6 rounded-lg overflow-x-auto mb-6 text-xs md:text-sm border border-gray-200 dark:border-gray-800">
      <code ref={codeRef} class={`language-${language || 'typescript'}`}>
        {code}
      </code>
    </pre>
  );
});
