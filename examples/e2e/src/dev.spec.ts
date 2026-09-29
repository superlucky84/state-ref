import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { DEV_DEMOS, urlOf } from './demos';

/**
 * What only a development server shows (DC-CN-10, docs/connectors).
 *
 * The other specs run the built `dist`, which is what users ship. Three
 * connector behaviours cannot be seen there:
 *
 * - React's StrictMode runs effects twice in development only. That is where
 *   F-R1 lived: a subscription the double run left dead.
 * - Vue warns about a refused readonly write in development only.
 * - Render counts need component names, which a production build minifies.
 *
 * Like the other specs, this reads the DOM and never a global the demo exposes
 * for testing (DC8-8-01). The one exception is React's DevTools hook below,
 * which is React's own public extension point, not the demo's.
 */

const listen = (page: Page) => {
  const noise: string[] = [];
  page.on('pageerror', error => noise.push(`pageerror: ${error}`));
  page.on('console', message => {
    const type = message.type();
    if (type === 'error' || type === 'warning') {
      noise.push(`console.${type}: ${message.text()}`);
    }
  });
  return noise;
};

/**
 * A minimal React DevTools hook: React calls `onCommitFiberRoot` after every
 * commit. A component counts as rendered by the rule DevTools uses: it did
 * work in this commit (`PerformedWork`), or it is new. A subtree whose child
 * pointer did not change was not visited at all.
 *
 * Runs in the page before any script, so it is self-contained.
 */
function installRenderCounter() {
  const PERFORMED_WORK = 1;
  // Function, class, forwardRef, memo and simple memo components.
  const COMPONENT_TAGS = [0, 1, 11, 14, 15];
  type Fiber = {
    tag: number;
    flags: number;
    type: unknown;
    memoizedProps: Record<string, unknown> | null;
    memoizedState: { element?: unknown } | null;
    child: Fiber | null;
    sibling: Fiber | null;
    alternate: Fiber | null;
  };
  const counts: Record<string, number> = {};
  (window as unknown as { __renders: typeof counts }).__renders = counts;

  const nameOf = (fiber: Fiber) => {
    const type = fiber.type as
      | { name?: string; render?: { name?: string }; type?: { name?: string } }
      | undefined;
    if (!type) return '';
    return type.name || type.render?.name || type.type?.name || '';
  };
  // The two resource panels are one component; the slot tells them apart.
  const keyOf = (fiber: Fiber) => {
    const slot = fiber.memoizedProps?.slot;
    return typeof slot === 'string'
      ? `${nameOf(fiber)}(${slot})`
      : nameOf(fiber);
  };
  const bump = (fiber: Fiber) => {
    if (!COMPONENT_TAGS.includes(fiber.tag)) return;
    const key = keyOf(fiber);
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  };
  const mount = (first: Fiber | null) => {
    for (let fiber = first; fiber; fiber = fiber.sibling) {
      bump(fiber);
      mount(fiber.child);
    }
  };
  const update = (next: Fiber, prev: Fiber) => {
    if (next.flags & PERFORMED_WORK) bump(next);
    if (next.child === prev.child) return;
    for (let child = next.child; child; child = child.sibling) {
      if (child.alternate) update(child, child.alternate);
      else {
        bump(child);
        mount(child.child);
      }
    }
  };

  (
    window as unknown as Record<string, unknown>
  ).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    renderers: new Map(),
    inject: () => 1,
    checkDCE: () => {},
    onCommitFiberUnmount: () => {},
    onPostCommitFiberRoot: () => {},
    onCommitFiberRoot: (_id: number, root: { current: Fiber }) => {
      const next = root.current;
      const prev = next.alternate;
      if (!prev || prev.memoizedState?.element == null) mount(next.child);
      else update(next, prev);
    },
  };
}

const renders = (page: Page) =>
  page.evaluate(() => ({
    ...(window as unknown as { __renders: Record<string, number> }).__renders,
  }));

/** Load both resource panels: the demo's fake server answers on `settle-all`. */
async function loadPanels(page: Page) {
  await page.click('button[data-operation="load"]');
  await page.click('button[data-operation="settle-all"]');
  const a = page.locator('[data-card="resource-a"] [data-field="city"] input');
  const b = page.locator('[data-card="resource-b"] [data-field="city"] input');
  await expect(a).toBeVisible();
  await expect(b).toBeVisible();
  return { a, b };
}

test.describe('react (StrictMode, development)', () => {
  const url = urlOf(DEV_DEMOS.react);

  test('F-R1 — 입력이 한 박자 늦지 않고 같은 조회의 다른 패널에 바로 보인다', async ({
    page,
  }) => {
    const noise = listen(page);
    await page.goto(url);
    const { a, b } = await loadPanels(page);

    for (const city of ['부산', '대구', '광주']) {
      await a.fill(city);
      await expect(a).toHaveValue(city);
      await expect(b).toHaveValue(city);
    }
    expect(noise).toEqual([]);
  });

  test('DC-CN-03 — 입력 한 번에 그 필드를 읽는 컴포넌트만 다시 렌더된다', async ({
    page,
  }) => {
    const noise = listen(page);
    await page.addInitScript(installRenderCounter);
    await page.goto(url);
    const { a, b } = await loadPanels(page);

    const before = await renders(page);
    // The hook is live: every card rendered at least once on the way here.
    expect(before['StateCard'], '렌더 훅이 커밋을 받지 못했다').toBeGreaterThan(
      0
    );

    await a.fill('부산');
    await expect(b).toHaveValue('부산');
    const after = await renders(page);
    const delta = (name: string) => (after[name] ?? 0) - (before[name] ?? 0);

    // The two panels read the city: one render each, not two (no echo).
    expect(delta('ResourceValues(a)')).toBe(1);
    expect(delta('ResourceValues(b)')).toBe(1);
    // These read neither the city nor `ui.tick`, the demo's snapshot counter.
    for (const name of [
      'StateCard',
      'ComputedCard',
      'LiveCard',
      'ReadonlyCard',
      'DraftSection',
    ]) {
      expect(delta(name), `${name}이 읽지 않은 필드에 다시 렌더됐다`).toBe(0);
    }
    expect(noise).toEqual([]);
  });
});

test.describe('vue (development)', () => {
  test('DC-CN-04 — 선택한 객체의 필드에 직접 쓰면 거절되고, .value로 쓰면 반영된다', async ({
    page,
  }) => {
    const noise = listen(page);
    await page.goto(urlOf(DEV_DEMOS.vue));
    const card = page.locator('[data-card="write-rule"]');
    const shown = card.locator('[data-rule="shown"] b');
    const twin = card.locator('[data-rule="twin"] b');
    const writes = card.locator('[data-rule="writes"] b');
    await expect(shown).toHaveText('서울');

    await card.locator('button[data-write="nested"]').click();
    await expect
      .poll(() => noise.length, { message: 'readonly 경고가 뜨지 않았다' })
      .toBe(1);
    expect(noise[0]).toContain('target is readonly');
    await expect(shown).toHaveText('서울');
    await expect(twin).toHaveText('서울');
    await expect(writes).toHaveText('0');

    await card.locator('button[data-write="value"]').click();
    await expect(shown).toHaveText('대구');
    await expect(twin).toHaveText('대구');
    await expect(writes).toHaveText('1');
    expect(noise, '.value 쓰기에 기록이 남았다').toHaveLength(1);
  });
});

test.describe('svelte 5 (development)', () => {
  test('DC-CN-04 — $address.city = 값이 스토어에 반영되고 따로 구독한 쪽도 바뀐다', async ({
    page,
  }) => {
    const noise = listen(page);
    await page.goto(urlOf(DEV_DEMOS.svelte));
    const card = page.locator('[data-card="write-rule"]');
    const input = card.locator('[data-rule="input"] input');
    const twin = card.locator('[data-rule="twin"] b');
    const writes = card.locator('[data-rule="writes"] b');
    await expect(input).toHaveValue('서울');
    await expect(writes).toHaveText('0');

    await input.fill('대구');
    await expect(twin).toHaveText('대구');
    await expect(writes).toHaveText('1');

    await input.fill('부산');
    await expect(twin).toHaveText('부산');
    await expect(input).toHaveValue('부산');
    await expect(writes).toHaveText('2');
    expect(noise).toEqual([]);
  });
});
