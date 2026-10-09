import { mount, unmount } from 'svelte';
import { createMission } from 'stateref-example-shared/mission';
import MissionApp from './MissionApp.svelte';
import 'stateref-example-shared/mission.css';
const model = createMission();
const app = mount(MissionApp, {
  target: document.getElementById('app') as HTMLElement,
  props: { model },
});
let stopped = false;
const stop = () => {
  if (stopped) return;
  stopped = true;
  window.removeEventListener('pagehide', stop);
  void unmount(app).then(() => model.dispose());
};
window.addEventListener('pagehide', stop, { once: true });
if (import.meta.hot) import.meta.hot.dispose(stop);
