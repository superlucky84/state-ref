import { createStore } from 'state-ref';
import { ensureShared } from 'state-ref/shared';
import { createSyncClient } from '@stateref/sync-legacy';
import { createPanel } from './common';
import { syncDemo } from './sync-common';

/** Real, pinned 0.2.0 implementation, not a fake client missing observe(). */
const client = ensureShared('demo.sync-hooks', () => {
  syncDemo().maker = 'sync-legacy';
  return createSyncClient();
});
const panel = createPanel('sync-legacy');
let error = '(none)';
panel.action('legacy-ref-key', '0.2 코드에서 ref를 키로 사용', () => {
  try {
    const query = client.query({
      queryKey: ['user', createStore(7)()],
      queryFn: () => 1,
    });
    query.dispose();
    error = '(accepted)';
  } catch (caught) {
    error = (caught as Error).message;
  }
});
panel.row('legacyMaker', '공유 클라이언트 생성 번들', () => syncDemo().maker);
panel.row('legacyObserve', '공유 클라이언트의 observe 유무', () =>
  String(typeof Reflect.get(client, 'observe') === 'function')
);
panel.row('legacyRefError', 'ref 키 오류', () => error);
