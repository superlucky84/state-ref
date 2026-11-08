import { act, cleanup, render, waitFor } from '@testing-library/react';
import { startTransition, StrictMode, Suspense } from 'react';
import { createSyncClient, keepPreviousData } from '@stateref/sync';
import { useSyncQuery } from '@/sync';

type Page = { name: string };
function deferred<T>() {
  let resolve!: (data: T) => void;
  const promise = new Promise<T>(yes => {
    resolve = yes;
  });
  return { promise, resolve };
}

if (import.meta.vitest) {
  const { describe, it, expect, afterEach, vi } = import.meta.vitest;
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('react keepPreviousData', () => {
    it('keeps every transition frame populated in StrictMode and replaces the old page on success', async () => {
      const client = createSyncClient();
      const reads = [deferred<Page>(), deferred<Page>()];
      const frames: string[] = [];
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      function Panel({ page }: { page: number }) {
        const [query] = useSyncQuery(client, {
          queryKey: ['pages', page],
          queryFn: () => reads[page - 1].promise,
          staleTime: Infinity,
          gcTime: Infinity,
          placeholderData: keepPreviousData,
        });
        const text = `${page}:${query.data.name.value ?? 'loading'}:${
          query.isPlaceholder.value
        }:${query.status.value}:${query.loaded.value}`;
        frames.push(text);
        return <p>{text}</p>;
      }
      const screen = render(
        <StrictMode>
          <Panel page={1} />
        </StrictMode>
      );
      expect(screen.container.textContent).toBe(
        '1:loading:false:pending:false'
      );
      await act(async () => {
        reads[0].resolve({ name: 'one' });
      });
      screen.rerender(
        <StrictMode>
          <Panel page={2} />
        </StrictMode>
      );
      expect(screen.container.textContent).toBe('2:one:true:pending:false');
      expect(
        frames
          .filter(frame => frame.startsWith('2:'))
          .every(frame => frame === '2:one:true:pending:false')
      ).toBe(true);
      await act(async () => {
        reads[1].resolve({ name: 'two' });
      });
      expect(screen.container.textContent).toBe('2:two:false:success:true');
      expect(errors).not.toHaveBeenCalled();
    });

    it('does not promote a cached page from a suspended, abandoned render into history', async () => {
      const client = createSyncClient();
      const options = (id: number) => ({
        queryKey: ['pages', id],
        queryFn: () => ({ name: `page ${id}` }),
        staleTime: Infinity,
        gcTime: Infinity,
      });
      await client.prefetch(options(1));
      await client.prefetch(options(2));
      const suspended = new Promise(() => {});
      const next = deferred<Page>();
      const rendered: number[] = [];
      function Panel({
        id,
        suspend = false,
      }: {
        id: number;
        suspend?: boolean;
      }) {
        const [query] = useSyncQuery(client, {
          ...options(id),
          queryFn: () => (id === 3 ? next.promise : { name: `page ${id}` }),
          placeholderData: keepPreviousData,
        });
        const text = `${id}:${query.data.name.value}:${query.isPlaceholder.value}`;
        rendered.push(id);
        if (suspend) throw suspended;
        return <p>{text}</p>;
      }
      const screen = render(
        <Suspense fallback="fallback">
          <Panel id={1} />
        </Suspense>
      );
      act(() => {
        startTransition(() => {
          screen.rerender(
            <Suspense fallback="fallback">
              <Panel id={2} suspend />
            </Suspense>
          );
        });
      });
      await waitFor(() => expect(rendered).toContain(2));
      screen.rerender(
        <Suspense fallback="fallback">
          <Panel id={3} />
        </Suspense>
      );
      expect(screen.container.textContent).toBe('3:page 1:true');
      await act(async () => {
        next.resolve({ name: 'page 3' });
      });
      expect(screen.container.textContent).toBe('3:page 3:false');
    });
  });
}
