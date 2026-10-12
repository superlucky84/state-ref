import { h, render } from 'preact';
import { useSyncQuery } from '@stateref/connect-preact/sync';
import { accountOptions, syncDemo, syncPanel } from './sync-common';

const { client, panel } = syncPanel('sync-hook');
const root = document.getElementById('sync-hook-root')!;
let id = 1;
let renderSize = -1;
let error = '(none)';

function Account() {
  const [display, q] = useSyncQuery(client, accountOptions(id));
  syncDemo().controls.set('hook', q);
  // Capture inside the very first render, before subscription effects.
  if (renderSize < 0) renderSize = client.size();
  const props: Record<string, string> = { 'data-row': 'hookData' };
  return h('span', props, display.data.value?.name ?? '(pending)');
}

panel.action('hook-mount', 'Preact 훅 마운트', () => {
  try {
    render(h(Account, null), root);
  } catch (caught) {
    error = (caught as Error).message;
  }
});
panel.action('hook-switch', 'Preact 훅 키 2로 변경', () => {
  id = 2;
  render(h(Account, null), root);
});
panel.action('hook-unmount', 'Preact 훅 언마운트', () => render(null, root));
panel.row('hookRenderSize', '첫 렌더의 캐시 크기', () => String(renderSize));
panel.row('hookError', '훅 오류', () => error);
panel.row('hookHandle', '훅 handle의 키', () =>
  String(syncDemo().controls.get('hook')?.handle()?.queryKey[1] ?? '(none)')
);
