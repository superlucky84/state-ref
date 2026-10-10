import { h as createElement, type JSX } from 'preact';
import { connectPreact } from '@stateref/connect-preact';
import { useSyncQuery } from '@stateref/connect-preact/sync';
import { shipScreen } from 'stateref-example-shared/mission';
import type { Mission } from 'stateref-example-shared/mission';
import {
  missionBoard,
  shipCard,
  starCounter,
} from 'stateref-example-shared/mission-view';
import type { NodeFactory } from 'stateref-example-shared/mission-view';

const node: NodeFactory<JSX.Element> = (tag, props, ...children) => {
  const { class: className, ...rest } = props;
  return createElement(
    tag,
    {
      className: typeof className === 'string' ? className : undefined,
      ...rest,
    },
    ...children
  );
};
export function createMissionApp(model: Mission) {
  const useUi = connectPreact(model.ui);
  const useStars = connectPreact(model.counter);
  function Stars() {
    const stars = useStars();
    return starCounter(node, stars.value, () => {
      stars.value += 1;
    });
  }
  function Panel(props: {
    id: number;
    poll: boolean;
    slot: string;
    saving: boolean;
  }) {
    const [ref, q] = useSyncQuery(
      model.client,
      model.options(props.id, props.poll)
    );
    return shipCard(node, shipScreen(ref), model, q, props.slot, props.saving);
  }
  return function MissionApp() {
    const ui = useUi().value;
    const panels = ui.open
      ? [
          <Stars key="stars" />,
          <Panel
            key="a"
            id={ui.id}
            poll={ui.poll}
            slot="a"
            saving={ui.saving}
          />,
        ]
      : [];
    if (ui.open && ui.twin)
      panels.push(
        <Panel key="b" id={ui.id} poll={ui.poll} slot="b" saving={ui.saving} />
      );
    return missionBoard(node, ui, model, panels, 'Preact');
  };
}
