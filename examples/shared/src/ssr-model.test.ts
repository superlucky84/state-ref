import { describe, expect, it } from 'vitest';
import {
  CITY,
  createSsrModelFromSnapshot,
  createSsrModelOnServer,
} from './index';
import type { Profile } from './index';

/**
 * The SSR page's model (step 5 of docs/server-sync/PHASE8_5.md).
 *
 * Rendering it in a real framework is the frameworks' own job; what is pinned
 * here is what the page is handed: a loaded query, a derived string, a
 * combined store, and a snapshot the browser can restore without a READ.
 */

describe('server request', () => {
  it('loads before the render and exposes derived values', async () => {
    const model = await createSsrModelOnServer();

    expect(model.watch().city.value).toBe(CITY.server);
    expect(model.derived().value).toContain(CITY.server);
    expect(model.derived().value).toContain('연락처 3');
    // combineWatch exposes the sources by index.
    expect(model.combined()[0].city.value).toBe(CITY.server);
    expect(model.combined()[1].upperCase.value).toBe(false);

    model.dispose();
  });

  it('dehydrates a clean baseline the browser can restore without a READ', async () => {
    const server = await createSsrModelOnServer();
    const snapshot = server.dehydrate();
    server.dispose();

    const browser = createSsrModelFromSnapshot(snapshot);
    // The hydrated handle is usable with no load(): that is what makes the
    // first browser render equal to the server HTML.
    expect(browser.query.status.loaded.value).toBe(true);
    expect(browser.watch().city.value).toBe(CITY.server);
    expect(browser.derived().value).toContain(CITY.server);

    browser.dispose();
  });

  it('keeps two requests apart', async () => {
    const first = await createSsrModelOnServer();
    const second = await createSsrModelOnServer({
      serverValue: { ...first.watch().value, city: CITY.overlap } as Profile,
    });

    first.query.ref.city.value = CITY.resource;
    expect(second.watch().city.value).toBe(CITY.overlap);
    // A dirty client refuses to hand out an SSR snapshot at all.
    expect(() => first.dehydrate()).toThrow();

    first.dispose();
    second.dispose();
  });
});

describe('what this file can and cannot show', () => {
  it('reads repeatedly without a subscription and still notifies a real one', async () => {
    const model = await createSsrModelOnServer();
    let notified = 0;
    // A genuine subscriber, to prove the store is not simply inert. It has
    // to read the path it wants: state-ref notifies on collected paths, so a
    // callback that reads nothing is never told anything.
    model.watch(store => {
      notified += 1;
      void store.memo.value;
    });
    expect(notified).toBe(1); // The first run happens on registration.

    // Eleven callback-less reads stand in for eleven server renders.
    for (let index = 0; index < 11; index += 1) {
      expect(model.watch().city.value).toBe(CITY.server);
      expect(model.derived().value).toContain(CITY.server);
      expect(model.combined()[0].zip.value).toBe('01');
    }

    model.query.ref.memo.value = '서버 렌더 뒤 쓰기';
    // One write, one notification: the reads added no subscribers of their
    // own. This does NOT count core subscriptions - a no-op subscription is
    // invisible from here, which is exactly the trap Phase 8.4 fell into.
    // Core keeps that measurement in its own path-tree tests, and the
    // framework SSR checks count connector renews after a real render.
    expect(notified).toBe(2);

    model.dispose();
  });
});
