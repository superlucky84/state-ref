import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { DEMOS } from './demos';

const watchErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning')
      errors.push(message.text());
  });
  return errors;
};
const chooseTab = (page: Page, name: string) =>
  page
    .getByRole('navigation')
    .getByRole('button', { name, exact: true })
    .click();

for (const demo of DEMOS.filter(
  demo => demo.name === 'preact' || demo.name === 'vue'
)) {
  test.describe(`${demo.name} small shop`, () => {
    const url = `http://localhost:${demo.port}/shop.html`;

    test('products: automatic loading, more pages, search, cached categories, and retry', async ({
      page,
    }) => {
      const errors = watchErrors(page);
      await page.goto(url);
      const cards = page.getByTestId('product-card');
      await expect(cards).toHaveCount(4);
      await page.screenshot({
        path: test.info().outputPath('catalog.png'),
        fullPage: true,
      });
      await page
        .getByRole('button', { name: '상품 더 보기 ↓', exact: true })
        .click();
      await expect(cards).toHaveCount(8);
      await page.getByRole('button', { name: '과일', exact: true }).click();
      await expect(cards).toHaveCount(5);
      const before = Number(
        (await page.getByTestId('product-reads').textContent())?.replace(
          '회',
          ''
        )
      );
      await page.getByRole('button', { name: '채소', exact: true }).click();
      await expect(cards).toHaveCount(4);
      await page.getByRole('button', { name: '과일', exact: true }).click();
      await expect(cards).toHaveCount(5);
      await expect(page.getByTestId('product-reads')).toHaveText(
        `${before + 1}회`
      );
      await page.getByLabel('상품 검색').fill('딸기');
      await expect(cards).toHaveCount(1);
      await expect(cards).toContainText('산지에서 온 딸기');
      await page.locator('summary').filter({ hasText: '조회 동작' }).click();
      await page
        .getByRole('button', { name: '조회 실패 보기', exact: true })
        .click();
      await expect(
        page.getByRole('alert').filter({ hasText: '기존 상품' })
      ).toBeVisible();
      await expect(cards).toHaveCount(1);
      await page
        .getByRole('button', { name: '다시 불러오기', exact: true })
        .click();
      await expect(page.getByRole('alert')).toHaveCount(0);
      expect(errors).toEqual([]);
    });

    test('shipping: shared preview and preservation of input typed during a save', async ({
      page,
    }) => {
      const errors = watchErrors(page);
      await page.goto(`${url}#delivery`);
      const recipient = page.getByLabel('받는 분', { exact: true });
      await expect(recipient).toHaveValue('박서연');
      await page.screenshot({
        path: test.info().outputPath('delivery.png'),
        fullPage: true,
      });
      await recipient.fill('이하늘');
      await expect(page.getByTestId('preview-name')).toHaveText('이하늘');
      await page.getByTestId('save-shipping').click();
      await expect(page.getByTestId('shipping-status')).toHaveText('저장 중');
      await expect(page.getByTestId('save-shipping')).toBeDisabled();
      await recipient.fill('김민지');
      await expect(
        page.getByText('저장 중에 바꾼 내용은 아직 미저장', { exact: false })
      ).toBeVisible();
      await expect(recipient).toHaveValue('김민지');
      await expect(page.getByTestId('shipping-status')).toHaveText(
        '미저장 변경'
      );
      await expect(page.getByTestId('save-count')).toHaveText('1회');
      expect(errors).toEqual([]);
    });

    test('shipping: confirmed rejection keeps input and explicit retry succeeds', async ({
      page,
    }) => {
      const errors = watchErrors(page);
      await page.goto(`${url}#delivery`);
      await expect(page.getByLabel('받는 분', { exact: true })).toBeVisible();
      await page
        .getByLabel('배송 요청사항', { exact: true })
        .fill('경비실에 맡겨주세요.');
      await page.locator('summary').filter({ hasText: '저장 상황' }).click();
      await page
        .getByRole('button', { name: '다음 저장 실패', exact: true })
        .click();
      await page.getByTestId('save-shipping').click();
      await expect(page.getByRole('alert')).toContainText('입력 내용은 그대로');
      await expect(
        page.getByLabel('배송 요청사항', { exact: true })
      ).toHaveValue('경비실에 맡겨주세요.');
      await page.getByTestId('save-shipping').click();
      await expect(page.getByTestId('shipping-status')).toHaveText('저장됨');
      await expect(page.getByTestId('save-count')).toHaveText('2회');
      expect(errors).toEqual([]);
    });

    test('address: modal cancellation, external conflict, and local application', async ({
      page,
    }) => {
      const errors = watchErrors(page);
      await page.goto(`${url}#delivery`);
      const address = page.getByTestId('shipping-address');
      await expect(address).toContainText('서울 마포구 성미산로 87');
      await page
        .getByRole('button', { name: '주소 수정', exact: true })
        .click();
      const dialog = page.getByRole('dialog');
      await dialog
        .getByLabel('주소', { exact: true })
        .fill('서울 종로구 자하문로 10');
      await expect(address).toContainText('서울 마포구 성미산로 87');
      await dialog.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(address).toContainText('서울 마포구 성미산로 87');
      await page
        .getByRole('button', { name: '주소 수정', exact: true })
        .click();
      await dialog
        .getByLabel('주소', { exact: true })
        .fill('서울 강남구 테헤란로 15');
      await dialog.locator('summary').click();
      await dialog
        .getByRole('button', { name: '다른 기기에서 주소 변경', exact: true })
        .click();
      await expect(dialog.getByRole('alert')).toContainText(
        '서울 성동구 연무장길 23'
      );
      await expect(
        dialog.getByRole('button', { name: '이 주소 적용', exact: true })
      ).toBeDisabled();
      await dialog
        .getByRole('button', { name: '작성한 주소 유지', exact: true })
        .click();
      await dialog
        .getByRole('button', { name: '이 주소 적용', exact: true })
        .click();
      await expect(dialog).toHaveCount(0);
      await expect(address).toContainText('서울 강남구 테헤란로 15');
      await expect(page.getByTestId('shipping-status')).toHaveText(
        '미저장 변경'
      );
      await expect(page.getByTestId('save-count')).toHaveText('0회');
      expect(errors).toEqual([]);
    });

    test('reload: restores unsaved input without sending it, and reset clears only this example', async ({
      page,
    }) => {
      const errors = watchErrors(page);
      await page.goto(`${url}#delivery`);
      await expect(page.getByLabel('받는 분', { exact: true })).toBeVisible();
      await page
        .getByLabel('배송 요청사항', { exact: true })
        .fill('작성 중인 배송 요청');
      await expect(page.getByTestId('preview-note')).toHaveText(
        '작성 중인 배송 요청'
      );
      await page.evaluate(() =>
        localStorage.setItem('unrelated-shop-test', 'keep')
      );
      await page.reload();
      await expect(
        page.getByLabel('배송 요청사항', { exact: true })
      ).toHaveValue('작성 중인 배송 요청');
      await expect(page.getByTestId('shipping-status')).toHaveText(
        '미저장 변경'
      );
      await expect(page.getByTestId('save-count')).toHaveText('0회');
      await page
        .getByRole('button', { name: '예제 초기화', exact: true })
        .click();
      await expect(
        page.getByLabel('배송 요청사항', { exact: true })
      ).toHaveValue('문 앞에 놓아주세요.');
      expect(
        await page.evaluate(() => localStorage.getItem('unrelated-shop-test'))
      ).toBe('keep');
      expect(errors).toEqual([]);
    });

    test('basket: observes three notifications or one, with usable mobile layout', async ({
      page,
    }) => {
      const errors = watchErrors(page);
      await page.goto(url);
      await expect(page.getByTestId('product-card')).toHaveCount(4);
      await page
        .getByRole('button', {
          name: '잘 익은 아보카도 장바구니 담기',
          exact: true,
        })
        .click();
      await page
        .getByRole('button', { name: '일반 적용', exact: true })
        .click();
      await expect(page.getByTestId('notification-count')).toHaveText('3회');
      await expect(page.getByTestId('order-total')).toHaveText('24,600원');
      await page
        .getByRole('button', { name: 'batch 적용', exact: true })
        .click();
      await expect(page.getByTestId('notification-count')).toHaveText('1회');
      await expect(page.getByTestId('order-total')).toHaveText('24,600원');
      await page.screenshot({
        path: test.info().outputPath('basket.png'),
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(
        page.getByRole('button', { name: 'batch 적용', exact: true })
      ).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport);
      await page.screenshot({
        path: test.info().outputPath('basket-mobile.png'),
        fullPage: true,
      });
      await chooseTab(page, '상품 둘러보기');
      await expect(page.getByLabel('상품 검색')).toBeVisible();
      expect(errors).toEqual([]);
    });
  });
}
