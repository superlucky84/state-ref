import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const CloneDeepKo = mount(() => {
  return () => (
    <div>
      <h1>cloneDeep</h1>

      <p>
        <code>cloneDeep</code>는 평범한 객체와 배열을 재귀적으로 깊은 복사합니다.
        중첩된 데이터를 독립적으로 복제해야 할 때 사용하는 가벼운 유틸리티입니다.
      </p>

      <h2>기본 사용법</h2>

      <CodeBlock
        language="typescript"
        code={`import { cloneDeep } from 'state-ref';

const original = {
  user: { name: 'Lee', tags: ['dev', 'docs'] },
  count: 1
};

const copy = cloneDeep(original);

copy.user.name = 'Min';
copy.user.tags.push('review');

console.log(original.user.name); // 'Lee'
console.log(original.user.tags); // ['dev', 'docs']`}
      />

      <h2>배열과 객체</h2>

      <CodeBlock
        language="typescript"
        code={`const list = [{ id: 1 }, { id: 2 }];
const next = cloneDeep(list);

next[0].id = 999;
console.log(list[0].id); // 1`}
      />

      <h2>복사 범위</h2>

      <ul>
        <li>
          <strong>평범한 객체</strong> (열거 가능한 own 프로퍼티)
        </li>
        <li>
          <strong>배열</strong> (재귀적 깊은 복사)
        </li>
        <li>
          <strong>원시값</strong>은 그대로 반환
        </li>
      </ul>

      <h2>제한 사항</h2>

      <p>
        <code>cloneDeep</code>는 단순함을 우선한 구현입니다. 특수 객체나
        순환 참조는 지원하지 않습니다.
      </p>

      <ul>
        <li>
          <strong>미지원</strong>: Date, Map, Set, 클래스 인스턴스, 함수, 심볼,
          순환 참조
        </li>
        <li>
          <strong>프로토타입 보존 없음</strong> (plain object로 복사)
        </li>
      </ul>

      <h2>사용 시점</h2>

      <ul>
        <li>
          <strong>테스트 픽스처</strong> 또는 JSON 유사 데이터 복사
        </li>
        <li>
          <strong>방어적 복사</strong>가 필요할 때
        </li>
        <li>
          <strong>가벼운 유틸</strong>로 빠르게 처리하고 싶을 때
        </li>
      </ul>

      <h2>API 요약</h2>

      <CodeBlock language="typescript" code={`cloneDeep<T>(value: T): T`} />

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/copyable">copyable</a> - copy-on-write 업데이트
        </li>
        <li>
          <a href="#/ko/guide/lens">Lens 패턴</a> - 경로 기반 불변 업데이트
        </li>
      </ul>
    </div>
  );
});
