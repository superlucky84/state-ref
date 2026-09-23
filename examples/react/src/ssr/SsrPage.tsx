import { useMemo } from 'react';
import { connectReact } from '@stateref/connect-react';
import type { SsrModel } from 'stateref-example-shared';

/**
 * The server-rendered page (step 5 of docs/server-sync/PHASE8_5.md).
 *
 * The same component renders on the server and hydrates in the browser. It
 * takes its model as a prop rather than reaching for a module-level
 * singleton: a server render has no unmount, so one client per request is the
 * contract Phase 8.4 arrived at.
 *
 * The model is loaded before this renders - `query.watch` throws otherwise.
 */
export default function SsrPage({ model }: { model: SsrModel }) {
  const useProfile = useMemo(() => connectReact(model.watch), [model]);
  const useDerived = useMemo(() => connectReact(model.derived), [model]);
  const useCombined = useMemo(() => connectReact(model.combined), [model]);
  const profile = useProfile();
  const derived = useDerived();
  const combined = useCombined();

  return (
    <main>
      <h1>state-ref — React SSR과 hydration</h1>
      <p className="note">
        서버가 만든 HTML과 브라우저가 이어받은 화면이 같아야 한다.
      </p>
      <section className="card">
        <h2>조회한 서버 값</h2>
        <div className="row">
          <span>도시</span>
          <b data-testid="city">{profile.city.value}</b>
        </div>
        <div className="row">
          <span>우편번호</span>
          <b data-testid="zip">{profile.zip.value}</b>
        </div>
      </section>
      <section className="card">
        <h2>파생 값</h2>
        <div className="row">
          <span>createComputed</span>
          <b data-testid="derived">{derived.value}</b>
        </div>
        <div className="row">
          <span>combineWatch</span>
          <b data-testid="combined">
            {combined[0].city.value} / 대문자{' '}
            {String(combined[1].upperCase.value)}
          </b>
        </div>
      </section>
    </main>
  );
}
