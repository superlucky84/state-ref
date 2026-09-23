import { createSSRApp } from 'vue';
import type { createSsrModelFromSnapshot } from 'stateref-example-shared';
import App from './App.vue';
import 'stateref-example-shared/demo.css';

declare global {
  interface Window {
    __STATEREF_SNAPSHOT__?: Parameters<typeof createSsrModelFromSnapshot>[0];
  }
}

const snapshot = window.__STATEREF_SNAPSHOT__;
if (!snapshot) throw new Error('서버가 넘긴 snapshot이 없다.');

createSSRApp(App, { snapshot }).mount('#app');
