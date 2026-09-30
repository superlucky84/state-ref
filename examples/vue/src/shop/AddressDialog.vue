<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { connectVue } from '@stateref/connect-vue';
import type { ShopModel } from 'stateref-example-shared/shop';
const { model } = defineProps<{ model: ShopModel }>();
const draft = model.draft!;
const useAddress = connectVue(draft.watch);
const street = useAddress(state => state.street);
const detail = useAddress(state => state.detail);
const status = connectVue(draft.watchStatus)(state => state);
const source = connectVue(model.profile.watch)(state => state.address);
const dialog = ref<HTMLDialogElement>();
onMounted(() => dialog.value?.showModal());
</script>

<template>
  <dialog
    ref="dialog"
    class="shop-dialog"
    aria-labelledby="address-title"
    @cancel.prevent="model.closeAddress()"
  >
    <h2 id="address-title">배송 주소 수정</h2>
    <p class="subtext">취소하면 기존 주소가 유지돼요.</p>
    <label class="field">주소<input v-model="street.value" autofocus /></label
    ><label class="field">상세 주소<input v-model="detail.value" /></label>
    <div v-if="status.value.conflicts > 0" class="conflict" role="alert">
      <strong>다른 곳에서 주소가 변경됐어요.</strong>
      <p>
        새 주소: {{ source.value.street }}<br />작성한 주소: {{ street.value }}
      </p>
      <button class="button" @click="model.resolveAddress('draft')">
        작성한 주소 유지</button
      ><button class="button" @click="model.resolveAddress('source')">
        새 주소 사용
      </button>
    </div>
    <details class="test-tools">
      <summary>주소 충돌 상황 테스트</summary>
      <div class="test-tool-body">
        <button class="button" @click="model.changeServerAddress()">
          다른 기기에서 주소 변경
        </button>
      </div>
    </details>
    <div class="dialog-actions">
      <button class="button" @click="model.closeAddress()">취소</button
      ><button
        class="button primary"
        :disabled="status.value.conflicts > 0"
        @click="model.applyAddress()"
      >
        이 주소 적용
      </button>
    </div>
  </dialog>
</template>
