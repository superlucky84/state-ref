# 작은 쇼핑몰 예제

Preact와 Vue에서 같은 세 화면을 제공한다. 가상 서버가 조회 약 0.4초, 저장 약 1.8초 후 자동 응답한다. 외부 API나 계정은 필요 없다.

저장소 루트에서 각각 실행한다.

```sh
pnpm --filter stateref-example-preact dev
pnpm --filter stateref-example-vue dev
```

- Preact: <http://localhost:5182/shop.html>
- Vue: <http://localhost:5183/shop.html>

## 빠르게 확인하기

1. **상품 둘러보기:** `상품 더 보기`로 목록을 늘리고, 분류와 검색을 바꿔 본다. 분류를 다시 선택하면 30초 동안 조회 캐시를 재사용한다.
2. **배송정보:** 받는 분을 수정하면 미리보기도 즉시 바뀐다. `저장하기`를 누른 뒤 받는 분을 다시 바꾸면, 먼저 제출한 내용은 저장되고 나중에 쓴 입력은 미저장으로 남는다.
3. **주소 수정:** 주소를 바꾸고 취소하면 본문은 그대로다. `이 주소 적용`은 배송 폼에 반영하고, 서버 저장은 별도의 `저장하기`가 담당한다.
4. **장바구니 · batch:** `일반 적용`과 `batch 적용`을 번갈아 누른다. 최종 구성은 같고 실제 store 구독 알림은 각각 3회와 1회다. 상품을 담으면 그 상품의 가격으로 비교할 수 있다.

조회 실패, 저장 실패·지연, 다른 기기의 주소 변경은 각 화면 아래 접힌 도구에 있다. 작성 중인 배송정보와 가상 서버의 저장값은 브라우저에 보관된다. 새로고침은 자동 저장을 보내지 않으며, `예제 초기화`는 해당 프레임워크 예제의 보관값만 지운다. 저장 중 새로고침한 경우에는 서버를 다시 조회한 뒤 입력을 복원한다.

## 코드 위치

- 공통 동작: [shop.ts](./shared/src/shop.ts), [공통 모델 테스트](./shared/src/shop.test.ts)
- Preact: [ShopApp.tsx](./preact/src/shop/ShopApp.tsx)
- Vue: [ShopApp.vue](./vue/src/shop/ShopApp.vue), [배송 폼](./vue/src/shop/ShippingFields.vue), [주소 모달](./vue/src/shop/AddressDialog.vue)
- 브라우저 흐름: [shop.spec.ts](./e2e/src/shop.spec.ts)

기존 진단 화면은 각 개발 서버의 `/`에서 계속 열 수 있다. 수용 기준과 검증 기록은 [Phase 10](../docs/server-sync/IMPLEMENT.md)과 [M2-22](../docs/server-sync/MANUAL_TEST_CHECKLIST.md#m2-22)를 따른다.
