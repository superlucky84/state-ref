import { syncDemo, syncPanel } from './sync-common';

// This bundle creates the client before the observer and hook bundles load.
const { client, panel } = syncPanel('sync-provider');
const mutation = client.mutation({
  mutationFn: (input: { name: string }) => {
    syncDemo().writes += 1;
    return input;
  },
});
let result = '(not run)';

panel.action('sync-reply', 'READ 완료', () => {
  for (const reply of syncDemo().replies.splice(0)) reply();
});
panel.action(
  'sync-mutate',
  '다른 번들의 q.handle()로 mutation 연결',
  async () => {
    const query = syncDemo().controls.get('hook')?.handle();
    if (!query) throw new Error('The hook must be attached before mutating.');
    query.ref.name.value = 'edited';
    const outcome = await mutation.run(
      { name: 'edited' },
      {
        links: [
          { query, submission: query.capture(), accept: { kind: 'submitted' } },
        ],
      }
    );
    result = outcome.kind;
  }
);
panel.action('sync-flush-release', '예약한 observer 해제 실행', () => {
  for (const release of syncDemo().releases.splice(0)) release();
});
panel.row('syncMaker', '클라이언트 생성 번들', () => syncDemo().maker);
panel.row('syncReads', 'READ 횟수', () => String(syncDemo().reads));
panel.row('syncWrites', 'WRITE 횟수', () => String(syncDemo().writes));
panel.row('syncSize', '캐시 항목 수', () => String(client.size()));
panel.row('syncOwners', '키별 owner 수', () =>
  client
    .inspectCache()
    .map(entry => `${entry.queryKey[1]}:${entry.owners}`)
    .join(',')
);
panel.row('syncReleases', '예약한 해제 수', () =>
  String(syncDemo().releases.length)
);
panel.row('syncMutation', 'mutation 결과', () => result);
panel.row('syncDirty', '훅 handle의 로컬 변경', () =>
  String(syncDemo().controls.get('hook')?.handle()?.isDirty() ?? false)
);
