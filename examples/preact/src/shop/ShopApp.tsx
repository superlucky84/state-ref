import { useEffect, useRef } from 'preact/hooks';
import { connectPreact, connectPreactView } from '@stateref/connect-preact';
import {
  CATEGORIES,
  money,
  summarizeOrder,
} from 'stateref-example-shared/shop';
import type { ShopModel, ShopTab } from 'stateref-example-shared/shop';
import { productArt } from 'stateref-example-shared/shop-art';

type Props = { model: ShopModel };

function Catalog({ model }: Props) {
  const ui = connectPreact(model.watchUi)();
  const filters = connectPreact(model.watchFilters)();
  const feed = connectPreactView(model.feed.watchDisplay)().value;
  const search = connectPreactView(model.search.watchDisplay)().value;
  const display = search.enabled ? search : feed;
  const products = display.data ?? [];
  const busy = display.fetchStatus === 'fetching';
  return (
    <>
      <div class="shop-intro">
        <span class="eyebrow">FRESH FINDS, EVERY DAY</span>
        <h1>오늘 식탁에 작은 기쁨을.</h1>
        <p class="subtext">
          좋은 재료를 골라 담는 일부터, 모아 마켓과 함께해요.
        </p>
      </div>
      <div class="catalog-banner">
        <div>
          <strong>바쁜 하루에도, 신선하게</strong>
          <p>가볍게 담고 내일 아침 만나보세요.</p>
        </div>
        <span class="banner-mark">fresh & simple</span>
      </div>
      <div class="catalog-tools">
        <div class="category-tabs" aria-label="상품 분류">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              aria-pressed={filters.category.value === category.id}
              onClick={() => model.setCategory(category.id)}
            >
              {category.title}
            </button>
          ))}
        </div>
        <label class="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="상품 검색"
            placeholder="어떤 재료를 찾고 있나요?"
            value={ui.searchInput.value}
            onInput={event => model.setSearch(event.currentTarget.value)}
          />
        </label>
      </div>
      <div class="section-heading">
        <h2>{search.enabled ? '찾고 있는 재료' : '오늘의 추천'}</h2>
        <small>
          {busy ? '불러오는 중…' : `${products.length}개의 상품`}{' '}
          <button
            class="button link"
            onClick={() => void model.refreshProducts()}
            disabled={busy}
          >
            새로고침 ↻
          </button>
        </small>
      </div>
      {display.error && (
        <div class="notice error" role="alert">
          상품을 불러오지 못했어요. 기존 상품은 계속 볼 수 있어요.{' '}
          <button
            class="button link"
            onClick={() => void model.refreshProducts()}
          >
            다시 불러오기
          </button>
        </div>
      )}
      {!display.loaded && busy ? (
        <div class="state-panel" role="status">
          <span class="spinner" />
          신선한 상품을 고르고 있어요.
        </div>
      ) : products.length === 0 ? (
        <div class="state-panel">
          찾는 상품이 없어요. 다른 검색어를 입력해 보세요.
        </div>
      ) : (
        <div class="products">
          {products.map(product => (
            <article
              class="product-card"
              key={product.id}
              data-testid="product-card"
            >
              <div class="product-image">
                <img src={productArt(product.art)} alt="" />
                <span class="product-badge">매일 신선하게</span>
              </div>
              <div class="product-content">
                <h3>{product.title}</h3>
                <p>{product.subtitle}</p>
                <div class="product-bottom">
                  <strong>{money(product.price)}</strong>
                  <button
                    class="add-product"
                    aria-label={`${product.title} 장바구니 담기`}
                    onClick={() => model.addProduct(product)}
                  >
                    +
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {!search.enabled && display.loaded && model.feed.hasNextPage() && (
        <button
          class="button load-more"
          onClick={() => void model.loadMore()}
          disabled={busy}
        >
          {busy ? '불러오는 중…' : '상품 더 보기 ↓'}
        </button>
      )}
      <details class="test-tools">
        <summary>조회 동작을 더 확인해 보고 싶다면</summary>
        <div class="test-tool-body">
          <button
            class="button"
            onClick={() => void model.refreshProducts(true)}
            disabled={busy}
          >
            조회 실패 보기
          </button>
          <button class="button" onClick={() => model.changePrice()}>
            서버 가격 바꾸기
          </button>
        </div>
        <p class="test-stats">
          분류를 바꿨다가 돌아오면 30초 동안 캐시를 사용해요. 상품 조회{' '}
          <b data-testid="product-reads">{ui.productReads.value}회</b>
        </p>
      </details>
    </>
  );
}

function ShippingFields({ model }: Props) {
  const ref = connectPreact(model.profile.watch)();
  const status = connectPreact(model.profile.watchStatus)();
  return (
    <form
      class="panel"
      onSubmit={event => {
        event.preventDefault();
        void model.saveShipping();
      }}
    >
      <div class="panel-title">
        <h2>배송정보</h2>
        <span
          data-testid="shipping-status"
          class={`status-pill ${
            status.pending.value > 0
              ? 'busy'
              : status.dirty.value
              ? 'dirty'
              : ''
          }`}
        >
          {status.pending.value > 0
            ? '저장 중'
            : status.dirty.value
            ? '미저장 변경'
            : '저장됨'}
        </span>
      </div>
      <div class="field-grid">
        <label class="field">
          받는 분
          <input
            autoComplete="name"
            value={ref.recipient.value}
            onInput={event => {
              ref.recipient.value = event.currentTarget.value;
            }}
          />
        </label>
        <label class="field">
          연락처
          <input
            autoComplete="tel"
            value={ref.phone.value}
            onInput={event => {
              ref.phone.value = event.currentTarget.value;
            }}
          />
        </label>
      </div>
      <div class="label-row">
        <span>배송 주소</span>
        <button
          type="button"
          class="button link"
          onClick={() => model.openAddress()}
        >
          주소 수정
        </button>
      </div>
      <div class="address-box" data-testid="shipping-address">
        {ref.address.street.value}
        <small>{ref.address.detail.value}</small>
      </div>
      <label class="field">
        배송 요청사항
        <textarea
          value={ref.note.value}
          onInput={event => {
            ref.note.value = event.currentTarget.value;
          }}
        />
      </label>
      <div class="panel-footer">
        <span class="subtext">
          {status.pending.value > 0
            ? '저장 중에도 계속 입력할 수 있어요.'
            : '변경한 내용을 서버에 저장하세요.'}
        </span>
        <button
          data-testid="save-shipping"
          class="button primary"
          type="submit"
          disabled={!status.dirty.value || status.pending.value > 0}
        >
          {status.pending.value > 0 ? '저장 중…' : '저장하기'}
        </button>
      </div>
    </form>
  );
}

function Delivery({ model }: Props) {
  const ui = connectPreact(model.watchUi)();
  const status = connectPreact(model.profile.watchStatus)().value;
  const preview = connectPreactView(model.preview.watchDisplay)().data.value;
  return (
    <>
      <div class="shop-intro">
        <span class="eyebrow">A LITTLE CLOSER TO YOUR DOOR</span>
        <h1>어디로 보내드릴까요?</h1>
        <p class="subtext">
          배송정보를 바꾸면 오른쪽 미리보기에도 바로 반영돼요.
        </p>
      </div>
      {ui.restored.value && status.dirty && (
        <div class="notice">
          작성하던 배송정보를 복원했어요. 확인한 뒤 저장해 주세요.
        </div>
      )}
      <div class="two-column">
        {status.loaded ? (
          <ShippingFields model={model} />
        ) : (
          <div class="panel state-panel">
            {status.error ? (
              <>
                <p>배송정보를 불러오지 못했어요.</p>
                <button
                  class="button"
                  onClick={() => void model.refreshShipping()}
                >
                  다시 불러오기
                </button>
              </>
            ) : (
              <>
                <span class="spinner" />
                배송정보를 불러오고 있어요.
              </>
            )}
          </div>
        )}
        <aside>
          <div class="panel">
            <span class="preview-label">DELIVERY PREVIEW</span>
            <strong class="preview-name" data-testid="preview-name">
              {preview?.recipient ?? '불러오는 중…'}
            </strong>
            <div class="preview-text">
              {preview?.phone}
              <p data-testid="preview-address">{preview?.address}</p>
            </div>
            <div class="preview-note" data-testid="preview-note">
              {preview?.note || '배송 요청사항이 없어요.'}
            </div>
            <p class="subtext">미리보기는 작성 중인 내용을 보여줘요.</p>
          </div>
          <div class="hint">
            <b>직접 해보기</b>
            <span>
              저장하기를 누른 뒤 받는 분을 다시 바꿔보세요. 나중에 쓴 내용은
              미저장 상태로 남아요.
            </span>
          </div>
        </aside>
      </div>
      <details class="test-tools">
        <summary>저장 상황을 더 확인해 보고 싶다면</summary>
        <div class="test-tool-body">
          <button
            class="button"
            onClick={() => {
              model.ui.rejectNextSave.value = true;
              model.ui.notice.value =
                '다음 저장은 실패하도록 준비했어요. 내용을 바꾸고 저장해 보세요.';
            }}
          >
            다음 저장 실패
          </button>
          <label>
            <input
              type="checkbox"
              checked={ui.slowSave.value}
              onChange={event => {
                model.ui.slowSave.value = event.currentTarget.checked;
              }}
            />
            느린 저장 · 5초
          </label>
          <button
            class="button"
            onClick={() => void model.refreshShipping()}
            disabled={status.pending > 0}
          >
            배송정보 다시 불러오기
          </button>
        </div>
        <p class="test-stats">
          새로고침해도 작성 중인 배송정보를 보관해요. 저장 요청{' '}
          <b data-testid="save-count">{ui.saves.value}회</b>
        </p>
      </details>
    </>
  );
}

function Basket({ model }: Props) {
  const order = connectPreact(model.watchOrder)();
  const ui = connectPreact(model.watchUi)();
  const summary = summarizeOrder(order.value);
  return (
    <>
      <div class="shop-intro">
        <span class="eyebrow">YOUR NEXT GOOD MEAL</span>
        <h1>오늘의 장바구니</h1>
        <p class="subtext">
          주문 조건을 바꿔보고, 여러 변경을 한 번에 묶어보세요.
        </p>
      </div>
      <div class="two-column">
        <section class="panel">
          <div class="panel-title">
            <h2>담은 상품</h2>
            <span class="status-pill">1종</span>
          </div>
          <div class="cart-product">
            <img src={productArt(summary.art)} alt="" />
            <div>
              <h3>{summary.title}</h3>
              <span>{money(summary.unitPrice)} / 개</span>
            </div>
          </div>
          <div class="order-choice">
            <span>수량</span>
            <div class="quantity">
              <button
                aria-label="수량 줄이기"
                disabled={summary.quantity <= 1}
                onClick={() => {
                  order.quantity.value -= 1;
                }}
              >
                −
              </button>
              <output aria-label="주문 수량">{summary.quantity}</output>
              <button
                aria-label="수량 늘리기"
                onClick={() => {
                  order.quantity.value += 1;
                }}
              >
                +
              </button>
            </div>
          </div>
          <label class="order-choice">
            <span>웰컴 쿠폰 · 2,000원 할인</span>
            <input
              type="checkbox"
              checked={summary.coupon}
              onChange={event => {
                order.coupon.value = event.currentTarget.checked;
              }}
            />
          </label>
          <label class="order-choice">
            <span>배송 방법</span>
            <select
              value={summary.delivery}
              onChange={event => {
                order.delivery.value = event.currentTarget.value as
                  | 'standard'
                  | 'express';
              }}
            >
              <option value="standard">일반 배송 · 3,000원</option>
              <option value="express">빠른 배송 · 5,000원</option>
            </select>
          </label>
          <div class="batch-lab">
            <h3>추천 구성을 한 번에 적용해요</h3>
            <p class="subtext">수량 3개 + 웰컴 쿠폰 + 빠른 배송</p>
            <div class="batch-actions">
              <button class="button" onClick={() => model.applyBundle(false)}>
                일반 적용
              </button>
              <button
                class="button primary"
                onClick={() => model.applyBundle(true)}
              >
                batch 적용
              </button>
            </div>
            {ui.batchMode.value !== 'none' && (
              <div class="batch-result" aria-live="polite">
                <strong>
                  주문 요약 갱신{' '}
                  <span data-testid="notification-count">
                    {ui.batchTrail.value.length}회
                  </span>
                </strong>
                <p class="subtext">
                  {ui.batchMode.value === 'batch'
                    ? '최종 주문 내용으로 한 번 알렸어요.'
                    : '수량, 쿠폰, 배송 변경을 각각 알렸어요.'}
                </p>
                <ol aria-label="구독이 확인한 주문 요약">
                  {ui.batchTrail.value.map((item, index) => (
                    <li key={index}>
                      <span>
                        {index + 1}. {item.quantity}개 ·{' '}
                        {item.coupon ? '쿠폰 적용' : '쿠폰 없음'} ·{' '}
                        {item.delivery === 'express'
                          ? '빠른 배송'
                          : '일반 배송'}
                      </span>
                      <b>{money(item.total)}</b>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>
        <aside>
          <section class="panel">
            <h2>주문 요약</h2>
            <div class="money-row">
              <span>상품 금액</span>
              <strong>{money(summary.subtotal)}</strong>
            </div>
            <div class="money-row">
              <span>쿠폰 할인</span>
              <strong>−{money(summary.discount)}</strong>
            </div>
            <div class="money-row">
              <span>배송비</span>
              <strong>{money(summary.shipping)}</strong>
            </div>
            <div class="money-row total">
              <span>결제 예정 금액</span>
              <strong data-testid="order-total">{money(summary.total)}</strong>
            </div>
            <button
              class="button wide"
              onClick={() => model.setTab('delivery')}
            >
              배송정보 확인하기 →
            </button>
          </section>
          <div class="hint">
            <b>비교해보기</b>
            <span>
              일반 적용과 batch 적용을 차례로 눌러보세요. 주문 구성은 같고,
              store 구독이 받는 알림은 3회와 1회로 달라져요.
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}

function AddressDialog({ model }: Props) {
  const draft = model.draft!;
  const ref = connectPreact(draft.watch)();
  const status = connectPreact(draft.watchStatus)();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      class="shop-dialog"
      ref={dialog}
      aria-labelledby="address-title"
      onCancel={event => {
        event.preventDefault();
        model.closeAddress();
      }}
    >
      <h2 id="address-title">배송 주소 수정</h2>
      <p class="subtext">취소하면 기존 주소가 유지돼요.</p>
      <label class="field">
        주소
        <input
          value={ref.street.value}
          onInput={event => {
            ref.street.value = event.currentTarget.value;
          }}
          autoFocus
        />
      </label>
      <label class="field">
        상세 주소
        <input
          value={ref.detail.value}
          onInput={event => {
            ref.detail.value = event.currentTarget.value;
          }}
        />
      </label>
      {status.conflicts.value > 0 && (
        <div class="conflict" role="alert">
          <strong>다른 곳에서 주소가 변경됐어요.</strong>
          <p>
            새 주소: {model.profile.ref.address.street.value}
            <br />
            작성한 주소: {ref.street.value}
          </p>
          <button class="button" onClick={() => model.resolveAddress('draft')}>
            작성한 주소 유지
          </button>
          <button class="button" onClick={() => model.resolveAddress('source')}>
            새 주소 사용
          </button>
        </div>
      )}
      <details class="test-tools">
        <summary>주소 충돌 상황 테스트</summary>
        <div class="test-tool-body">
          <button
            class="button"
            onClick={() => void model.changeServerAddress()}
          >
            다른 기기에서 주소 변경
          </button>
        </div>
      </details>
      <div class="dialog-actions">
        <button class="button" onClick={() => model.closeAddress()}>
          취소
        </button>
        <button
          class="button primary"
          disabled={status.conflicts.value > 0}
          onClick={() => model.applyAddress()}
        >
          이 주소 적용
        </button>
      </div>
    </dialog>
  );
}

export default function ShopApp({ model }: Props) {
  const ui = connectPreact(model.watchUi)();
  const tabs: readonly { id: ShopTab; title: string }[] = [
    { id: 'catalog', title: '상품 둘러보기' },
    { id: 'delivery', title: '배송정보' },
    { id: 'batch', title: '장바구니 · batch' },
  ];
  return (
    <main class="shop">
      <header class="shop-header">
        <div class="shop-brand">
          <b aria-hidden="true">m</b>모아 마켓
        </div>
        <div class="shop-meta">
          <span>일상에 좋은 재료를 더해요</span>
          <span class="framework-tag">Preact</span>
        </div>
      </header>
      <nav class="shop-nav" aria-label="마켓 메뉴">
        {tabs.map(tab => (
          <button
            key={tab.id}
            aria-current={ui.tab.value === tab.id ? 'page' : undefined}
            onClick={() => model.setTab(tab.id)}
          >
            {tab.title}
          </button>
        ))}
      </nav>
      {ui.notice.value && (
        <div
          class={`notice ${ui.noticeTone.value}`}
          role={ui.noticeTone.value === 'error' ? 'alert' : 'status'}
        >
          {ui.notice.value}
        </div>
      )}
      {ui.tab.value === 'catalog' ? (
        <Catalog model={model} />
      ) : ui.tab.value === 'delivery' ? (
        <Delivery model={model} />
      ) : (
        <Basket model={model} />
      )}
      <footer class="shop-footer">
        <span>모아 마켓 · state-ref 사용자 흐름 예제</span>
        <button
          class="button link"
          onClick={() => {
            if (model.reset()) location.reload();
          }}
        >
          예제 초기화
        </button>
      </footer>
      {ui.draftOpen.value && (
        <AddressDialog model={model} key={ui.draftId.value} />
      )}
    </main>
  );
}
