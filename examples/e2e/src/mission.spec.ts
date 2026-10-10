import { test as base, expect, type Page } from '@playwright/test';
import { MISSIONS, missionOrigin, MISSION_SSR_PORT } from './missions';

// Observe the browser's public boundary, including failed requests and errors.
// No fixture globals, private observers, or direct library calls from tests.
const test = base.extend<{ browserHealth: void }>({
  browserHealth: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (
          message.type() === 'error' &&
          !/Failed to load resource.*(503|409)/.test(message.text())
        )
          errors.push(message.text());
      });
      await use();
      expect(
        errors,
        'No render, hydration, or unhandled application errors'
      ).toEqual([]);
    },
    { auto: true },
  ],
});
const field = (page: Page, id: string) => page.getByTestId(id);
const tools = (page: Page) =>
  page
    .getByText('통신 실험실 · 일부러 어려운 상황 만들기', { exact: true })
    .click();
async function ready(page: Page, id = 1) {
  await field(page, `choose-${id}`).click();
  await expect(field(page, 'a-name')).toHaveValue(
    ['달빛 택배선', '화성 탐험선', '토성 소풍선'][id - 1]
  );
  await expect(field(page, 'a-status')).toHaveText('준비 완료');
}

for (const target of MISSIONS) {
  test.describe(target.name, () => {
    const origin = missionOrigin(target.port);
    // Concurrent uses a path subscription and a root version subscription.
    // Both share the component's AbortSignal and must reach zero on unmount.
    const counterSubscriptions = 'concurrent' in target ? '2' : '1';
    test.beforeEach(async ({ page, request }) => {
      expect(
        (
          await request.post(origin + '/mission-api/control', {
            data: { reset: true, delay: 120 },
          })
        ).ok()
      ).toBe(true);
      await page.goto(origin + '/mission.html');
      await expect(
        page.getByRole('heading', { name: '별빛 정비소', exact: true })
      ).toBeVisible();
      await page.getByText('진단 · 실제 요청과 캐시', { exact: true }).click();
    });

    test('shared GET, fresh cache, ordinary connector cleanup without another write', async ({
      page,
    }) => {
      const reads: string[] = [];
      const aborted: string[] = [];
      page.on('requestfailed', request => aborted.push(request.url()));
      page.on('request', request => {
        if (
          request.method() === 'GET' &&
          request.url().includes('/mission-api/ships/')
        )
          reads.push(request.url());
      });
      await expect(field(page, 'owners')).toHaveText('0');
      await expect(field(page, 'reads')).toHaveText('0');
      await ready(page);
      await expect(field(page, 'owners')).toHaveText('2');
      await expect(field(page, 'counters')).toHaveText(counterSubscriptions);
      expect(reads).toHaveLength(1);
      await field(page, 'star-counter').click();
      await expect(field(page, 'stars')).toHaveText('1');
      await field(page, 'twin').click();
      await expect(field(page, 'b-panel')).toHaveCount(0);
      await expect(field(page, 'owners')).toHaveText('1');
      await field(page, 'a-name').fill('별빛 배달부');
      await field(page, 'twin').click();
      await expect(field(page, 'b-name')).toHaveValue('별빛 배달부');
      await expect(field(page, 'owners')).toHaveText('2');
      for (let iteration = 0; iteration < 3; iteration++) {
        await field(page, 'close').click();
        await expect(field(page, 'owners')).toHaveText('0');
        await expect(field(page, 'counters')).toHaveText('0');
        await field(page, 'choose-1').click();
        await expect(field(page, 'a-name')).toHaveValue('별빛 배달부');
        await expect(field(page, 'counters')).toHaveText(counterSubscriptions);
        await expect(field(page, 'owners')).toHaveText('2');
        await expect(field(page, 'stars')).toHaveText('1');
      }
      await field(page, 'star-counter').click();
      await expect(field(page, 'stars')).toHaveText('2');
      expect(reads).toHaveLength(1);
      expect(aborted).toEqual([]);
    });

    test('pending GET aborts after both panels unmount', async ({
      page,
      request,
    }) => {
      await request.post(origin + '/mission-api/control', {
        data: { delay: 1500 },
      });
      const started = page.waitForRequest(
        request =>
          request.method() === 'GET' &&
          request.url().includes('/mission-api/ships/1')
      );
      const failed = page.waitForEvent('requestfailed', request =>
        request.url().includes('/mission-api/ships/1')
      );
      await field(page, 'choose-1').click();
      await started;
      await expect(field(page, 'owners')).toHaveText('2');
      await field(page, 'close').click();
      const cancelled = await failed;
      expect(cancelled.failure()?.errorText).toMatch(/ABORTED/);
      await expect(field(page, 'owners')).toHaveText('0');
      await expect(field(page, 'counters')).toHaveText('0');
      await expect(field(page, 'cancelled')).toHaveText('1');
    });

    test('invalidate during the first load replaces the request and settles', async ({
      page,
      request,
    }) => {
      await request.post(origin + '/mission-api/control', {
        data: { delay: 900 },
      });
      await field(page, 'choose-1').click();
      await expect(field(page, 'reads')).toHaveText('1');
      await field(page, 'a-invalidate').click();
      await expect(field(page, 'reads')).toHaveText('2');
      await expect(field(page, 'a-name')).toHaveValue('달빛 택배선');
      await expect(field(page, 'b-name')).toHaveValue('달빛 택배선');
      await expect(field(page, 'a-status')).toHaveText('준비 완료');
      await expect(field(page, 'owners')).toHaveText('2');
    });

    test('live key changes, newly read oxygen path, rapid switching without old DOM', async ({
      page,
      request,
    }) => {
      await ready(page);
      // MutationObserver records every committed DOM frame, beyond final-state polling.
      await page.evaluate(() => {
        const frames: {
          selected: string | null;
          id: string | null;
          name: string;
        }[] = [];
        const main = document.querySelector('main')!;
        const observer = new MutationObserver(() => {
          for (const card of main.querySelectorAll(
            'article[data-phase="success"]'
          )) {
            frames.push({
              selected: main.getAttribute('data-selected-id'),
              id: card.getAttribute('data-ship-id'),
              name: card.querySelector('input')!.value,
            });
          }
        });
        observer.observe(main, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
        (window as unknown as { missionFrames: typeof frames }).missionFrames =
          frames;
      });
      await ready(page, 2);
      await expect(field(page, 'a-oxygen')).toHaveText('82');
      await tools(page);
      const control = page.waitForResponse(response =>
        response.url().endsWith('/mission-api/control')
      );
      await field(page, 'remote-change').click();
      await control;
      await field(page, 'a-refresh').click();
      await expect(field(page, 'a-oxygen')).toHaveText('87');
      await expect(field(page, 'b-oxygen')).toHaveText('87');
      await ready(page, 1);
      await expect(field(page, 'reads')).toHaveText('3'); // 1, 2, refreshed 2; fresh 1 has no GET.
      await request.post(origin + '/mission-api/control', {
        data: { delay: 1500 },
      });
      await field(page, 'choose-3').click();
      await expect(field(page, 'a-name')).toHaveValue('');
      await ready(page, 2);
      await ready(page, 3);
      const frames = await page.evaluate(
        () =>
          (
            window as unknown as {
              missionFrames: { selected: string; id: string; name: string }[];
            }
          ).missionFrames
      );
      expect(frames.length).toBeGreaterThan(0);
      for (const frame of frames) {
        expect(frame.id, JSON.stringify(frame)).toBe(frame.selected);
        expect(frame.name, JSON.stringify(frame)).toBe(
          ['달빛 택배선', '화성 탐험선', '토성 소풍선'][Number(frame.id) - 1]
        );
      }
    });

    test('stale cache shows immediately then refreshes on reopen', async ({
      page,
      request,
    }) => {
      await page.clock.install();
      await ready(page);
      await field(page, 'close').click();
      await expect(field(page, 'owners')).toHaveText('0');
      await page.clock.fastForward(31_000);
      await request.post(origin + '/mission-api/control', {
        data: { delay: 1500 },
      });
      await field(page, 'choose-1').click();
      await expect(field(page, 'a-name')).toHaveValue('달빛 택배선');
      await expect(field(page, 'a-status')).toHaveText('통신 중');
      await expect(field(page, 'reads')).toHaveText('2');
      await expect(field(page, 'a-status')).toHaveText('준비 완료');
    });

    test('refetch/invalidate preserve edits; capture, continued editing, server acceptance, rejection', async ({
      page,
    }) => {
      const saves: unknown[] = [];
      page.on('request', request => {
        if (request.method() === 'PUT') saves.push(request.postDataJSON());
      });
      await ready(page);
      await field(page, 'a-name').fill('Aurora');
      await expect(field(page, 'b-name')).toHaveValue('Aurora');
      await expect(field(page, 'a-dirty')).toContainText('아직 저장하지');
      await field(page, 'a-refresh').click();
      await expect(field(page, 'reads')).toHaveText('2');
      await expect(field(page, 'a-status')).toHaveText('준비 완료');
      await expect(field(page, 'a-name')).toHaveValue('Aurora');
      await field(page, 'a-invalidate').click();
      await expect(field(page, 'reads')).toHaveText('3');
      await expect(field(page, 'a-status')).toHaveText('준비 완료');
      await expect(field(page, 'a-name')).toHaveValue('Aurora');
      await field(page, 'a-save').click();
      await expect(field(page, 'a-save')).toHaveText('저장 중…');
      await field(page, 'a-name').fill('Nova');
      await expect(field(page, 'message')).toContainText('저장됐어요');
      await expect(field(page, 'a-name')).toHaveValue('Nova');
      await expect(field(page, 'b-name')).toHaveValue('Nova');
      await expect(field(page, 'a-dirty')).toContainText('아직 저장하지');
      await field(page, 'a-save').click();
      await expect(field(page, 'a-name')).toHaveValue('NOVA');
      await expect(field(page, 'a-dirty')).toContainText('정비소와 같은');
      expect(saves).toEqual([{ name: 'Aurora' }, { name: 'Nova' }]);
      await tools(page);
      const control = page.waitForResponse(response =>
        response.url().endsWith('/mission-api/control')
      );
      await field(page, 'reject-save').click();
      await control;
      await field(page, 'a-name').fill('Comet');
      await field(page, 'a-save').click();
      await expect(field(page, 'message')).toContainText('저장을 거절');
      await expect(field(page, 'a-name')).toHaveValue('Comet');
      await expect(field(page, 'a-dirty')).toContainText('아직 저장하지');
      expect(saves).toHaveLength(3);
      await field(page, 'a-save').click();
      await expect(field(page, 'a-name')).toHaveValue('COMET');
      expect(saves).toHaveLength(4);
      await ready(page, 2);
      await field(page, 'a-name').fill('Mars Rover');
      await expect(field(page, 'b-name')).toHaveValue('Mars Rover');
      await field(page, 'choose-1').click();
      await expect(field(page, 'a-name')).toHaveValue('COMET');
    });

    test('offline resume, read failure recovery, poll shutdown', async ({
      page,
    }) => {
      await ready(page);
      await tools(page);
      await field(page, 'online').click();
      await field(page, 'a-refresh').click();
      await expect(field(page, 'a-status')).toHaveText('무선 대기');
      await expect(field(page, 'reads')).toHaveText('1');
      await field(page, 'online').click();
      await expect(field(page, 'reads')).toHaveText('2');
      await expect(field(page, 'a-status')).toHaveText('준비 완료');
      const control = page.waitForResponse(response =>
        response.url().endsWith('/mission-api/control')
      );
      await field(page, 'fail-read').click();
      await control;
      await field(page, 'a-refresh').click();
      await expect(field(page, 'a-error')).toContainText('우주 먼지');
      await field(page, 'a-refresh').click();
      await expect(field(page, 'a-error')).toHaveCount(0);
      await expect(field(page, 'a-status')).toHaveText('준비 완료');
      await field(page, 'poll').click();
      await expect
        .poll(async () => Number(await field(page, 'reads').textContent()))
        .toBeGreaterThanOrEqual(6);
      await field(page, 'close').click();
      await expect(field(page, 'owners')).toHaveText('0');
      const reads = await field(page, 'reads').textContent();
      await page.clock.install();
      await page.clock.fastForward(3000);
      await expect(field(page, 'reads')).toHaveText(reads!);
      await expect(field(page, 'counters')).toHaveText('0');
    });

    test('draft cancel/apply, computed and batch; keyboard and small viewport', async ({
      page,
    }, info) => {
      await expect(field(page, 'equipment')).toContainText(
        '연료 40 · 화물 3 · 탐험 준비 70점'
      );
      await field(page, 'draft-open').focus();
      await page.keyboard.press('Enter');
      await field(page, 'draft-fuel').fill('90');
      await expect(field(page, 'equipment')).toContainText('연료 40');
      await field(page, 'draft-cancel').click();
      await expect(field(page, 'draft')).toHaveCount(0);
      await expect(field(page, 'equipment')).toContainText('연료 40');
      await field(page, 'draft-open').click();
      await expect(field(page, 'draft-fuel')).toHaveValue('40');
      await field(page, 'draft-fuel').fill('90');
      await field(page, 'draft-apply').click();
      await expect(field(page, 'equipment')).toContainText(
        '연료 90 · 화물 3 · 탐험 준비 120점'
      );
      await field(page, 'upgrade-normal').click();
      await expect(field(page, 'batch-notices')).toHaveText('2');
      await field(page, 'upgrade-batch').click();
      await expect(field(page, 'batch-notices')).toHaveText('1');
      await expect(field(page, 'equipment')).toContainText(
        '연료 110 · 화물 5 · 탐험 준비 160점'
      );
      await expect(field(page, 'reads')).toHaveText('0');
      await ready(page);
      await info.attach('desktop', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
      await page.setViewportSize({ width: 390, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
      await expect(field(page, 'choose-2')).toBeVisible();
      await info.attach('mobile', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    });
  });
}

test('React SSR: prefetch HTML, owner-free render, hydrate without GET or mismatch', async ({
  page,
  request,
}) => {
  const origin = missionOrigin(MISSION_SSR_PORT);
  const response = await request.get(origin + '/sync-query');
  expect(response.ok()).toBe(true);
  const html = (await response.text()).replace(/<!--.*?-->/g, '');
  expect(html).toContain('data-testid="ssr-name">화성 탐험선');
  expect(html).toContain('data-testid="ssr-render-reads">0');
  expect(html).toContain('data-testid="ssr-owners">0');
  const reads: string[] = [];
  page.on('request', request => {
    if (request.url().includes('/mission-api/ships/'))
      reads.push(request.url());
  });
  await page.goto(origin + '/sync-query');
  await expect(field(page, 'ssr-hydrated')).toHaveText('true');
  await expect(field(page, 'ssr-name')).toHaveText('화성 탐험선');
  await expect(field(page, 'ssr-fuel')).toHaveText('48');
  await expect(field(page, 'ssr-oxygen')).toHaveText('82');
  await expect(field(page, 'ssr-fetch')).toHaveText('idle');
  expect(reads).toEqual([]);
});
