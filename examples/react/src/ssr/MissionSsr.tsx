import { useEffect, useState } from 'react';
import { useSyncQuery } from '@stateref/connect-react/sync';
import type { SyncClient, QueryOptions } from '@stateref/sync';
import type { Ship } from 'stateref-example-shared/mission';
export type MissionSsrProps = {
  client: SyncClient;
  queryFn: QueryOptions<Ship>['queryFn'];
  renderReads: number;
  serverOwners: number;
};
export default function MissionSsr({
  client,
  queryFn,
  renderReads,
  serverOwners,
}: MissionSsrProps) {
  const [ship, q] = useSyncQuery(client, {
    queryKey: ['mission', 2],
    queryFn,
    staleTime: Infinity,
  });
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return (
    <main className="station">
      <header className="topbar">
        <span className="brand">✦ STARLIGHT GARAGE</span>
        <span className="framework">React SSR</span>
      </header>
      <section className="hero">
        <div>
          <span className="eyebrow">서버에서 출발한 탐험</span>
          <h1>별빛 정비소</h1>
          <p>서버의 우주선 정보를 그대로 이어받아요.</p>
        </div>
      </section>
      <article className="ship-card">
        <h2 data-testid="ssr-name">{ship.data.name.value}</h2>
        <p>
          연료 <b data-testid="ssr-fuel">{ship.data.fuel.value}</b> · 산소{' '}
          <b data-testid="ssr-oxygen">{ship.data.oxygen.value}</b>
        </p>
        <p data-testid="ssr-fetch">{ship.fetchStatus.value}</p>
        <button onClick={() => void q.refetch().catch(() => {})}>
          새로고침
        </button>
      </article>
      <section className="equipment">
        <p>
          렌더 중 추가 조회 <b data-testid="ssr-render-reads">{renderReads}</b>{' '}
          · 서버 소유자 <b data-testid="ssr-owners">{serverOwners}</b>
        </p>
        <p>
          브라우저가 이어받았나요?{' '}
          <b data-testid="ssr-hydrated">{String(hydrated)}</b>
        </p>
      </section>
    </main>
  );
}
