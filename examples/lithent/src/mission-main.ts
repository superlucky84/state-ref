import { h, mount, render } from 'lithent';
import { connectLithent } from '@stateref/connect-lithent';
import { createSyncQuery } from '@stateref/connect-lithent/sync';
import { createMission, shipScreen } from 'stateref-example-shared/mission';
import {
  missionBoard,
  shipCard,
  starCounter,
  type NodeFactory,
} from 'stateref-example-shared/mission-view';
import 'stateref-example-shared/mission.css';
const model = createMission();
const node: NodeFactory<ReturnType<typeof h>> = (tag, props, ...children) =>
  h(tag, props, ...children);
const Stars = mount(() => {
  const stars = connectLithent(model.counter);
  return () =>
    starCounter(node, stars().value, () => {
      stars().value += 1;
    });
});
const Panel = mount<{
  id?: number;
  poll?: boolean;
  slot?: string;
  saving?: boolean;
}>((_renew, props) => {
  const [read, q] = createSyncQuery(model.client, () =>
    model.options(props.id ?? 1, props.poll ?? false)
  );
  return () =>
    shipCard(
      node,
      shipScreen(read()),
      model,
      q,
      props.slot ?? 'a',
      props.saving ?? false
    );
});
const App = mount(() => {
  const read = connectLithent(model.ui);
  return () => {
    const ui = read().value;
    const panels = ui.open
      ? [
          h(Stars, {}),
          h(Panel, { id: ui.id, poll: ui.poll, slot: 'a', saving: ui.saving }),
        ]
      : [];
    if (ui.open && ui.twin)
      panels.push(
        h(Panel, { id: ui.id, poll: ui.poll, slot: 'b', saving: ui.saving })
      );
    return missionBoard(
      node,
      ui,
      model,
      panels,
      import.meta.env.MODE === 'concurrent' ? 'Lithent concurrent' : 'Lithent'
    );
  };
});
const unmount = render(
  h(App, {}),
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
