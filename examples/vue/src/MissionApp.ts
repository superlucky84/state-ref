import { defineComponent, h, type VNode } from 'vue';
import { connectVue } from '@stateref/connect-vue';
import { useSyncQuery } from '@stateref/connect-vue/sync';
import { shipScreen, type Mission } from 'stateref-example-shared/mission';
import {
  missionBoard,
  shipCard,
  starCounter,
  type NodeFactory,
} from 'stateref-example-shared/mission-view';

const node: NodeFactory<VNode> = (tag, props, ...children) =>
  h(tag, props, children);
export function createMissionApp(model: Mission) {
  const Stars = defineComponent({
    setup() {
      const stars = connectVue(model.counter)(ref => ref);
      return () =>
        starCounter(node, stars.value, () => {
          stars.value += 1;
        });
    },
  });
  const Panel = defineComponent({
    props: {
      id: { type: Number, required: true },
      poll: Boolean,
      slot: { type: String, required: true },
      saving: Boolean,
    },
    setup(props) {
      const [select, q] = useSyncQuery(model.client, () =>
        model.options(props.id, props.poll)
      );
      const screen = select(ref => shipScreen(ref));
      return () =>
        shipCard(node, screen.value, model, q, props.slot, props.saving);
    },
  });
  return defineComponent({
    setup() {
      const ui = connectVue(model.ui)(ref => ref);
      return () => {
        const state = ui.value;
        const panels = state.open
          ? [
              h(Stars),
              h(Panel, {
                id: state.id,
                poll: state.poll,
                slot: 'a',
                saving: state.saving,
              }),
            ]
          : [];
        if (state.open && state.twin)
          panels.push(
            h(Panel, {
              id: state.id,
              poll: state.poll,
              slot: 'b',
              saving: state.saving,
            })
          );
        return missionBoard(node, state, model, panels, 'Vue');
      };
    },
  });
}
