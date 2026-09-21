import { render, cleanup } from '@solidjs/testing-library';
import { create } from 'state-ref';
import { createSyncClient } from '@stateref/sync';
import { connectSolidView } from '@/index';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  afterEach(cleanup);

  describe('Solid readonly live query view', () => {
    it('publishes only the current key and ends its signal subscription on disposal', async () => {
      const client = createSyncClient({ ssr: true });
      const input = create({ id: 1, enabled: false });
      const oldRead = deferred<{ name: string }>();
      const newRead = deferred<{ name: string }>();
      let oldSignal!: AbortSignal;
      const live = client.liveView(
        input.watch,
        ({ id, enabled }) => ({
          queryKey: ['solid-live', id],
          enabled,
          queryFn: ({ signal }) => {
            if (id === 1) {
              oldSignal = signal;
              return oldRead.promise;
            }
            return id === 2 ? newRead.promise : { name: 'three' };
          },
          retry: 0,
        }),
        { select: data => data.name, placeholderData: { name: 'waiting' } }
      );
      const checkReadonly = (watch: typeof live.watch) => {
        const selected = connectSolidView(watch)(ref => ref.data.value);
        // @ts-expect-error Solid view accessors do not expose a setter
        selected[1]('changed');
      };
      void checkReadonly;
      let selections = 0;
      function View() {
        const display = connectSolidView(live.watch)(ref => {
          selections += 1;
          return `${ref.queryKey.value?.[1]}:${ref.data.value}`;
        });
        return <span data-testid="live-view">{display()}</span>;
      }
      const screen = render(() => <View />);
      const shown = () => screen.getByTestId('live-view').textContent;
      expect(shown()).toBe('1:undefined');
      input.updateRef.enabled.value = true;
      await Promise.resolve();
      expect(shown()).toBe('1:waiting');

      input.updateRef.id.value = 2;
      await Promise.resolve();
      expect(oldSignal.aborted).toBe(true);
      expect(shown()).toBe('2:waiting');
      oldRead.resolve({ name: 'old' });
      await Promise.resolve();
      expect(shown()).toBe('2:waiting');
      newRead.resolve({ name: 'new' });
      await live.query!.load();
      await Promise.resolve();
      expect(shown()).toBe('2:new');
      live.query!.ref.name.value = 'edited';
      await Promise.resolve();
      expect(shown()).toBe('2:edited');

      screen.unmount();
      const afterDispose = selections;
      input.updateRef.id.value = 3;
      await live.query!.load();
      expect(selections).toBe(afterDispose);
      live.dispose();
    });
  });
}
