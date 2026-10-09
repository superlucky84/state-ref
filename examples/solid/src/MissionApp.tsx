import { Show } from 'solid-js';
import { connectSolid } from '@stateref/connect-solid';
import { createSyncQuery } from '@stateref/connect-solid/sync';
import {
  INITIAL_SHIPS,
  shipScreen,
  type Mission,
} from 'stateref-example-shared/mission';

export function createMissionApp(model: Mission) {
  function Stars() {
    const [stars, setStars] = connectSolid(model.counter)(ref => ref);
    return (
      <button
        class="star-counter"
        data-testid="star-counter"
        onClick={() => setStars(stars() + 1)}
      >
        ✦ 탐험 별 모으기 <b data-testid="stars">{stars()}</b>
      </button>
    );
  }
  function Panel(props: {
    id: number;
    poll: boolean;
    slot: string;
    saving: boolean;
  }) {
    const [select, q] = createSyncQuery(model.client, () =>
      model.options(props.id, props.poll)
    );
    const screen = select(ref => shipScreen(ref));
    return (
      <article
        class="ship-card"
        data-testid={`${props.slot}-panel`}
        data-ship-id={screen().id}
        data-phase={screen().phase}
      >
        <div class="card-heading">
          <span class="eyebrow">
            {props.slot === 'a' ? 'MAIN BRIDGE' : 'CO-PILOT DISPLAY'}
          </span>
          <span class="pill" data-testid={`${props.slot}-status`}>
            {screen().fetch === 'paused'
              ? '무선 대기'
              : screen().fetch === 'fetching'
              ? '통신 중'
              : screen().loaded
              ? '준비 완료'
              : '대기'}
          </span>
        </div>
        <h3 data-testid={`${props.slot}-title`}>
          {screen().loaded
            ? screen().name
            : screen().phase === 'error'
            ? '통신을 다시 시도해 주세요'
            : '우주선을 만나러 가는 중…'}
        </h3>
        <Show when={screen().error}>
          <p role="alert" data-testid={`${props.slot}-error`}>
            {screen().error}
          </p>
        </Show>
        <label>
          우주선 이름
          <input
            value={screen().name}
            disabled={!screen().loaded}
            data-testid={`${props.slot}-name`}
            onInput={event => model.edit(q, event.currentTarget.value)}
          />
        </label>
        <div class="ship-facts">
          <span>
            목적지 <b>{screen().destination || '—'}</b>
          </span>
          <span>
            연료 <b data-testid={`${props.slot}-fuel`}>{screen().fuel}</b>
          </span>
          <Show when={screen().id === 2}>
            <span>
              산소{' '}
              <b data-testid={`${props.slot}-oxygen`}>{screen().oxygen ?? 0}</b>
            </span>
          </Show>
        </div>
        <p class="cargo">{screen().cargo || '화물 정보를 확인하고 있어요.'}</p>
        <div class="tool-buttons">
          <button
            data-testid={`${props.slot}-refresh`}
            onClick={() => void model.refresh(q)}
          >
            새로고침
          </button>
          <button
            data-testid={`${props.slot}-invalidate`}
            onClick={() => model.invalidate(q)}
          >
            다시 확인
          </button>
          <button
            class="primary"
            data-testid={`${props.slot}-save`}
            disabled={!screen().loaded || props.saving}
            onClick={() => void model.save(q)}
          >
            {props.saving ? '저장 중…' : '정비소에 저장'}
          </button>
        </div>
        <p class="hint" data-testid={`${props.slot}-dirty`}>
          {screen().dirty
            ? '아직 저장하지 않은 편집이 있어요.'
            : '정비소와 같은 정보예요.'}
        </p>
      </article>
    );
  }
  return function MissionApp() {
    const [ui] = connectSolid(model.ui)(ref => ref);
    const control = (input: Record<string, unknown>) =>
      void model.control(input).catch(() => {
        model.ui().message.value = '설정을 바꾸지 못했어요.';
      });
    return (
      <main class="station" data-selected-id={ui().id}>
        <header class="topbar">
          <a class="brand" href="./mission.html">
            ✦ STARLIGHT GARAGE
          </a>
          <span class="framework">Solid</span>
        </header>
        <section class="hero">
          <div class="hero-copy">
            <span class="eyebrow">작은 편집, 새로운 탐험</span>
            <h1>별빛 정비소</h1>
            <p>우주선에 새 이름을 붙이고, 다음 모험을 준비하세요.</p>
          </div>
          <div class="orbit-art" aria-hidden="true">
            <span class="planet">✦</span>
            <span class="orbit" />
          </div>
        </section>
        <div class="mission-grid">
          <aside class="fleet">
            <span class="eyebrow">YOUR LITTLE FLEET</span>
            <h2>오늘의 우주선</h2>
            {INITIAL_SHIPS.map(ship => (
              <button
                class={`ship-choice ${
                  ui().open && ui().id === ship.id ? 'selected' : ''
                }`}
                data-testid={`choose-${ship.id}`}
                onClick={() => model.choose(ship.id)}
              >
                <span
                  class={`mini-planet planet-${ship.id}`}
                  aria-hidden="true"
                >
                  {['☾', '✧', '◎'][ship.id - 1]}
                </span>
                <span>
                  <strong>{ship.name}</strong>
                  <small>{ship.destination}</small>
                </span>
              </button>
            ))}
            <p class="hint">
              다른 우주선으로 갔다 돌아오면 최근 정보는 바로 보여요.
            </p>
          </aside>
          <section class="workspace">
            <div class="toolbar">
              <h2>우주선 정비</h2>
              <button data-testid="twin" onClick={model.toggleTwin}>
                {ui().twin ? '보조 화면 닫기' : '보조 화면 열기'}
              </button>
              <button data-testid="close" onClick={model.close}>
                정비 화면 닫기
              </button>
            </div>
            <Show
              when={ui().open}
              fallback={
                <div class="empty">
                  <span>☄</span>
                  <h3>어느 우주선부터 만나볼까요?</h3>
                  <p>왼쪽에서 우주선을 고르면 정비가 시작돼요.</p>
                </div>
              }
            >
              <Stars />
              <Panel
                id={ui().id}
                poll={ui().poll}
                slot="a"
                saving={ui().saving}
              />
              <Show when={ui().twin}>
                <Panel
                  id={ui().id}
                  poll={ui().poll}
                  slot="b"
                  saving={ui().saving}
                />
              </Show>
            </Show>
            <p class="message" role="status" data-testid="message">
              {ui().message}
            </p>
            <details class="tools">
              <summary>통신 실험실 · 일부러 어려운 상황 만들기</summary>
              <div class="tool-buttons">
                <button data-testid="online" onClick={model.toggleOnline}>
                  {ui().online ? '무선 연결 끊기' : '무선 연결 복구'}
                </button>
                <button data-testid="poll" onClick={model.togglePoll}>
                  {ui().poll ? '자동 조회 끄기' : '자동 조회 켜기'}
                </button>
                <button
                  data-testid="slow"
                  onClick={() => control({ delay: 1500 })}
                >
                  느린 통신
                </button>
                <button
                  data-testid="fail-read"
                  onClick={() => control({ failRead: true })}
                >
                  다음 조회 실패
                </button>
                <button
                  data-testid="reject-save"
                  onClick={() => control({ rejectSave: true })}
                >
                  다음 저장 거절
                </button>
                <button
                  data-testid="remote-change"
                  onClick={() => control({ change: ui().id })}
                >
                  다른 조종사의 연료 보충
                </button>
              </div>
              <p class="hint">
                무선 복구 뒤 기다리던 조회가 이어져요. 정비 화면을 모두 닫으면
                자동 조회도 멈춰요.
              </p>
            </details>
          </section>
        </div>
        <section class="equipment">
          <div>
            <span class="eyebrow">PREPARE YOUR NEXT JOURNEY</span>
            <h2>탐험 장비 꾸리기</h2>
            <p data-testid="equipment">{ui().equipment}</p>
          </div>
          <div class="tool-buttons">
            <button data-testid="draft-open" onClick={model.openDraft}>
              장비 미리 편집
            </button>
            <button
              data-testid="upgrade-normal"
              onClick={() => model.upgrade(false)}
            >
              두 장비 따로 보충
            </button>
            <button
              data-testid="upgrade-batch"
              onClick={() => model.upgrade(true)}
            >
              두 장비 한 번에 보충
            </button>
          </div>
          <p class="hint">
            마지막 보충 알림 {ui().batchNotices}회 · 한 번에 보충하면 화면도 한
            번에 따라와요.
          </p>
          <Show when={ui().draftOpen}>
            <div class="draft" data-testid="draft">
              <label>
                연료 미리 조정
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={ui().draftFuel}
                  data-testid="draft-fuel"
                  onInput={event =>
                    model.editDraft(Number(event.currentTarget.value))
                  }
                />
              </label>
              <button
                data-testid="draft-cancel"
                onClick={() => model.closeDraft(false)}
              >
                취소하고 돌아가기
              </button>
              <button
                data-testid="draft-apply"
                onClick={() => model.closeDraft(true)}
              >
                이 장비로 출발 준비
              </button>
            </div>
          </Show>
        </section>
        <details class="diagnostics">
          <summary>진단 · 실제 요청과 캐시</summary>
          <div class="stats">
            <span>
              조회 <b data-testid="reads">{ui().reads}</b>
            </span>
            <span>
              저장 <b data-testid="writes">{ui().writes}</b>
            </span>
            <span>
              취소 <b data-testid="cancelled">{ui().cancelled}</b>
            </span>
            <span>
              조회 소유자 <b data-testid="owners">{ui().owners}</b>
            </span>
            <span>
              별 수집 구독 <b data-testid="counters">{ui().counters}</b>
            </span>
            <span>
              장비 알림 <b data-testid="batch-notices">{ui().batchNotices}</b>
            </span>
          </div>
          <p data-testid="cache">{ui().cache}</p>
        </details>
        <footer>
          외부 계정 없이 브라우저와 로컬 정비소 사이에서만 동작해요. 페이지를
          다시 열면 편집이 초기화돼요. 저장한 우주선은 정비소 서버를 재시작할
          때까지 남아요.
        </footer>
      </main>
    );
  };
}
