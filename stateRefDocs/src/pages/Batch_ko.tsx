import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const BatchKo = mount(() => {
  return () => (
    <div>
      <h1>batch</h1>

      <p>
        <code>batch</code>는 여러 번의 쓰기를 하나의 동기 알림 패스로 묶습니다.
        두 경로를 읽는 구독자가 쓰기마다 한 번씩이 아니라, 최종 값으로 한 번만
        실행됩니다.
      </p>

      <p>
        별도 진입점입니다. <code>state-ref</code>만 import하면 로드되지
        않으므로, 쓰지 않는 앱의 코어 번들 크기는 그대로입니다.
      </p>

      <h2>기본 사용법</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import { batch } from 'state-ref/batch';

const watch = createStore({ b: 0, c: 0 });

watch(state => {
  console.log(state.b.value, state.c.value);
}); // 의존성 수집을 위해 즉시 한 번 실행된다

const ref = watch();

batch(() => {
  ref.b.value = 3;
  ref.c.value = 4;
}); // 구독자가 3, 4로 한 번만 실행된다 — batch가 반환되기 전에`}
      />

      <p>
        batch가 없으면 그 구독자는 두 번 실행됩니다. <code>b</code>에 한 번,{' '}
        <code>c</code>에 한 번.
      </p>

      <h2>값은 즉시 바뀐다</h2>

      <p>
        <code>batch</code>가 미루는 것은 <em>알림</em>이지 쓰기가 아닙니다. 콜백
        안에서 읽으면 이미 새 값이 보입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`batch(() => {
  ref.b.value = 3;
  console.log(ref.b.value); // 3 — 이미 쓰였다
  ref.c.value = ref.b.value + 1; // 방금 쓴 값을 읽는다
});`}
      />

      <h2>구독자 안에서 쓰기</h2>

      <p>
        <code>watch</code> 콜백이 받은 ref도 batch 안에서 쓸 수 있습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`watch((state, isFirst) => {
  if (isFirst) return;
  batch(() => {
    state.b.value += 1;
    state.c.value += 1;
  });
});`}
      />

      <h2>중첩</h2>

      <p>
        중첩 호출은 가장 바깥 경계에서만 flush합니다. 내부적으로 batch를 쓰는
        헬퍼를 호출자가 다시 batch로 감싸도 동작이 유지됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`batch(() => {
  ref.b.value = 1;
  batch(() => {
    ref.c.value = 2;
  }); // 여기서는 flush하지 않는다
}); // 여기서 한 번 flush한다`}
      />

      <h2>batch가 하지 않는 것</h2>

      <ul>
        <li>
          <strong>트랜잭션이 아닙니다.</strong> 콜백이 예외를 던져도 이미 한
          쓰기는 그대로 남습니다. 되돌리지 않습니다.
        </li>
        <li>
          <strong>
            <code>await</code>를 건너뛸 수 없습니다.
          </strong>{' '}
          패스는 동기적이므로, await 이후의 쓰기는 batch 밖입니다.
        </li>
        <li>
          <strong>일반 쓰기를 바꾸지 않습니다.</strong> batch 밖의 쓰기는 여전히
          쓸 때마다 동기적으로 알립니다.
        </li>
        <li>
          <strong>
            <code>sync()</code>를 대체하지 않습니다.
          </strong>{' '}
          <code>createStoreManualSync</code>로 만든 스토어는 여전히 명시적
          호출이 필요합니다.
        </li>
      </ul>

      <h2>UMD</h2>

      <p>
        UMD 빌드는 동반 스크립트입니다. <code>state-ref.umd.js</code>를 먼저
        불러오고 그다음 <code>state-ref.batch.umd.js</code>를 불러온 뒤{' '}
        <code>stateRefBatch.batch</code>를 호출합니다.
      </p>

      <CodeBlock
        language="html"
        code={`<script src="state-ref.umd.js"></script>
<script src="state-ref.batch.umd.js"></script>
<script>
  const watch = stateRef.createStore({ b: 0, c: 0 });
  const ref = watch();
  stateRefBatch.batch(() => {
    ref.b.value = 3;
    ref.c.value = 4;
  });
</script>`}
      />

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/shared">번들 간 공유</a> - batch는 state-ref
          사본을 넘지 못합니다
        </li>
        <li>
          <a href="#/ko/guide/manual-sync">수동 동기화 (Flux)</a> - 구독자 실행
          시점을 제어하는 다른 방법
        </li>
        <li>
          <a href="#/ko/guide/subscription">구독</a> - 의존성이 수집되는 방식
        </li>
        <li>
          <a href="#/ko/guide/draft">createDraft</a> - 로컬 편집 세션을 위한 또
          다른 진입점
        </li>
      </ul>
    </div>
  );
});
