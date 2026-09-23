<script setup lang="ts">
import { onServerPrefetch, shallowRef, useSSRContext } from 'vue';
import {
  createSsrModelFromSnapshot,
  createSsrModelOnServer,
} from 'stateref-example-shared';
import type { SsrModel } from 'stateref-example-shared';
import SsrPage from './SsrPage.vue';

/**
 * M2-04 asks specifically for the `onServerPrefetch` path: a value loaded
 * there must reach the server HTML. The model is built during prefetch on the
 * server and restored from the snapshot in the browser, so both sides render
 * the same baseline.
 */
const props = defineProps<{
  snapshot?: Parameters<typeof createSsrModelFromSnapshot>[0];
}>();

const model = shallowRef<SsrModel | null>(
  props.snapshot ? createSsrModelFromSnapshot(props.snapshot) : null
);

// `useSSRContext` has to be read during setup, not inside the async callback.
// Same server test the connectors use (DC8-4-02).
const ssrContext =
  typeof window === 'undefined'
    ? useSSRContext<{ model?: SsrModel }>()
    : undefined;

onServerPrefetch(async () => {
  const loaded = await createSsrModelOnServer();
  model.value = loaded;
  // The entry needs the request's model to dehydrate it after the render.
  if (ssrContext) ssrContext.model = loaded;
});
</script>

<template>
  <SsrPage v-if="model" :model="model" />
  <p v-else class="note">아직 로드되지 않았다.</p>
</template>
