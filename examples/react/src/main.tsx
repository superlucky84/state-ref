import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// StrictMode mounts, unmounts and remounts in development; the connector has
// to survive it (F-R1, docs/connectors/DESIGN.md).
createRoot(document.getElementById('app') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
