import { render } from 'solid-js/web';
import { createMission } from 'stateref-example-shared/mission';
import { createMissionApp } from './MissionApp';
import 'stateref-example-shared/mission.css';
const model = createMission();
const App = createMissionApp(model);
const unmount = render(
  () => <App />,
  document.getElementById('app') as HTMLElement
);
let stopped = false;
const stop = () => {
  if (stopped) return;
  stopped = true;
  window.removeEventListener('pagehide', stop);
  unmount();
  model.dispose();
};
window.addEventListener('pagehide', stop, { once: true });
if (import.meta.hot) import.meta.hot.dispose(stop);
