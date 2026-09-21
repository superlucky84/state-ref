import { render, cleanup, act } from '@testing-library/react';
import { create } from 'state-ref';
import { createSyncClient } from '@stateref/sync';
import { connectReactView } from '@/index';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}

if (import.meta.vitest) {
  const { describe, it, expect, afterEach } = import.meta.vitest;
  afterEach(cleanup);

  describe('React readonly live query view', () => {
    it('renders only the current key and releases its UI subscription on unmount', async () => {
      const client = createSyncClient({ ssr: true });
      const input = create({ id: 1, enabled: false });
      const oldRead = deferred<{ name: string }>();
      const newRead = deferred<{ name: string }>();
      let oldSignal!: AbortSignal;
      const live = client.liveView(
        input.watch,
        ({ id, enabled }) => ({
          queryKey: ['react-live', id],
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
      const useView = connectReactView(live.watch);
      const checkReadonly = (ref: ReturnType<typeof useView>) => {
        // @ts-expect-error display refs do not expose a setter
        ref.data.value = 'changed';
      };
      void checkReadonly;
      let renders = 0;
      function View() {
        const ref = useView();
        renders += 1;
        return <span>{`${ref.queryKey.value?.[1]}:${ref.data.value}`}</span>;
      }
      const screen = render(<View />);
      expect(screen.container.textContent).toBe('1:undefined');
      act(() => {
        input.updateRef.enabled.value = true;
      });
      expect(screen.container.textContent).toBe('1:waiting');

      act(() => {
        input.updateRef.id.value = 2;
      });
      expect(oldSignal.aborted).toBe(true);
      expect(screen.container.textContent).toBe('2:waiting');
      await act(async () => {
        oldRead.resolve({ name: 'old' });
        await Promise.resolve();
      });
      expect(screen.container.textContent).toBe('2:waiting');
      await act(async () => {
        newRead.resolve({ name: 'new' });
        await live.query!.load();
      });
      expect(screen.container.textContent).toBe('2:new');
      act(() => {
        live.query!.ref.name.value = 'edited';
      });
      expect(screen.container.textContent).toBe('2:edited');

      screen.unmount();
      const afterUnmount = renders;
      act(() => {
        input.updateRef.id.value = 3;
      });
      await live.query!.load();
      expect(renders).toBe(afterUnmount);
      live.dispose();
    });
  });
}
