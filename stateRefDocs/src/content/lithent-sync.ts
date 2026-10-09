export const lithentQueryExample = `import { h, mount } from 'lithent';
import { createSyncClient } from '@stateref/sync';
import { createSyncQuery } from '@stateref/connect-lithent/sync';

type Account = { name: string; age: number };
const client = createSyncClient(); // one client per browser app

export const AccountDetail = mount<{ id?: number }>((_renew, props) => {
  const [account, q] = createSyncQuery(client, () => {
    const id = props.id ?? null;
    return {
      queryKey: ['account', id],
      enabled: id !== null,
      staleTime: 30_000,
      queryFn: async ({ signal }): Promise<Account> => {
        const response = await fetch('/api/accounts/' + id, { signal });
        if (!response.ok) throw new Error('Could not read account');
        return response.json();
      },
    };
  });

  const editName = (event: Event) => {
    const handle = q.handle();
    if (handle?.status.value.loaded)
      handle.ref.name.value = (event.target as HTMLInputElement).value;
  };

  return () => h('section', {},
    h('p', {}, account().data.name.value ?? account().status.value),
    h('input', {
      value: account().data.name.value ?? '',
      disabled: !account().loaded.value,
      onInput: editName,
    }),
    h('button', { onClick: () => void q.refetch().catch(() => {}) }, 'Refresh'),
    h('button', { onClick: () => q.invalidate() }, 'Invalidate'),
  );
});`;

export const lithentSaveExample = `import type { QueryObserverControls, SyncClient } from '@stateref/sync';

type Account = { name: string; age: number };

// Call once in the mounter: const save = accountSave(client, q).
export function accountSave(client: SyncClient, q: QueryObserverControls<Account>) {
  const mutation = client.mutation({
    mutationFn: async (input: { id: unknown; name: string }, { signal }): Promise<Account> => {
      const response = await fetch('/api/accounts/' + input.id, {
        method: 'PUT', signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: input.name }),
      });
      if (!response.ok) throw new Error('Could not save account');
      return response.json();
    },
  });
  return async () => {
    const handle = q.handle();
    if (!handle?.status.value.loaded) return;
    const submission = handle.capture();
    return mutation.run(
      { id: handle.queryKey[1], name: submission.value.name },
      { links: [{ query: handle, submission,
        accept: { kind: 'response', select: response => response },
        onReject: 'keep',
      }] },
    );
  };
}`;

export const lithentSsrExample = `import { h, mount } from 'lithent';
import { renderToString } from 'lithent/ssr';
import { createSyncClient } from '@stateref/sync';
import { createSyncQuery } from '@stateref/connect-lithent/sync';

type Account = { name: string; age: number };

// data was loaded by the server's request handler.
export async function renderAccount(id: number, data: Account) {
  const client = createSyncClient({ ssr: true }); // one per request
  const options = {
    queryKey: ['account', id], queryFn: () => data, staleTime: 30_000,
  };
  await client.prefetch(options);
  const Detail = mount(() => {
    const [account] = createSyncQuery(client, options);
    return () => h('p', {}, account().data.name.value ?? '');
  });
  return { html: renderToString(h(Detail, {})), snapshot: client.dehydrate() };
}
// Browser: hydrate snapshot before creating/mounting AccountDetail.`;
