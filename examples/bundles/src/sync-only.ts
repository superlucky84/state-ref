import { createSyncClient } from '@stateref/sync';
import type { QueryHandle } from '@stateref/sync';
import { createPage, installNetworkProbe } from './page';

/**
 * sync without draft (M2-01, "sync만 사용하는 페이지").
 *
 * `@stateref/sync` depends on core, not on `state-ref/draft`, so this entry's
 * module graph must show the sync dist with no draft module in it.
 *
 * The server is in-memory (DC8-5-07): the demo never reaches the network, and
 * the counter on screen says so.
 */

type Profile = { city: string; zip: string };
type SaveDto = { city: string; zip: string; version: number };
type SaveResponse = { revision: number };

const networkCalls = installNetworkProbe();
const page = createPage();

let stored: Profile = { city: '서울', zip: '04524' };
let revision = 1;
let reads = 0;
let writes = 0;

const client = createSyncClient();
const query: QueryHandle<Profile> = client.query<Profile>({
  queryKey: ['profile'],
  queryFn: () => {
    reads += 1;
    return Promise.resolve({ ...stored });
  },
});
const mutation = client.mutation<SaveDto, SaveResponse>({
  mutationFn: input => {
    writes += 1;
    stored = { city: input.city, zip: input.zip };
    revision += 1;
    return Promise.resolve({ revision });
  },
});

// `query.watch` and `query.ref` throw before the first load, so only status
// is connected up front (DC8-5-16).
query.watchStatus(() => {
  page.paint();
});

page.row('status.loaded', () => String(query.status.loaded.value));
page.row('status.status', () => query.status.status.value);
page.row('dirty', () => String(query.status.dirty.value));
page.row('version', () => String(query.status.version.value));
page.row('ref.city', () => query.ref.city.value);
page.row('서버 값', () => `${stored.city} / rev ${revision}`);
page.row('READ / WRITE', () => `${reads} / ${writes}`);
page.row('네트워크 호출', () => `${networkCalls()}회`);

page.action('조회 (load)', () => {
  void query
    .load()
    .then(() => page.log('조회를 마쳤다. 이제 ref를 읽고 쓸 수 있다.'))
    .catch(error => page.log(`조회 실패: ${String(error)}`));
});
page.action('도시 → 부산', () => {
  query.ref.city.value = '부산';
  page.log('resource를 편집했다. 편집만으로는 WRITE가 시작되지 않는다.');
});
page.action('저장 (mutation)', () => {
  const submission = query.capture();
  void mutation
    .run({
      city: submission.value.city,
      zip: submission.value.zip,
      version: submission.version,
    })
    .then(result => page.log(`저장 결과: ${result.kind}`))
    .catch(error => page.log(`저장 실패: ${String(error)}`));
  page.log('조회 shape와 다른 DTO를 보냈다.');
});
page.action('서버가 먼저 바뀜', () => {
  stored = { ...stored, city: '광주' };
  revision += 1;
  page.log('클라이언트 모르게 서버를 바꿨다. 재조회로 확인한다.');
});
page.action('재조회 (refetch)', () => {
  void query
    .refetch()
    .then(() => page.log('재조회를 마쳤다.'))
    .catch(error => page.log(`재조회 실패: ${String(error)}`));
});

page.paint();
