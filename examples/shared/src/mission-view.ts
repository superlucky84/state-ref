import type { Mission, MissionUi, ShipScreen } from './mission';
import type { QueryObserverControls } from '@stateref/sync';
import type { Ship } from './mission';
import { INITIAL_SHIPS } from './mission';

export type NodeFactory<N> = (
  tag: string,
  props: Record<string, unknown>,
  ...children: (N | string)[]
) => N;

/** Shared native vnode layout for React, Preact, Vue and Lithent. */
export function missionBoard<N>(
  h: NodeFactory<N>,
  ui: MissionUi,
  model: Mission,
  panels: N[],
  framework: string
): N {
  const button = (
    test: string,
    text: string,
    action: () => void,
    active = false
  ) =>
    h(
      'button',
      {
        'data-testid': test,
        onClick: action,
        class: active ? 'active' : '',
        'aria-pressed': active,
      },
      text
    );
  const control = (value: Record<string, unknown>) => {
    void model.control(value).catch(() => {
      model.ui().message.value = '설정을 바꾸지 못했어요. 다시 시도해 주세요.';
    });
  };
  return h(
    'main',
    { class: 'station', 'data-selected-id': ui.id },
    h(
      'header',
      { class: 'topbar' },
      h('a', { class: 'brand', href: './mission.html' }, '✦ STARLIGHT GARAGE'),
      h('span', { class: 'framework' }, framework)
    ),
    h(
      'section',
      { class: 'hero' },
      h(
        'div',
        { class: 'hero-copy' },
        h('span', { class: 'eyebrow' }, '작은 편집, 새로운 탐험'),
        h('h1', {}, '별빛 정비소'),
        h('p', {}, '우주선에 새 이름을 붙이고, 다음 모험을 준비하세요.')
      ),
      h(
        'div',
        { class: 'orbit-art', 'aria-hidden': 'true' },
        h('span', { class: 'planet' }, '✦'),
        h('span', { class: 'orbit' }, '')
      )
    ),
    h(
      'div',
      { class: 'mission-grid' },
      h(
        'aside',
        { class: 'fleet' },
        h('span', { class: 'eyebrow' }, 'YOUR LITTLE FLEET'),
        h('h2', {}, '오늘의 우주선'),
        ...INITIAL_SHIPS.map(ship =>
          h(
            'button',
            {
              class: `ship-choice ${
                ui.open && ui.id === ship.id ? 'selected' : ''
              }`,
              'data-testid': `choose-${ship.id}`,
              onClick: () => model.choose(ship.id),
            },
            h(
              'span',
              { class: `mini-planet planet-${ship.id}`, 'aria-hidden': 'true' },
              ['☾', '✧', '◎'][ship.id - 1]
            ),
            h(
              'span',
              {},
              h('strong', {}, ship.name),
              h('small', {}, ship.destination)
            )
          )
        ),
        h(
          'p',
          { class: 'hint' },
          '다른 우주선으로 갔다 돌아오면 최근 정보는 바로 보여요.'
        )
      ),
      h(
        'section',
        { class: 'workspace' },
        h(
          'div',
          { class: 'toolbar' },
          h('h2', {}, '우주선 정비'),
          button(
            'twin',
            ui.twin ? '보조 화면 닫기' : '보조 화면 열기',
            model.toggleTwin,
            ui.twin
          ),
          button('close', '정비 화면 닫기', model.close)
        ),
        ...(ui.open
          ? panels
          : [
              h(
                'div',
                { class: 'empty' },
                h('span', {}, '☄'),
                h('h3', {}, '어느 우주선부터 만나볼까요?'),
                h('p', {}, '왼쪽에서 우주선을 고르면 정비가 시작돼요.')
              ),
            ]),
        h(
          'p',
          { class: 'message', role: 'status', 'data-testid': 'message' },
          ui.message
        ),
        h(
          'details',
          { class: 'tools' },
          h('summary', {}, '통신 실험실 · 일부러 어려운 상황 만들기'),
          h(
            'div',
            { class: 'tool-buttons' },
            button(
              'online',
              ui.online ? '무선 연결 끊기' : '무선 연결 복구',
              model.toggleOnline
            ),
            button(
              'poll',
              ui.poll ? '자동 조회 끄기' : '자동 조회 켜기',
              model.togglePoll,
              ui.poll
            ),
            button('slow', '느린 통신', () => control({ delay: 1500 })),
            button('fail-read', '다음 조회 실패', () =>
              control({ failRead: true })
            ),
            button('reject-save', '다음 저장 거절', () =>
              control({ rejectSave: true })
            ),
            button('remote-change', '다른 조종사의 연료 보충', () =>
              control({ change: ui.id })
            )
          ),
          h(
            'p',
            { class: 'hint' },
            '무선 복구 뒤 기다리던 조회가 이어져요. 정비 화면을 모두 닫으면 자동 조회도 멈춰요.'
          )
        )
      )
    ),
    h(
      'section',
      { class: 'equipment' },
      h(
        'div',
        {},
        h('span', { class: 'eyebrow' }, 'PREPARE YOUR NEXT JOURNEY'),
        h('h2', {}, '탐험 장비 꾸리기'),
        h('p', { 'data-testid': 'equipment' }, ui.equipment)
      ),
      h(
        'div',
        { class: 'tool-buttons' },
        button('draft-open', '장비 미리 편집', model.openDraft),
        button('upgrade-normal', '두 장비 따로 보충', () =>
          model.upgrade(false)
        ),
        button('upgrade-batch', '두 장비 한 번에 보충', () =>
          model.upgrade(true)
        )
      ),
      h(
        'p',
        { class: 'hint' },
        `마지막 보충 알림 ${ui.batchNotices}회 · 한 번에 보충하면 화면도 한 번에 따라와요.`
      ),
      ...(ui.draftOpen
        ? [
            h(
              'div',
              { class: 'draft', 'data-testid': 'draft' },
              h(
                'label',
                {},
                '연료 미리 조정',
                h('input', {
                  type: 'number',
                  min: 0,
                  max: 200,
                  value: ui.draftFuel,
                  'data-testid': 'draft-fuel',
                  onInput: (event: Event) =>
                    model.editDraft(
                      Number((event.currentTarget as HTMLInputElement).value)
                    ),
                })
              ),
              button('draft-cancel', '취소하고 돌아가기', () =>
                model.closeDraft(false)
              ),
              button('draft-apply', '이 장비로 출발 준비', () =>
                model.closeDraft(true)
              )
            ),
          ]
        : [])
    ),
    h(
      'details',
      { class: 'diagnostics' },
      h('summary', {}, '진단 · 실제 요청과 캐시'),
      h(
        'div',
        { class: 'stats' },
        h(
          'span',
          {},
          '조회 ',
          h('b', { 'data-testid': 'reads' }, String(ui.reads))
        ),
        h(
          'span',
          {},
          '저장 ',
          h('b', { 'data-testid': 'writes' }, String(ui.writes))
        ),
        h(
          'span',
          {},
          '취소 ',
          h('b', { 'data-testid': 'cancelled' }, String(ui.cancelled))
        ),
        h(
          'span',
          {},
          '조회 소유자 ',
          h('b', { 'data-testid': 'owners' }, String(ui.owners))
        ),
        h(
          'span',
          {},
          '별 수집 구독 ',
          h('b', { 'data-testid': 'counters' }, String(ui.counters))
        ),
        h(
          'span',
          {},
          '장비 알림 ',
          h('b', { 'data-testid': 'batch-notices' }, String(ui.batchNotices))
        )
      ),
      h('p', { 'data-testid': 'cache' }, ui.cache)
    ),
    h(
      'footer',
      {},
      '외부 계정 없이 브라우저와 로컬 정비소 사이에서만 동작해요. 페이지를 다시 열면 편집이 초기화돼요. 저장한 우주선은 정비소 서버를 재시작할 때까지 남아요.'
    )
  );
}

export function shipCard<N>(
  h: NodeFactory<N>,
  screen: ShipScreen,
  model: Mission,
  q: QueryObserverControls<Ship>,
  slot: string,
  saving: boolean
): N {
  return h(
    'article',
    {
      class: 'ship-card',
      'data-testid': `${slot}-panel`,
      'data-ship-id': screen.id,
      'data-phase': screen.phase,
    },
    h(
      'div',
      { class: 'card-heading' },
      h(
        'span',
        { class: 'eyebrow' },
        slot === 'a' ? 'MAIN BRIDGE' : 'CO-PILOT DISPLAY'
      ),
      h(
        'span',
        {
          class: `pill ${screen.fetch === 'fetching' ? 'busy' : ''}`,
          'data-testid': `${slot}-status`,
        },
        screen.fetch === 'paused'
          ? '무선 대기'
          : screen.fetch === 'fetching'
          ? '통신 중'
          : screen.loaded
          ? '준비 완료'
          : '대기'
      )
    ),
    h(
      'h3',
      { 'data-testid': `${slot}-title` },
      screen.loaded
        ? screen.name
        : screen.phase === 'error'
        ? '통신을 다시 시도해 주세요'
        : '우주선을 만나러 가는 중…'
    ),
    ...(screen.error
      ? [
          h(
            'p',
            { role: 'alert', 'data-testid': `${slot}-error` },
            screen.error
          ),
        ]
      : []),
    h(
      'label',
      {},
      '우주선 이름',
      h('input', {
        value: screen.name,
        disabled: !screen.loaded,
        'data-testid': `${slot}-name`,
        onInput: (event: Event) =>
          model.edit(q, (event.currentTarget as HTMLInputElement).value),
      })
    ),
    h(
      'div',
      { class: 'ship-facts' },
      h('span', {}, '목적지 ', h('b', {}, screen.destination || '—')),
      h(
        'span',
        {},
        '연료 ',
        h('b', { 'data-testid': `${slot}-fuel` }, String(screen.fuel))
      ),
      ...(screen.id === 2
        ? [
            h(
              'span',
              {},
              '산소 ',
              h(
                'b',
                { 'data-testid': `${slot}-oxygen` },
                String(screen.oxygen ?? 0)
              )
            ),
          ]
        : [])
    ),
    h('p', { class: 'cargo' }, screen.cargo || '화물 정보를 확인하고 있어요.'),
    h(
      'div',
      { class: 'tool-buttons' },
      h(
        'button',
        {
          'data-testid': `${slot}-refresh`,
          onClick: () => {
            void model.refresh(q);
          },
        },
        '새로고침'
      ),
      h(
        'button',
        {
          'data-testid': `${slot}-invalidate`,
          onClick: () => model.invalidate(q),
        },
        '다시 확인'
      ),
      h(
        'button',
        {
          class: 'primary',
          'data-testid': `${slot}-save`,
          disabled: !screen.loaded || saving,
          onClick: () => {
            void model.save(q);
          },
        },
        saving ? '저장 중…' : '정비소에 저장'
      )
    ),
    h(
      'p',
      { class: 'hint', 'data-testid': `${slot}-dirty` },
      screen.dirty
        ? '아직 저장하지 않은 편집이 있어요.'
        : '정비소와 같은 정보예요.'
    )
  );
}

export function starCounter<N>(
  h: NodeFactory<N>,
  value: number,
  add: () => void
): N {
  return h(
    'button',
    { class: 'star-counter', 'data-testid': 'star-counter', onClick: add },
    '✦ 탐험 별 모으기 ',
    h('b', { 'data-testid': 'stars' }, String(value))
  );
}
