import { createApp } from 'vue';
import { createBrowserSyncEnvironment } from '@stateref/sync';
import { createShopModel } from 'stateref-example-shared/shop';
import type { ShopTab } from 'stateref-example-shared/shop';
import ShopApp from './shop/ShopApp.vue';
import 'stateref-example-shared/shop.css';

const hash = location.hash.slice(1);
const model = createShopModel({
  namespace: 'stateref-shop-vue',
  storage: localStorage,
  environment: createBrowserSyncEnvironment(),
  initialTab: (['catalog', 'delivery', 'batch'].includes(hash)
    ? hash
    : 'catalog') as ShopTab,
  onTabChange: tab => history.replaceState(null, '', `#${tab}`),
});
const app = createApp(ShopApp, { model });
app.mount('#app');
void model.start();
const stop = () => {
  app.unmount();
  model.dispose();
};
window.addEventListener('pagehide', stop, { once: true });
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    window.removeEventListener('pagehide', stop);
    stop();
  });
