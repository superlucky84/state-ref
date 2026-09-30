<script setup lang="ts">
import { connectVue } from '@stateref/connect-vue';
import type { ShopModel } from 'stateref-example-shared/shop';
const { model } = defineProps<{ model: ShopModel }>();
const useShipping = connectVue(model.profile.watch);
const recipient = useShipping(ref => ref.recipient);
const phone = useShipping(ref => ref.phone);
const address = useShipping(ref => ref.address);
const note = useShipping(ref => ref.note);
const status = connectVue(model.profile.watchStatus)(ref => ref);
</script>

<template>
  <form class="panel" @submit.prevent="model.saveShipping()">
    <div class="panel-title">
      <h2>배송정보</h2>
      <span
        data-testid="shipping-status"
        :class="[
          'status-pill',
          status.value.pending > 0 ? 'busy' : status.value.dirty ? 'dirty' : '',
        ]"
        >{{
          status.value.pending > 0
            ? '저장 중'
            : status.value.dirty
            ? '미저장 변경'
            : '저장됨'
        }}</span
      >
    </div>
    <div class="field-grid">
      <label class="field"
        >받는 분<input v-model="recipient.value" autocomplete="name" /></label
      ><label class="field"
        >연락처<input v-model="phone.value" autocomplete="tel"
      /></label>
    </div>
    <div class="label-row">
      <span>배송 주소</span
      ><button type="button" class="button link" @click="model.openAddress()">
        주소 수정
      </button>
    </div>
    <div class="address-box" data-testid="shipping-address">
      {{ address.value.street }}<small>{{ address.value.detail }}</small>
    </div>
    <label class="field">배송 요청사항<textarea v-model="note.value" /></label>
    <div class="panel-footer">
      <span class="subtext">{{
        status.value.pending > 0
          ? '저장 중에도 계속 입력할 수 있어요.'
          : '변경한 내용을 서버에 저장하세요.'
      }}</span
      ><button
        data-testid="save-shipping"
        class="button primary"
        type="submit"
        :disabled="!status.value.dirty || status.value.pending > 0"
      >
        {{ status.value.pending > 0 ? '저장 중…' : '저장하기' }}
      </button>
    </div>
  </form>
</template>
