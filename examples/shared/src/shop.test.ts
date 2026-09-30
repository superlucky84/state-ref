import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createShopModel, summarizeOrder } from './shop';
import type { ShopModel, ShopStorage } from './shop';

const models: ShopModel[] = [];
const open = (storage?: ShopStorage) => {
  const model = createShopModel({
    readDelay: 10,
    saveDelay: 50,
    searchDelay: 10,
    storage,
  });
  models.push(model);
  return model;
};
const start = async (model: ShopModel) => {
  const started = model.start();
  await vi.advanceTimersByTimeAsync(20);
  await started;
};
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  models.splice(0).forEach(model => model.dispose());
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('small shop user flows', () => {
  it('loads four products, appends pages, and recovers from a failed refresh', async () => {
    const model = open();
    await start(model);
    expect(model.feed.display.data.value).toHaveLength(4);
    const more = model.loadMore();
    await vi.advanceTimersByTimeAsync(20);
    await more;
    expect(model.feed.display.data.value).toHaveLength(8);
    const failed = model.refreshProducts(true);
    await vi.advanceTimersByTimeAsync(20);
    await failed;
    expect(model.feed.display.data.value).toHaveLength(8);
    expect(model.feed.status.error.value).toBeInstanceOf(Error);
    const retry = model.refreshProducts();
    await vi.advanceTimersByTimeAsync(30);
    await retry;
    expect(model.feed.status.error.value).toBeNull();
    expect(model.feed.display.data.value).toHaveLength(8);
    expect(model.ui.notice.value).toBe('');
  });

  it('shows only the latest search and reuses a fresh category cache', async () => {
    const model = open();
    await start(model);
    model.setCategory('fruit');
    await vi.advanceTimersByTimeAsync(20);
    const reads = model.ui.productReads.value;
    model.setCategory('vegetable');
    await vi.advanceTimersByTimeAsync(20);
    model.setCategory('fruit');
    await vi.advanceTimersByTimeAsync(20);
    expect(model.ui.productReads.value).toBe(reads + 1);
    model.setSearch('레몬');
    await vi.advanceTimersByTimeAsync(11);
    model.setSearch('딸기');
    await vi.advanceTimersByTimeAsync(30);
    expect(
      model.search.display.data.value?.map(product => product.title)
    ).toEqual(['산지에서 온 딸기']);
  });

  it('shares a shipping preview and preserves input typed after submission', async () => {
    const model = open();
    await start(model);
    model.profile.ref.recipient.value = '이하늘';
    expect(model.preview.display.data.value?.recipient).toBe('이하늘');
    const saving = model.saveShipping();
    expect(model.profile.status.pending.value).toBe(1);
    model.profile.ref.recipient.value = '김민지';
    await vi.advanceTimersByTimeAsync(60);
    await saving;
    expect(model.profile.ref.recipient.value).toBe('김민지');
    expect(model.profile.isDirty()).toBe(true);
    expect(model.ui.notice.value).toContain('아직 미저장');
    expect(model.ui.saves.value).toBe(1);
  });

  it('keeps a rejected edit, blocks a second pending save, and retries explicitly', async () => {
    const model = open();
    await start(model);
    model.profile.ref.note.value = '경비실에 맡겨주세요.';
    model.ui.rejectNextSave.value = true;
    const first = model.saveShipping();
    await model.saveShipping();
    expect(model.ui.saves.value).toBe(1);
    await vi.advanceTimersByTimeAsync(60);
    await first;
    expect(model.profile.ref.note.value).toBe('경비실에 맡겨주세요.');
    expect(model.profile.isDirty()).toBe(true);
    const second = model.saveShipping();
    await vi.advanceTimersByTimeAsync(60);
    await second;
    expect(model.profile.isDirty()).toBe(false);
    expect(model.ui.saves.value).toBe(2);
  });

  it('cancels an address draft and resolves an external address conflict before applying', async () => {
    const model = open();
    await start(model);
    const original = model.profile.ref.address.street.value;
    model.openAddress();
    model.draft!.ref.street.value = '서울 종로구 자하문로 10';
    model.closeAddress();
    expect(model.profile.ref.address.street.value).toBe(original);
    model.openAddress();
    model.draft!.ref.street.value = '서울 강남구 테헤란로 15';
    const remote = model.changeServerAddress();
    await vi.advanceTimersByTimeAsync(20);
    await remote;
    expect(model.draft!.status.conflicts.value).toBe(1);
    model.applyAddress();
    expect(model.ui.draftOpen.value).toBe(true);
    model.resolveAddress('draft');
    model.applyAddress();
    expect(model.profile.ref.address.street.value).toBe(
      '서울 강남구 테헤란로 15'
    );
    expect(model.profile.isDirty()).toBe(true);
    expect(model.ui.saves.value).toBe(0);
  });

  it('restores local shipping input without a WRITE and resets only its own keys', async () => {
    const records = new Map<string, string>([['unrelated', 'keep']]);
    const storage: ShopStorage = {
      getItem: key => records.get(key) ?? null,
      setItem: (key, value) => {
        records.set(key, value);
      },
      removeItem: key => {
        records.delete(key);
      },
    };
    const model = open(storage);
    await start(model);
    model.profile.ref.note.value = '새로고침해도 남는 입력';
    await vi.advanceTimersByTimeAsync(0);
    model.dispose();
    const restored = open(storage);
    await start(restored);
    expect(restored.profile.ref.note.value).toBe('새로고침해도 남는 입력');
    expect(restored.profile.isDirty()).toBe(true);
    expect(restored.ui.saves.value).toBe(0);
    expect(restored.reset()).toBe(true);
    restored.dispose();
    expect([...records.entries()]).toEqual([['unrelated', 'keep']]);
  });

  it('restores an interrupted save as unconfirmed, reads before retry, and cleans up timers', async () => {
    const records = new Map<string, string>();
    const storage: ShopStorage = {
      getItem: key => records.get(key) ?? null,
      setItem: (key, value) => {
        records.set(key, value);
      },
      removeItem: key => {
        records.delete(key);
      },
    };
    const model = open(storage);
    await start(model);
    model.profile.ref.note.value = '저장 중 새로고침한 입력';
    const interrupted = model.saveShipping();
    model.setSearch('딸기');
    model.dispose();
    await vi.advanceTimersByTimeAsync(0);
    await interrupted;
    expect(vi.getTimerCount()).toBe(0);
    const restored = open(storage);
    expect(restored.profile.status.unconfirmed.value).toBe(true);
    await start(restored);
    expect(restored.profile.status.unconfirmed.value).toBe(false);
    expect(restored.profile.ref.note.value).toBe('저장 중 새로고침한 입력');
    expect(restored.profile.isDirty()).toBe(true);
    expect(restored.ui.saves.value).toBe(0);
    const retry = restored.saveShipping();
    await vi.advanceTimersByTimeAsync(60);
    await retry;
    expect(restored.profile.isDirty()).toBe(false);
    expect(restored.ui.saves.value).toBe(1);
    restored.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('observes three intermediate orders for normal writes and one final order for batch', async () => {
    const model = open();
    model.applyBundle(false);
    const normal = summarizeOrder(model.order.value);
    expect(model.ui.batchTrail.value.map(item => item.total)).toEqual([
      24600, 22600, 24600,
    ]);
    model.applyBundle(true);
    expect(summarizeOrder(model.order.value)).toEqual(normal);
    expect(model.ui.batchTrail.value.map(item => item.total)).toEqual([24600]);
  });
});
