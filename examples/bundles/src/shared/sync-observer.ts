import { accountOptions, syncDemo, syncPanel } from './sync-common';

const { client, panel } = syncPanel('sync-observer');
const observer = client.observe(accountOptions(1), {
  scheduleRelease: release => syncDemo().releases.push(release),
});
syncDemo().controls.set('observer', observer.controls);
// Render-like reads from a foreign client's observer must not open a query.
void observer.watch().data.value;
void observer.peek(accountOptions(2)).data.value;
const renderSize = client.size();
let ref = observer.watch();
let subscription: AbortController | undefined;

panel.action('observer-mount', 'observer 구독', () => {
  subscription = new AbortController();
  ref = observer.watch(value => {
    void value.data.value;
    panel.repaint();
    return subscription!.signal;
  });
});
panel.action('observer-switch', 'observer 키 2로 변경', () => {
  observer.setOptions(accountOptions(2));
});
panel.action('observer-unmount', 'observer 구독 해제', () =>
  subscription?.abort()
);
panel.row('observerRenderSize', '구독 전 읽기의 캐시 크기', () =>
  String(renderSize)
);
panel.row(
  'observerData',
  'observer 데이터',
  () => ref.data.value?.name ?? '(pending)'
);
panel.row('observerHandle', 'observer handle의 키', () =>
  String(observer.controls.handle()?.queryKey[1] ?? '(none)')
);
