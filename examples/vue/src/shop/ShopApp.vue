<script setup lang="ts">
import { computed } from 'vue';
import { connectVue, connectVueView } from '@stateref/connect-vue';
import {
  CATEGORIES,
  money,
  summarizeOrder,
} from 'stateref-example-shared/shop';
import type { ShopModel, ShopTab } from 'stateref-example-shared/shop';
import { productArt } from 'stateref-example-shared/shop-art';
import ShippingFields from './ShippingFields.vue';
import AddressDialog from './AddressDialog.vue';

const { model } = defineProps<{ model: ShopModel }>();
const useUi = connectVue(model.watchUi);
const ui = useUi(state => state);
const searchInput = useUi(state => state.searchInput);
const slowSave = useUi(state => state.slowSave);
const filters = connectVue(model.watchFilters)(state => state);
const feed = connectVueView(model.feed.watchDisplay)(state => state.value);
const search = connectVueView(model.search.watchDisplay)(state => state.value);
const display = computed(() =>
  search.value.enabled ? search.value : feed.value
);
const products = computed(() => display.value.data ?? []);
const busy = computed(() => display.value.fetchStatus === 'fetching');
const status = connectVue(model.profile.watchStatus)(state => state);
const preview = connectVueView(model.preview.watchDisplay)(
  state => state.data.value
);
const useOrder = connectVue(model.watchOrder);
const order = useOrder(state => state);
const quantity = useOrder(state => state.quantity);
const coupon = useOrder(state => state.coupon);
const delivery = useOrder(state => state.delivery);
const summary = computed(() => summarizeOrder(order.value));
const tabs: readonly { id: ShopTab; title: string }[] = [
  { id: 'catalog', title: '상품 둘러보기' },
  { id: 'delivery', title: '배송정보' },
  { id: 'batch', title: '장바구니 · batch' },
];
const searchChanged = (event: Event) =>
  model.setSearch((event.target as HTMLInputElement).value);
const prepareFailure = () => {
  model.ui.rejectNextSave.value = true;
  model.ui.notice.value =
    '다음 저장은 실패하도록 준비했어요. 내용을 바꾸고 저장해 보세요.';
};
const resetExample = () => {
  if (model.reset()) location.reload();
};
</script>

<template>
  <main class="shop">
    <header class="shop-header">
      <div class="shop-brand"><b aria-hidden="true">m</b>모아 마켓</div>
      <div class="shop-meta">
        <span>일상에 좋은 재료를 더해요</span
        ><span class="framework-tag">Vue</span>
      </div>
    </header>
    <nav class="shop-nav" aria-label="마켓 메뉴">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :aria-current="ui.value.tab === tab.id ? 'page' : undefined"
        @click="model.setTab(tab.id)"
      >
        {{ tab.title }}
      </button>
    </nav>
    <div
      v-if="ui.value.notice"
      :class="['notice', ui.value.noticeTone]"
      :role="ui.value.noticeTone === 'error' ? 'alert' : 'status'"
    >
      {{ ui.value.notice }}
    </div>

    <template v-if="ui.value.tab === 'catalog'">
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
        <span class="banner-mark">fresh &amp; simple</span>
      </div>
      <div class="catalog-tools">
        <div class="category-tabs" aria-label="상품 분류">
          <button
            v-for="category in CATEGORIES"
            :key="category.id"
            :aria-pressed="filters.value.category === category.id"
            @click="model.setCategory(category.id)"
          >
            {{ category.title }}
          </button>
        </div>
        <label class="search-box"
          ><span aria-hidden="true">⌕</span
          ><input
            aria-label="상품 검색"
            placeholder="어떤 재료를 찾고 있나요?"
            :value="searchInput.value"
            @input="searchChanged"
        /></label>
      </div>
      <div class="section-heading">
        <h2>{{ search.enabled ? '찾고 있는 재료' : '오늘의 추천' }}</h2>
        <small
          >{{ busy ? '불러오는 중…' : `${products.length}개의 상품` }}
          <button
            class="button link"
            :disabled="busy"
            @click="model.refreshProducts()"
          >
            새로고침 ↻
          </button></small
        >
      </div>
      <div v-if="display.error" class="notice error" role="alert">
        상품을 불러오지 못했어요. 기존 상품은 계속 볼 수 있어요.
        <button class="button link" @click="model.refreshProducts()">
          다시 불러오기
        </button>
      </div>
      <div v-if="!display.loaded && busy" class="state-panel" role="status">
        <span class="spinner" />신선한 상품을 고르고 있어요.
      </div>
      <div v-else-if="products.length === 0" class="state-panel">
        찾는 상품이 없어요. 다른 검색어를 입력해 보세요.
      </div>
      <div v-else class="products">
        <article
          v-for="product in products"
          :key="product.id"
          class="product-card"
          data-testid="product-card"
        >
          <div class="product-image">
            <img :src="productArt(product.art)" alt="" /><span
              class="product-badge"
              >매일 신선하게</span
            >
          </div>
          <div class="product-content">
            <h3>{{ product.title }}</h3>
            <p>{{ product.subtitle }}</p>
            <div class="product-bottom">
              <strong>{{ money(product.price) }}</strong
              ><button
                class="add-product"
                :aria-label="`${product.title} 장바구니 담기`"
                @click="model.addProduct(product)"
              >
                +
              </button>
            </div>
          </div>
        </article>
      </div>
      <button
        v-if="!search.enabled && display.loaded && model.feed.hasNextPage()"
        class="button load-more"
        :disabled="busy"
        @click="model.loadMore()"
      >
        {{ busy ? '불러오는 중…' : '상품 더 보기 ↓' }}
      </button>
      <details class="test-tools">
        <summary>조회 동작을 더 확인해 보고 싶다면</summary>
        <div class="test-tool-body">
          <button
            class="button"
            :disabled="busy"
            @click="model.refreshProducts(true)"
          >
            조회 실패 보기</button
          ><button class="button" @click="model.changePrice()">
            서버 가격 바꾸기
          </button>
        </div>
        <p class="test-stats">
          분류를 바꿨다가 돌아오면 30초 동안 캐시를 사용해요. 상품 조회
          <b data-testid="product-reads">{{ ui.value.productReads }}회</b>
        </p>
      </details>
    </template>

    <template v-else-if="ui.value.tab === 'delivery'">
      <div class="shop-intro">
        <span class="eyebrow">A LITTLE CLOSER TO YOUR DOOR</span>
        <h1>어디로 보내드릴까요?</h1>
        <p class="subtext">
          배송정보를 바꾸면 오른쪽 미리보기에도 바로 반영돼요.
        </p>
      </div>
      <div v-if="ui.value.restored && status.value.dirty" class="notice">
        작성하던 배송정보를 복원했어요. 확인한 뒤 저장해 주세요.
      </div>
      <div class="two-column">
        <ShippingFields v-if="status.value.loaded" :model="model" />
        <div v-else class="panel state-panel">
          <template v-if="status.value.error"
            ><p>배송정보를 불러오지 못했어요.</p>
            <button class="button" @click="model.refreshShipping()">
              다시 불러오기
            </button></template
          ><template v-else
            ><span class="spinner" />배송정보를 불러오고 있어요.</template
          >
        </div>
        <aside>
          <div class="panel">
            <span class="preview-label">DELIVERY PREVIEW</span
            ><strong class="preview-name" data-testid="preview-name">{{
              preview?.recipient ?? '불러오는 중…'
            }}</strong>
            <div class="preview-text">
              {{ preview?.phone }}
              <p data-testid="preview-address">{{ preview?.address }}</p>
            </div>
            <div class="preview-note" data-testid="preview-note">
              {{ preview?.note || '배송 요청사항이 없어요.' }}
            </div>
            <p class="subtext">미리보기는 작성 중인 내용을 보여줘요.</p>
          </div>
          <div class="hint">
            <b>직접 해보기</b
            ><span
              >저장하기를 누른 뒤 받는 분을 다시 바꿔보세요. 나중에 쓴 내용은
              미저장 상태로 남아요.</span
            >
          </div>
        </aside>
      </div>
      <details class="test-tools">
        <summary>저장 상황을 더 확인해 보고 싶다면</summary>
        <div class="test-tool-body">
          <button class="button" @click="prepareFailure">다음 저장 실패</button
          ><label
            ><input v-model="slowSave.value" type="checkbox" />느린 저장 ·
            5초</label
          ><button
            class="button"
            :disabled="status.value.pending > 0"
            @click="model.refreshShipping()"
          >
            배송정보 다시 불러오기
          </button>
        </div>
        <p class="test-stats">
          새로고침해도 작성 중인 배송정보를 보관해요. 저장 요청
          <b data-testid="save-count">{{ ui.value.saves }}회</b>
        </p>
      </details>
    </template>

    <template v-else>
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
            <img :src="productArt(summary.art)" alt="" />
            <div>
              <h3>{{ summary.title }}</h3>
              <span>{{ money(summary.unitPrice) }} / 개</span>
            </div>
          </div>
          <div class="order-choice">
            <span>수량</span>
            <div class="quantity">
              <button
                aria-label="수량 줄이기"
                :disabled="quantity.value <= 1"
                @click="quantity.value -= 1"
              >
                −</button
              ><output aria-label="주문 수량">{{ quantity.value }}</output
              ><button aria-label="수량 늘리기" @click="quantity.value += 1">
                +
              </button>
            </div>
          </div>
          <label class="order-choice"
            ><span>웰컴 쿠폰 · 2,000원 할인</span
            ><input v-model="coupon.value" type="checkbox"
          /></label>
          <label class="order-choice"
            ><span>배송 방법</span
            ><select v-model="delivery.value">
              <option value="standard">일반 배송 · 3,000원</option>
              <option value="express">빠른 배송 · 5,000원</option>
            </select></label
          >
          <div class="batch-lab">
            <h3>추천 구성을 한 번에 적용해요</h3>
            <p class="subtext">수량 3개 + 웰컴 쿠폰 + 빠른 배송</p>
            <div class="batch-actions">
              <button class="button" @click="model.applyBundle(false)">
                일반 적용</button
              ><button class="button primary" @click="model.applyBundle(true)">
                batch 적용
              </button>
            </div>
            <div
              v-if="ui.value.batchMode !== 'none'"
              class="batch-result"
              aria-live="polite"
            >
              <strong
                >주문 요약 갱신
                <span data-testid="notification-count"
                  >{{ ui.value.batchTrail.length }}회</span
                ></strong
              >
              <p class="subtext">
                {{
                  ui.value.batchMode === 'batch'
                    ? '최종 주문 내용으로 한 번 알렸어요.'
                    : '수량, 쿠폰, 배송 변경을 각각 알렸어요.'
                }}
              </p>
              <ol aria-label="구독이 확인한 주문 요약">
                <li v-for="(item, index) in ui.value.batchTrail" :key="index">
                  <span
                    >{{ index + 1 }}. {{ item.quantity }}개 ·
                    {{ item.coupon ? '쿠폰 적용' : '쿠폰 없음' }} ·
                    {{
                      item.delivery === 'express' ? '빠른 배송' : '일반 배송'
                    }}</span
                  ><b>{{ money(item.total) }}</b>
                </li>
              </ol>
            </div>
          </div>
        </section>
        <aside>
          <section class="panel">
            <h2>주문 요약</h2>
            <div class="money-row">
              <span>상품 금액</span
              ><strong>{{ money(summary.subtotal) }}</strong>
            </div>
            <div class="money-row">
              <span>쿠폰 할인</span
              ><strong>−{{ money(summary.discount) }}</strong>
            </div>
            <div class="money-row">
              <span>배송비</span><strong>{{ money(summary.shipping) }}</strong>
            </div>
            <div class="money-row total">
              <span>결제 예정 금액</span
              ><strong data-testid="order-total">{{
                money(summary.total)
              }}</strong>
            </div>
            <button class="button wide" @click="model.setTab('delivery')">
              배송정보 확인하기 →
            </button>
          </section>
          <div class="hint">
            <b>비교해보기</b
            ><span
              >일반 적용과 batch 적용을 차례로 눌러보세요. 주문 구성은 같고,
              store 구독이 받는 알림은 3회와 1회로 달라져요.</span
            >
          </div>
        </aside>
      </div>
    </template>
    <footer class="shop-footer">
      <span>모아 마켓 · state-ref 사용자 흐름 예제</span
      ><button class="button link" @click="resetExample">예제 초기화</button>
    </footer>
    <AddressDialog
      v-if="ui.value.draftOpen"
      :key="ui.value.draftId"
      :model="model"
    />
  </main>
</template>
