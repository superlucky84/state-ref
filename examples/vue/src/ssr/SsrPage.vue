<script setup lang="ts">
import { connectVue } from '@stateref/connect-vue';
import type { SsrModel } from 'stateref-example-shared';

/**
 * The server-rendered page (step 5 of docs/server-sync/PHASE8_5.md).
 *
 * Phase 8.4's review found the trap this guards: a Vue server branch that
 * copied the value once showed the pre-prefetch value even after
 * `onServerPrefetch` had moved it. The connector returns a getter on the
 * server for that reason, so what is rendered here is read at render time.
 */
const props = defineProps<{ model: SsrModel }>();

const profile = connectVue(props.model.watch);
const city = profile(store => store.city);
const zip = profile(store => store.zip);
const derived = connectVue(props.model.derived)(store => store);
const combined = connectVue(props.model.combined)(store => store[0].city);
const upper = connectVue(props.model.combined)(store => store[1].upperCase);
</script>

<template>
  <main>
    <h1>state-ref — Vue SSR과 hydration</h1>
    <p class="note">
      onServerPrefetch로 로드한 값이 서버 HTML에 들어가고, 브라우저가 이어받아도
      같아야 한다.
    </p>
    <section class="card">
      <h2>조회한 서버 값</h2>
      <div class="row">
        <span>도시</span><b data-testid="city">{{ city.value }}</b>
      </div>
      <div class="row">
        <span>우편번호</span><b data-testid="zip">{{ zip.value }}</b>
      </div>
    </section>
    <section class="card">
      <h2>파생 값</h2>
      <div class="row">
        <span>createComputed</span>
        <b data-testid="derived">{{ derived.value }}</b>
      </div>
      <div class="row">
        <span>combineWatch</span>
        <b data-testid="combined">
          {{ combined.value }} / 대문자 {{ upper.value }}
        </b>
      </div>
    </section>
  </main>
</template>
