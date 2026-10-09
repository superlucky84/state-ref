import { createApp } from 'vue';
import { createMission } from 'stateref-example-shared/mission';
import { createMissionApp } from './MissionApp';
import 'stateref-example-shared/mission.css';
const model = createMission();
const app = createApp(createMissionApp(model));
app.mount('#app');
let stopped = false;
const stop = () => {
  if (stopped) return;
  stopped = true;
  window.removeEventListener('pagehide', stop);
  app.unmount();
  model.dispose();
};
window.addEventListener('pagehide', stop, { once: true });
if (import.meta.hot) import.meta.hot.dispose(stop);
