import { describe, it, expect, vi } from 'vitest';
import { createSyncClient } from '@stateref/sync';
import { createDevtools } from '../index';

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};
describe('read-only Sync adapter', () => {
  it('isolates clients and keeps request counts and owners unchanged', async () => {
    const a = createSyncClient({ ssr: true });
    const b = createSyncClient({ ssr: true });
    const read = vi.fn(() => ({ privatePayload: 'never-in-tools' }));
    const first = a.query({ queryKey: ['same'], queryFn: read });
    const second = b.query({ queryKey: ['same'], queryFn: read });
    const tools = createDevtools();
    tools.attachSync(a, { name: 'api' });
    tools.attachSync(b, { name: 'api' });
    expect(tools.inspectSync(1).cache[0].owners).toBe(1);
    expect(read).not.toHaveBeenCalled();
    await first.load();
    await flush();
    expect(read).toHaveBeenCalledTimes(1);
    expect(tools.inspectSync(1).cache[0].status.loaded).toBe(true);
    expect(tools.inspectSync(2).cache[0].status.loaded).toBe(false);
    expect(JSON.stringify(tools.getSnapshot())).not.toContain('never-in-tools');
    tools.pause();
    tools.inspectSync(1);
    tools.resume();
    tools.dispose();
    expect(read).toHaveBeenCalledTimes(1);
    expect(a.inspectCache()[0].owners).toBe(1);
    first.dispose();
    second.dispose();
  });
  it('retains settled metadata without inputs, responses or errors', async () => {
    const client = createSyncClient({ ssr: true });
    const tools = createDevtools();
    tools.attachSync(client);
    const command = client.mutation({
      mutationFn: async (_input: string) => ({ secretResponse: 'hidden' }),
    });
    const task = command.start('private-input');
    await task.result;
    await flush();
    expect(client.inspectMutations()).toEqual([]);
    expect(
      tools
        .getSnapshot()
        .history.some(
          record =>
            record.kind === 'sync-mutation' &&
            record.event.type === 'settled' &&
            record.event.entry.phase === 'success'
        )
    ).toBe(true);
    const json = JSON.stringify(tools.getSnapshot());
    expect(json).not.toContain('private-input');
    expect(json).not.toContain('secretResponse');
    task.dispose();
    command.dispose();
    tools.dispose();
  });
  it('ignores pre-attach and disconnected delivery, and represents owners zero accurately', async () => {
    const client = createSyncClient({ ssr: true });
    const handle = client.query({ queryKey: ['before'], queryFn: () => 1 });
    const tools = createDevtools();
    const detach = tools.attachSync(client);
    await flush();
    expect(
      tools.getSnapshot().history.filter(record => record.kind === 'sync-cache')
    ).toEqual([]);
    handle.dispose();
    await flush();
    expect(tools.inspectSync(1).cache[0].owners).toBe(0);
    const next = client.query({ queryKey: ['after'], queryFn: () => 2 });
    detach();
    const count = tools.getSnapshot().history.length;
    await flush();
    expect(tools.getSnapshot().history.length).toBe(count);
    expect(client.inspectCache()).toHaveLength(2);
    next.dispose();
    tools.dispose();
  });
  it('bounds metadata labels and rolls back a partial subscription failure', () => {
    const client = createSyncClient({ ssr: true });
    const handle = client.query({
      queryKey: ['x'.repeat(2000)],
      queryFn: () => 1,
    });
    const tools = createDevtools();
    tools.attachSync(client);
    expect(tools.inspectSync(1).cache[0].keyTruncated).toBe(true);
    expect(tools.inspectSync(1).cache[0].queryKey.length).toBeLessThan(600);
    const stop = vi.fn();
    const broken = {
      inspectCache: () => [],
      inspectMutations: () => [],
      subscribeCache: () => stop,
      subscribeMutations: () => {
        throw Error('subscribe');
      },
    };
    expect(() => tools.attachSync(broken)).toThrow('subscribe');
    expect(stop).toHaveBeenCalledTimes(1);
    expect(tools.getSnapshot().sources).toHaveLength(1);
    tools.dispose();
    handle.dispose();
  });
});
