import { hydrateRoot } from 'react-dom/client';
import { createSsrModelFromSnapshot } from 'stateref-example-shared';
import SsrPage from './SsrPage';
import 'stateref-example-shared/demo.css';

declare global {
  interface Window {
    __STATEREF_SNAPSHOT__?: Parameters<typeof createSsrModelFromSnapshot>[0];
  }
}

const snapshot = window.__STATEREF_SNAPSHOT__;
if (!snapshot) throw new Error('서버가 넘긴 snapshot이 없다.');

// A fresh client restored from the server's clean baseline. No READ runs, so
// the first browser render has to equal the HTML the server sent.
const model = createSsrModelFromSnapshot(snapshot);
hydrateRoot(
  document.getElementById('app') as HTMLElement,
  <SsrPage model={model} />
);
