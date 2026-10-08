import { ensureShared } from 'state-ref/shared';
import { createSyncClient } from '@stateref/sync';
import type { SyncClient } from '@stateref/sync';

/**
 * What the provider bundle and the consumer bundle agree on.
 *
 * Both bundles import this file, and each build inlines its own copy of it -
 * along with its own copy of state-ref and of @stateref/sync. That is the
 * arrangement `state-ref/shared` exists for, so nothing here may be relied on
 * to be one object across the two; the only thing they truly share is the
 * page's `window`.
 */
export type Sub = { id: number };
export type Subs = { loaded: boolean; mySubs: Sub[] };

export const SUBS = 'demo.subs';
export const SYNC = 'demo.sync';

type Demo = {
  /** A server that lives on the page: no request leaves the browser. */
  server: string[];
  reads: number;
  writes: number;
  /** Which bundle's `create` ran for the shared client. */
  clientMakers: string[];
  clients: Set<unknown>;
};

export const demo = (): Demo =>
  ((window as unknown as { __sharedDemo?: Demo }).__sharedDemo ??= {
    server: ['a'],
    reads: 0,
    writes: 0,
    clientMakers: [],
    clients: new Set(),
  });

/** The same line in both bundles; whichever runs first creates the client. */
export function sharedClient(who: string): SyncClient {
  const client = ensureShared(SYNC, () => {
    demo().clientMakers.push(who);
    return createSyncClient();
  });
  demo().clients.add(client);
  return client;
}

export const todosOptions = {
  queryKey: ['todos'],
  queryFn: async (): Promise<string[]> => {
    demo().reads += 1;
    return [...demo().server];
  },
};

/** Both panels repaint on this, so a write in one bundle shows in the other. */
const PAINT = 'shared-demo:paint';

export function createPanel(rootId: string) {
  const root = document.getElementById(rootId);
  if (!root) throw new Error(`panel: #${rootId} is missing from the HTML.`);
  const actions = document.createElement('div');
  const list = document.createElement('dl');
  root.append(actions, list);
  const rows: { value: HTMLElement; read: () => string }[] = [];

  const paint = () => {
    for (const row of rows) {
      let text: string;
      try {
        text = row.read();
      } catch (error) {
        text = `예외: ${String(error)}`;
      }
      row.value.textContent = text;
    }
  };
  document.addEventListener(PAINT, paint);
  const repaint = () => document.dispatchEvent(new Event(PAINT));

  return {
    repaint,
    action(id: string, label: string, run: () => void | Promise<unknown>) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.action = id;
      button.textContent = label;
      button.addEventListener('click', () => {
        Promise.resolve()
          .then(run)
          .catch(error => console.error(error))
          .then(repaint);
      });
      actions.append(button);
    },
    row(id: string, label: string, read: () => string) {
      const term = document.createElement('dt');
      term.textContent = label;
      const value = document.createElement('dd');
      value.dataset.row = id;
      list.append(term, value);
      rows.push({ value, read });
      paint();
    },
  };
}
