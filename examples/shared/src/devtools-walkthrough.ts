import './devtools-walkthrough.css';

const chapters = [
  {
    title: '오늘 정비할 우주선을 만나요',
    story:
      '다음 모험을 앞둔 우주선 한 척을 정비하면서, 화면 뒤에서 일어나는 변화를 함께 살펴봅니다.',
    action:
      '달빛 택배선을 고르고 잠깐 기다려 보세요. 같은 우주선을 보여주는 두 화면이 열립니다.',
    where: 'Application cache → Sync',
    notice:
      'mission 키의 캐시 한 줄과 owners 2를 찾아보세요. 두 화면이 하나의 데이터를 함께 보고 있다는 뜻입니다.',
  },
  {
    title: '작은 변화부터 따라가요',
    story:
      '출발 전에 탐험 별을 모아볼까요? 숫자 하나로 현재 값과 변경 이력의 차이를 익힙니다.',
    action: '정비 화면의 「탐험 별 모으기」를 세 번 눌러 보세요.',
    where: '탐험 별 → State, 그다음 Timeline',
    notice:
      'State의 $는 현재 별 개수입니다. Timeline에서는 0 → 1 → 2 → 3처럼 각각의 변화를 찾아보세요. 이미 눌렀다면 지금 개수부터 이어집니다.',
  },
  {
    title: '화면이 떠날 때 구독도 떠나요',
    story:
      '값이 바뀌면 누가 소식을 받을까요? 별을 보여주는 화면의 구독이 생기고 끝나는 순간을 봅니다.',
    action:
      'Subscriptions를 본 뒤 「정비 화면 닫기」를 누르세요. 같은 우주선을 다시 골라 화면을 열어 보세요.',
    where: '탐험 별 → Subscriptions / Timeline',
    notice:
      '닫으면 활성 구독이 사라지고, 다시 열면 새 구독이 생깁니다. 구독 실행 횟수는 컴포넌트 렌더 횟수와는 다릅니다.',
  },
  {
    title: '새 이름을 정비소에 남겨요',
    story:
      '이번에는 내 화면의 편집을 서버에 저장합니다. 편집 중인 상태와 저장 중인 작업을 구분해 봅니다.',
    action:
      '우주선 이름을 「나의 달빛호」로 바꾸세요. 보조 화면도 따라오는지 보고, 「정비소에 저장」을 누르세요.',
    where: 'Application cache → Sync, 그다음 Timeline',
    notice:
      '저장 중인 mutation과 이후 종료 이력을 찾아보세요. 이름 원문은 이 패널에 수집하지 않습니다. 실제 이름과 저장 결과는 정비 화면에서 확인합니다.',
  },
  {
    title: '장비를 미리 고쳐 보고 함께 바꿔요',
    story:
      '출발 장비는 먼저 시험해 보고 적용할 수 있습니다. 여러 값을 한 번에 바꿀 때의 알림도 살펴봅니다.',
    action:
      '아래 「장비 미리 편집」에서 연료를 바꾸고 취소해 보세요. 다시 편집해 적용한 뒤, 「두 장비 따로 보충」과 「두 장비 한 번에 보충」을 차례로 눌러 보세요.',
    where: '탐험 장비 → State / Timeline',
    notice:
      '취소하면 원본 장비는 그대로이고, 적용하면 연료가 바뀝니다. 한 번에 보충한 fuel·cargo 쓰기에는 같은 batch 번호가 붙고, 앱의 마지막 보충 알림은 1회입니다.',
  },
  {
    title: '기록을 쉬어도 모험은 계속돼요',
    story: '마지막으로 도구를 조작해도 앱의 값은 그대로 움직이는지 확인합니다.',
    action:
      '관측창의 Pause를 누르고 장비를 보충하세요. Resume으로 돌아와 State와 Timeline을 보고, Clear로 이력만 비워 보세요.',
    where: '탐험 장비 → State / Timeline',
    notice:
      '재개하면 최신 장비와 pause 공백이 보입니다. Clear는 장비 값을 되돌리지 않습니다. Hide는 관측창만 접고 기록은 계속합니다.',
  },
];

/** Demo-only guidance. Navigation never runs application actions or marks tests passed. */
export function mountWalkthrough() {
  const host = document.createElement('aside');
  host.setAttribute('data-devtools-walkthrough', '');
  host.setAttribute('aria-label', 'DevTools 둘러보기');
  host.innerHTML = `
    <div class="tour-intro">
      <span class="tour-kicker">처음 만나는 state-ref DevTools</span>
      <h2>한 척을 정비하며 살펴보기</h2>
      <p>약 10분 · 앱에서 해보고, 관측창에서 변화를 찾아보세요.</p>
    </div>
    <details class="tour-guide" open>
      <summary>이야기를 따라 둘러보기 <span class="tour-count"></span></summary>
      <progress max="6" value="1" aria-label="현재 안내 단계"></progress>
      <div class="tour-chapter" aria-live="polite" aria-atomic="true">
        <h3 tabindex="-1"></h3>
        <p class="tour-story"></p>
        <div class="tour-task"><strong>앱에서 해보기</strong><p class="tour-action"></p></div>
        <div class="tour-observe"><strong>관측창에서 보기</strong><p class="tour-where"></p><p class="tour-notice"></p></div>
      </div>
      <nav aria-label="안내 단계 이동"><button type="button" data-tour="previous">이전</button><span>해본 뒤 다음으로 넘어가세요</span><button type="button" data-tour="next">다음 이야기 →</button></nav>
    </details>
    <details class="tour-inspector">
      <summary>관측창 <span>값 · 이력 · 구독 · 서버 작업</span></summary>
      <div data-tour-inspector></div>
    </details>
    <details class="tour-extra">
      <summary>한 바퀴 더 둘러보고 싶다면</summary>
      <p>앱의 「통신 실험실」에서 다음 저장 거절을 예약하고 이름을 바꿔 저장해 보세요. 입력은 남고 저장 거절 안내가 보이는지 확인합니다.</p>
      <p>느린 통신을 켜고 우주선을 바꿔 보세요. 「진단」의 요청·취소·소유자 숫자와 Sync의 메타데이터를 함께 볼 수 있습니다.</p>
      <p>이름 저장은 이 로컬 서버를 재시작할 때까지 남습니다. 페이지를 새로고침하면 화면과 도구의 기록은 처음부터 시작합니다.</p>
    </details>`;
  document.body.classList.add('devtools-tour');
  document.body.insertBefore(host, document.getElementById('app'));
  const find = <T extends HTMLElement>(selector: string) =>
    host.querySelector<T>(selector)!;
  const inspectorDetails = find<HTMLDetailsElement>('.tour-inspector');
  inspectorDetails.open = window.matchMedia('(min-width: 1100px)').matches;
  const title = find<HTMLHeadingElement>('h3');
  const previous = find<HTMLButtonElement>('[data-tour=previous]');
  const next = find<HTMLButtonElement>('[data-tour=next]');
  const events = new AbortController();
  let chapter = 0;
  const render = (focus = false) => {
    const current = chapters[chapter];
    find('.tour-count').textContent = `${chapter + 1} / ${chapters.length}`;
    find<HTMLProgressElement>('progress').value = chapter + 1;
    title.textContent = current.title;
    find('.tour-story').textContent = current.story;
    find('.tour-action').textContent = current.action;
    find('.tour-where').textContent = current.where;
    find('.tour-notice').textContent = current.notice;
    previous.disabled = chapter === 0;
    next.disabled = chapter === chapters.length - 1;
    next.textContent = next.disabled ? '마지막 이야기' : '다음 이야기 →';
    if (focus) title.focus({ preventScroll: true });
  };
  previous.addEventListener(
    'click',
    () => {
      chapter = Math.max(0, chapter - 1);
      render(true);
    },
    { signal: events.signal }
  );
  next.addEventListener(
    'click',
    () => {
      chapter = Math.min(chapters.length - 1, chapter + 1);
      render(true);
    },
    { signal: events.signal }
  );
  render();
  return {
    inspector: find('[data-tour-inspector]'),
    dispose() {
      events.abort();
      host.remove();
      document.body.classList.remove('devtools-tour');
    },
  };
}
