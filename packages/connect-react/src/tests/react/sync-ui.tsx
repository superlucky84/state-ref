/**
 * Phase 8.1 for React: a server resource and a draft branched off it, driven
 * through the editable connector in one real component.
 *
 * This is the server-sync plan's Phase 8 (docs/server-sync/PHASE8_1.md), not
 * the core plan's Phase 8 that `integration.tsx` belongs to.
 *
 * The connector never imports sync. What makes this work is that
 * `query.watch` and `draft.watch` are both plain `Watch<T>`, so the editable
 * connector that has always driven a core store drives these too - which is
 * the question DC8-06 asked.
 */
import { render, cleanup, fireEvent, act } from '@testing-library/react';
import type { StateRefStore, Watch } from 'state-ref';
import { createSyncClient } from '@stateref/sync';
import { createDraft } from 'state-ref/draft';
import { connectReact } from '@/index';

type Address = { city: string; zip: string };

if (import.meta.vitest) {
  const { describe, it, expect, afterEach } = import.meta.vitest;
  afterEach(cleanup);

  const load = async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query<Address>({
      queryKey: ['address'],
      queryFn: () => ({ city: '서울', zip: '01' }),
    });
    await query.load();
    return { client, query };
  };

  /**
   * Wraps a watch so the test can count how often the core actually invokes
   * the connector's renew - the same technique `unmount-leak.tsx` uses for
   * IC-01, and the only thing here that is ours to guarantee.
   */
  const countingWatch = <T,>(source: Watch<T>, onRenew: () => void): Watch<T> =>
    ((renew: any, opt: any) =>
      (source as any)((store: StateRefStore<T>, isFirst: boolean) => {
        onRenew();
        return renew(store, isFirst);
      }, opt)) as Watch<T>;

  describe('React resource and draft in one component', () => {
    it('branches a clean draft off a dirty source and keeps the two inputs apart', async () => {
      const { query } = await load();
      query.ref.city.value = '부산'; // The source is already edited.
      const draft = createDraft(query.ref);
      expect(draft.isDirty()).toBe(false); // A dirty source still branches clean.

      const useSource = connectReact(query.watch);
      const useBranch = connectReact(draft.watch);
      const useStatus = connectReact(draft.watchStatus);
      function Panel() {
        const source = useSource();
        const branch = useBranch();
        const status = useStatus();
        return (
          <div>
            <span data-testid="source">{source.city.value}</span>
            <span data-testid="branch">{branch.city.value}</span>
            <span data-testid="conflicts">{status.conflicts.value}</span>
            <button
              data-testid="edit-branch"
              onClick={() => (branch.city.value = '대전')}
            />
            <button
              data-testid="edit-source"
              onClick={() => (source.city.value = '광주')}
            />
          </div>
        );
      }
      const screen = render(<Panel />);
      expect(screen.getByTestId('source').textContent).toBe('부산');
      expect(screen.getByTestId('branch').textContent).toBe('부산');

      fireEvent.click(screen.getByTestId('edit-branch'));
      expect(screen.getByTestId('branch').textContent).toBe('대전');
      expect(screen.getByTestId('source').textContent).toBe('부산');
      expect(screen.getByTestId('conflicts').textContent).toBe('0');
      expect(query.ref.city.value).toBe('부산'); // No write reached the source.

      // An overlapping source edit is a conflict, and the branch holds its own
      // value rather than following.
      fireEvent.click(screen.getByTestId('edit-source'));
      expect(screen.getByTestId('source').textContent).toBe('광주');
      expect(screen.getByTestId('branch').textContent).toBe('대전');
      expect(screen.getByTestId('conflicts').textContent).toBe('1');
      expect(draft.apply()).toEqual({ ok: false, reason: 'conflict' });

      // Discarding before an apply leaves the source exactly as it was.
      draft.discard();
      expect(screen.getByTestId('source').textContent).toBe('광주');
      expect(query.ref.city.value).toBe('광주');
      query.dispose();
    });

    it('applies the branch as one root change and shows it', async () => {
      const { query } = await load();
      const draft = createDraft(query.ref);
      const useSource = connectReact(query.watch);
      const useBranch = connectReact(draft.watch);
      function Panel() {
        const source = useSource();
        const branch = useBranch();
        return (
          <div>
            <span data-testid="source">{source.city.value}</span>
            <span data-testid="zip">{source.zip.value}</span>
            <button
              data-testid="edit-branch"
              onClick={() => (branch.city.value = '대전')}
            />
          </div>
        );
      }
      const screen = render(<Panel />);
      fireEvent.click(screen.getByTestId('edit-branch'));
      let applied!: ReturnType<typeof draft.apply>;
      act(() => {
        applied = draft.apply();
      });
      expect(applied).toEqual({ ok: true, applied: 1 });

      expect(screen.getByTestId('source').textContent).toBe('대전');
      expect(screen.getByTestId('zip').textContent).toBe('01');
      // An apply is one atomic root write, so the per-path record is gone and a
      // per-path submission has to be captured before applying (Phase 6).
      const changes = query.changes();
      expect(changes).toHaveLength(1);
      expect(changes[0]!.path).toEqual([]);
      expect(draft.isDirty()).toBe(false);
      expect(query.isDirty()).toBe(true);
      draft.discard();
      query.dispose();
    });

    it('releases its subscription on unmount without disposing the query', async () => {
      const { client, query } = await load();
      let renews = 0;
      const useSource = connectReact(
        countingWatch(query.watch, () => (renews += 1))
      );
      function Panel() {
        const source = useSource();
        return <span data-testid="source">{source.city.value}</span>;
      }
      const screen = render(<Panel />);
      act(() => {
        query.ref.city.value = '부산';
      });
      expect(screen.getByTestId('source').textContent).toBe('부산');
      expect(renews).toBeGreaterThan(0);

      cleanup();
      renews = 0;
      act(() => {
        query.ref.city.value = '대전';
      });
      // Counting renders would prove nothing: an unmounted component never
      // renders again whatever the connector does, and a setState on one is a
      // silent no-op. What the abort actually buys is that the core stops
      // calling in at all - otherwise the subscription keeps its closure alive.
      expect(renews).toBe(0);
      // Unmounting a consumer never takes the query with it: the owner does.
      expect(client.size()).toBe(1);
      expect(query.ref.city.value).toBe('대전');
      query.dispose();
    });

    it('refuses a write from a component that outlived its query', async () => {
      const { query } = await load();
      const useSource = connectReact(query.watch);
      function Panel() {
        const source = useSource();
        return (
          <button
            data-testid="edit"
            onClick={() => (source.city.value = '부산')}
          />
        );
      }
      const screen = render(<Panel />);
      query.dispose();

      // The refusal is real, but no framework hands it back at the call site:
      // React reports it as an uncaught error from its event dispatch, the way
      // Vue, Svelte and Solid report it from their reactive callbacks. So the
      // contract cannot be "the app catches it" - it is "do not dispose a
      // query while a component still writes to it".
      const uncaught: string[] = [];
      const record = (event: ErrorEvent) => {
        uncaught.push(event.error?.message ?? event.message);
        event.preventDefault();
      };
      window.addEventListener('error', record);
      fireEvent.click(screen.getByTestId('edit'));
      window.removeEventListener('error', record);

      expect(uncaught).toContain('This query handle has been disposed.');
      expect(() => query.ref.city.value).toThrow(
        'This query handle has been disposed.'
      );
    });
  });
}
