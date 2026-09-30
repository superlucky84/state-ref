<script setup lang="ts">
import { ref } from 'vue';
import { create } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

/**
 * The connector's write rule, on screen (DC-CN-04, DC-CN-10).
 *
 * A write that passes through the connector reaches the store; a change that
 * does not is refused. In Vue that means a selected object is `readonly`:
 * assigning one of its fields is refused (a warning in development) and
 * nothing changes, while assigning `.value` replaces it and does.
 *
 * The card keeps its own small store so that pressing these buttons never
 * touches the shared model the five-screen comparison reads.
 */
type Account = { address: { city: string; zip: string } };

const writes = ref(0);
const { watch } = create<Account>(
  { address: { city: '서울', zip: '04524' } },
  {
    onWrite: () => {
      writes.value += 1;
    },
  }
);
const use = connectVue(watch);
const address = use(store => store.address);
// A second, separate subscription: it moves only if the store really changed.
const city = use(store => store.address.city);

const writeNested = () => {
  // Refused: `address.value` is readonly, so this never reaches the store.
  address.value.city = '대구';
};
const writeValue = () => {
  address.value = { ...address.value, city: '대구' };
};
</script>

<template>
  <section class="card" data-card="write-rule">
    <h2>쓰기 규칙</h2>
    <div class="row" data-rule="shown">
      <span>선택한 객체의 도시</span><b>{{ address.value.city }}</b>
    </div>
    <div class="row" data-rule="twin">
      <span>따로 구독한 도시</span><b>{{ city.value }}</b>
    </div>
    <div class="row" data-rule="writes">
      <span>스토어 쓰기 횟수</span><b>{{ writes }}</b>
    </div>
    <button data-write="nested" @click="writeNested">
      address.value.city = '대구'
    </button>
    <button data-write="value" @click="writeValue">
      address.value = { ...address.value, city: '대구' }
    </button>
    <p class="note">
      선택한 객체는 읽기 전용이다. 필드에 직접 쓰면 거절되고(개발 모드에서는
      readonly 경고) 아무것도 바뀌지 않는다. <code>.value</code>에 통째로 쓰면
      스토어에 반영되고 따로 구독한 쪽도 함께 바뀐다.
    </p>
  </section>
</template>
