import { createRoot } from 'react-dom/client';

/**
 * Step 1 skeleton (docs/server-sync/PHASE8_5.md). The resource, draft,
 * loading/error and computed panels arrive with step 3. This entry exists so
 * the workspace wiring is type-checked and runnable before any demo code is
 * written.
 */
function App() {
  return (
    <main>React 데모 뼈대 — 패널은 Phase 8.5 구현 단계 3에서 채운다.</main>
  );
}

createRoot(document.getElementById('app') as HTMLElement).render(<App />);
