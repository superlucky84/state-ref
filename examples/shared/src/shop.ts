import { createStore } from 'state-ref';
import { batch } from 'state-ref/batch';
import { createDraft } from 'state-ref/draft';
import type { Draft } from 'state-ref/draft';
import { createSyncClient, MutationRejectedError } from '@stateref/sync';
import type {
  LocalSyncSnapshot,
  MutationOperation,
  SyncEnvironment,
} from '@stateref/sync';

export type ShopTab = 'catalog' | 'delivery' | 'batch';
export type Category = 'all' | 'fruit' | 'vegetable' | 'pantry';
export type Product = {
  id: number;
  title: string;
  subtitle: string;
  category: Category;
  price: number;
  art: string;
};
export type Address = { street: string; detail: string };
export type Shipping = {
  recipient: string;
  phone: string;
  address: Address;
  note: string;
};
export type Order = {
  title: string;
  art: string;
  unitPrice: number;
  quantity: number;
  coupon: boolean;
  delivery: 'standard' | 'express';
};
export type OrderSummary = Order & {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
};
export type ShopStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type ShopOptions = {
  namespace?: string;
  storage?: ShopStorage;
  environment?: SyncEnvironment;
  initialTab?: ShopTab;
  onTabChange?: (tab: ShopTab) => void;
  readDelay?: number;
  saveDelay?: number;
  searchDelay?: number;
};

export const CATEGORIES: readonly { id: Category; title: string }[] = [
  { id: 'all', title: '전체' },
  { id: 'fruit', title: '과일' },
  { id: 'vegetable', title: '채소' },
  { id: 'pantry', title: '식료품' },
];
export const PRODUCTS: readonly Product[] = [
  {
    id: 1,
    title: '잘 익은 아보카도',
    subtitle: '2입 · 멕시코산',
    category: 'fruit',
    price: 7200,
    art: 'avocado',
  },
  {
    id: 2,
    title: '햇살 가득 레몬',
    subtitle: '3입 · 상큼한 하루',
    category: 'fruit',
    price: 4900,
    art: 'lemon',
  },
  {
    id: 3,
    title: '산지에서 온 딸기',
    subtitle: '500g · 국내산',
    category: 'fruit',
    price: 12900,
    art: 'strawberry',
  },
  {
    id: 4,
    title: '유기농 방울토마토',
    subtitle: '500g · 국내산',
    category: 'vegetable',
    price: 6800,
    art: 'tomato',
  },
  {
    id: 5,
    title: '톡톡 블루베리',
    subtitle: '150g · 생과',
    category: 'fruit',
    price: 5900,
    art: 'blueberry',
  },
  {
    id: 6,
    title: '아삭한 당근',
    subtitle: '3입 · 제주산',
    category: 'vegetable',
    price: 3800,
    art: 'carrot',
  },
  {
    id: 7,
    title: '아침을 여는 우유',
    subtitle: '900ml · 저온 살균',
    category: 'pantry',
    price: 4200,
    art: 'milk',
  },
  {
    id: 8,
    title: '담백한 오트밀',
    subtitle: '500g · 통곡물',
    category: 'pantry',
    price: 7900,
    art: 'oats',
  },
  {
    id: 9,
    title: '초록 브로콜리',
    subtitle: '1송이 · 국내산',
    category: 'vegetable',
    price: 3500,
    art: 'broccoli',
  },
  {
    id: 10,
    title: '달콤한 오렌지',
    subtitle: '4입 · 캘리포니아산',
    category: 'fruit',
    price: 8900,
    art: 'orange',
  },
  {
    id: 11,
    title: '고소한 치즈',
    subtitle: '150g · 자연 치즈',
    category: 'pantry',
    price: 6500,
    art: 'cheese',
  },
  {
    id: 12,
    title: '싱싱한 오이',
    subtitle: '2입 · 국내산',
    category: 'vegetable',
    price: 2900,
    art: 'cucumber',
  },
];
export const INITIAL_SHIPPING: Shipping = {
  recipient: '박서연',
  phone: '010-1234-5678',
  address: { street: '서울 마포구 성미산로 87', detail: '302호' },
  note: '문 앞에 놓아주세요.',
};
export const money = (amount: number) => `${amount.toLocaleString('ko-KR')}원`;
export const summarizeOrder = (order: Order): OrderSummary => {
  const subtotal = order.unitPrice * order.quantity;
  const discount = order.coupon ? 2000 : 0;
  const shipping = order.delivery === 'express' ? 5000 : 3000;
  return {
    ...order,
    subtotal,
    discount,
    shipping,
    total: subtotal - discount + shipping,
  };
};

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('Request aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, ms);
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}

export function createShopModel(options: ShopOptions = {}) {
  const namespace = options.namespace ?? 'stateref-shop';
  const snapshotKey = `${namespace}:edits:v1`;
  const serverKey = `${namespace}:server:v1`;
  const storage = options.storage;
  const client = createSyncClient({ environment: options.environment });
  let active = true;
  let resetting = false;
  let serverProfile = structuredClone(INITIAL_SHIPPING);
  let restored = false;
  let storageProblem = false;
  try {
    const savedServer = storage?.getItem(serverKey);
    if (savedServer) {
      const parsed = JSON.parse(savedServer) as Shipping;
      if (
        [
          parsed.recipient,
          parsed.phone,
          parsed.note,
          parsed.address?.street,
          parsed.address?.detail,
        ].every(part => typeof part === 'string')
      )
        serverProfile = parsed;
    }
    const savedEdits = storage?.getItem(snapshotKey);
    if (savedEdits) {
      client.hydrateLocal(JSON.parse(savedEdits) as LocalSyncSnapshot);
      restored = true;
    }
  } catch {
    storageProblem = true;
  }

  const watchUi = createStore({
    tab: options.initialTab ?? ('catalog' as ShopTab),
    searchInput: '',
    notice: storageProblem
      ? '보관한 내용을 읽지 못했어요. 새로 시작합니다.'
      : '',
    noticeTone: 'info' as 'info' | 'success' | 'error',
    restored,
    draftOpen: false,
    draftId: 0,
    slowSave: false,
    rejectNextSave: false,
    batchMode: 'none' as 'none' | 'normal' | 'batch',
    batchTrail: [] as OrderSummary[],
    productReads: 0,
    profileReads: 0,
    saves: 0,
  });
  const ui = watchUi();
  const watchFilters = createStore({ term: '', category: 'all' as Category });
  const filters = watchFilters();
  let failNextProducts = false;
  let priceBump = 0;
  const readDelay = options.readDelay ?? 400;
  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  let currentDraft: Draft<Address> | null = null;
  let saving: MutationOperation<Shipping> | null = null;

  const notify = (
    text: string,
    tone: 'info' | 'success' | 'error' = 'info'
  ) => {
    if (!active) return;
    batch(() => {
      ui.notice.value = text;
      ui.noticeTone.value = tone;
    });
  };
  const keepServer = () => {
    try {
      storage?.setItem(serverKey, JSON.stringify(serverProfile));
    } catch {
      notify('이 브라우저에서는 배송정보를 보관할 수 없어요.', 'error');
    }
  };
  const readProducts = async (
    signal: AbortSignal,
    term = '',
    category: Category = 'all'
  ) => {
    ui.productReads.value += 1;
    await delay(readDelay, signal);
    if (failNextProducts) {
      failNextProducts = false;
      throw new Error('상품을 불러오지 못했어요. 다시 시도해 주세요.');
    }
    return PRODUCTS.filter(
      product =>
        (category === 'all' || product.category === category) &&
        product.title.includes(term)
    ).map(product => ({
      ...product,
      price: product.price + (product.id === 1 ? priceBump : 0),
    }));
  };
  const feed = client.infiniteQuery({
    queryKey: ['shop', 'products'],
    queryFn: async ({
      signal,
      pageParam,
    }: {
      signal: AbortSignal;
      pageParam: number;
    }) => {
      const products = await readProducts(signal);
      return {
        items: products.slice(pageParam, pageParam + 4),
        next: pageParam + 4 < products.length ? pageParam + 4 : null,
      };
    },
    initialPageParam: 0,
    getNextPageParam: page => page.next,
    select: data => data.pages.flatMap(page => page.items),
    staleTime: 30_000,
    retry: 0,
  });
  const search = client.query({
    source: watchFilters,
    resolve: ({ term, category }) =>
      term === '' && category === 'all'
        ? null
        : {
            queryKey: ['shop', 'search', term, category],
            queryFn: ({ signal }: { signal: AbortSignal }) =>
              readProducts(signal, term, category),
            editable: false,
            staleTime: 30_000,
            retry: 0,
          },
  });
  const profileOptions = {
    queryKey: ['shop', 'shipping'],
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      ui.profileReads.value += 1;
      await delay(readDelay, signal);
      return structuredClone(serverProfile);
    },
    staleTime: 60_000,
    retry: 0,
  };
  const profile = client.query(profileOptions);
  const preview = client.query({
    ...profileOptions,
    select: shipping => ({
      recipient: shipping.recipient,
      phone: shipping.phone,
      address: `${shipping.address.street} ${shipping.address.detail}`,
      note: shipping.note,
    }),
  });
  const save = client.mutation<Shipping, Shipping>({
    mutationFn: async (input, { signal }) => {
      ui.saves.value += 1;
      const reject = ui.rejectNextSave.value;
      ui.rejectNextSave.value = false;
      await delay(ui.slowSave.value ? 5000 : options.saveDelay ?? 1800, signal);
      if (reject)
        throw new MutationRejectedError(
          '배송정보를 저장하지 못했어요. 입력 내용은 그대로 남아 있어요.'
        );
      if (
        !input.recipient.trim() ||
        !input.phone.trim() ||
        !input.address.street.trim()
      )
        throw new MutationRejectedError(
          '받는 분, 연락처, 주소를 모두 입력해 주세요.'
        );
      serverProfile = structuredClone(input);
      keepServer();
      return structuredClone(serverProfile);
    },
  });

  const watchOrder = createStore<Order>({
    title: PRODUCTS[0].title,
    art: PRODUCTS[0].art,
    unitPrice: PRODUCTS[0].price,
    quantity: 1,
    coupon: false,
    delivery: 'standard',
  });
  const order = watchOrder();
  const orderController = new AbortController();
  let recording = false;
  let trail: OrderSummary[] = [];
  watchOrder(ref => {
    const summary = summarizeOrder(ref.value);
    if (recording) trail.push(summary);
    return orderController.signal;
  });
  const persist = () => {
    if (!storage || !active || resetting) return;
    try {
      const snapshot = client.dehydrateLocal({ inFlight: 'unconfirmed' });
      storage.setItem(
        snapshotKey,
        JSON.stringify({
          ...snapshot,
          queries: snapshot.queries.filter(
            query => query.queryKey[1] === 'shipping'
          ),
        })
      );
    } catch {
      notify('이 브라우저에서는 작성 중인 내용을 보관할 수 없어요.', 'error');
    }
  };
  const stopPersisting = client.subscribeCache(persist);
  const currentProducts = () => (search.display.enabled.value ? search : feed);
  const resetOrder = () =>
    batch(() => {
      order.quantity.value = 1;
      order.coupon.value = false;
      order.delivery.value = 'standard';
    });

  return {
    client,
    feed,
    search,
    profile,
    preview,
    save,
    watchUi,
    ui,
    watchFilters,
    filters,
    watchOrder,
    order,
    get draft() {
      return currentDraft;
    },
    async start() {
      await Promise.allSettled([feed.load(), profile.load()]);
      persist();
    },
    setTab(tab: ShopTab) {
      ui.tab.value = tab;
      ui.notice.value = '';
      options.onTabChange?.(tab);
    },
    setSearch(term: string) {
      ui.searchInput.value = term;
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchTimer = null;
        if (active) filters.term.value = term.trim();
      }, options.searchDelay ?? 200);
    },
    setCategory(category: Category) {
      filters.category.value = category;
    },
    async refreshProducts(fail = false) {
      failNextProducts = fail;
      try {
        await currentProducts().refetch();
        notify('');
      } catch (error) {
        notify(
          error instanceof Error ? error.message : '상품을 불러오지 못했어요.',
          'error'
        );
      }
    },
    async loadMore() {
      try {
        await feed.fetchNextPage();
        notify('');
      } catch (error) {
        notify(
          error instanceof Error
            ? error.message
            : '상품을 더 불러오지 못했어요.',
          'error'
        );
      }
    },
    changePrice() {
      priceBump += 1000;
      notify(
        '아보카도 가격이 서버에서 1,000원 올랐어요. 상품 새로고침으로 확인해 보세요.'
      );
    },
    addProduct(product: Product) {
      batch(() => {
        order.title.value = product.title;
        order.art.value = product.art;
        order.unitPrice.value = product.price;
      });
      resetOrder();
      this.setTab('batch');
      batch(() => {
        ui.batchMode.value = 'none';
        ui.batchTrail.value = [];
      });
    },
    async saveShipping() {
      if (!profile.status.loaded.value || profile.status.pending.value > 0)
        return;
      notify('');
      try {
        const submission = profile.capture();
        saving = save.start(submission.value, {
          links: [
            {
              query: profile,
              submission,
              accept: { kind: 'response', select: data => data },
              onReject: 'keep',
            },
          ],
        });
        const result = await saving.result;
        if (result.kind === 'success')
          notify(
            profile.isDirty()
              ? '제출한 내용은 저장됐어요. 저장 중에 바꾼 내용은 아직 미저장이에요.'
              : '배송정보를 저장했어요.',
            'success'
          );
        else if (result.kind === 'rejected')
          notify(
            result.error instanceof Error
              ? result.error.message
              : '저장이 거절됐어요. 입력은 유지됩니다.',
            'error'
          );
        else if (result.kind === 'sync-error')
          notify(
            '저장은 완료됐지만 결과를 확인하지 못했어요. 배송정보를 다시 불러와 주세요.',
            'error'
          );
        else
          notify(
            '저장 결과를 확인할 수 없어요. 입력을 유지했으니 다시 불러와 확인해 주세요.',
            'error'
          );
      } catch (error) {
        notify(
          error instanceof Error ? error.message : '저장을 시작하지 못했어요.',
          'error'
        );
      } finally {
        saving?.dispose();
        saving = null;
        persist();
      }
    },
    async refreshShipping() {
      try {
        await profile.refetch();
        notify('최신 배송정보를 확인했어요. 작성 중인 입력은 유지됩니다.');
      } catch {
        notify('배송정보를 불러오지 못했어요. 다시 시도해 주세요.', 'error');
      }
    },
    openAddress() {
      if (!profile.status.loaded.value || currentDraft) return;
      currentDraft = createDraft(profile.ref.address);
      batch(() => {
        ui.draftId.value += 1;
        ui.draftOpen.value = true;
      });
    },
    closeAddress() {
      ui.draftOpen.value = false;
      currentDraft?.discard();
      currentDraft = null;
    },
    applyAddress() {
      const result = currentDraft?.apply();
      if (result?.ok) {
        this.closeAddress();
        notify(
          '배송 주소에 반영했어요. 저장하기를 누르면 서버에도 저장됩니다.'
        );
      } else
        notify('주소가 변경됐어요. 사용할 주소를 먼저 선택해 주세요.', 'error');
    },
    resolveAddress(choice: 'source' | 'draft') {
      if (!currentDraft) return;
      for (const change of currentDraft
        .changes()
        .filter(change => change.conflict)) {
        const fresh = currentDraft
          .changes()
          .find(item => item.id === change.id);
        if (fresh) currentDraft.resolve(fresh, choice);
      }
    },
    async changeServerAddress() {
      serverProfile.address = {
        street: '서울 성동구 연무장길 23',
        detail: '501호',
      };
      keepServer();
      try {
        await profile.refetch();
      } catch {
        notify('다른 기기의 주소를 불러오지 못했어요.', 'error');
      }
    },
    applyBundle(batched: boolean) {
      resetOrder();
      trail = [];
      recording = true;
      const apply = () => {
        order.quantity.value = 3;
        order.coupon.value = true;
        order.delivery.value = 'express';
      };
      try {
        if (batched) batch(apply);
        else apply();
      } finally {
        recording = false;
      }
      batch(() => {
        ui.batchMode.value = batched ? 'batch' : 'normal';
        ui.batchTrail.value = [...trail];
      });
    },
    reset() {
      resetting = true;
      try {
        storage?.removeItem(snapshotKey);
        storage?.removeItem(serverKey);
      } catch {
        resetting = false;
        notify('예제 보관값을 초기화하지 못했어요.', 'error');
        return false;
      }
      stopPersisting();
      return true;
    },
    dispose() {
      if (!active) return;
      persist();
      active = false;
      stopPersisting();
      if (searchTimer) clearTimeout(searchTimer);
      orderController.abort();
      currentDraft?.discard();
      saving?.abort();
      saving?.dispose();
      save.dispose();
      search.dispose();
      feed.dispose();
      preview.dispose();
      profile.dispose();
      for (const entry of client.inspectCache()) client.remove(entry.queryKey);
    },
  };
}
export type ShopModel = ReturnType<typeof createShopModel>;
