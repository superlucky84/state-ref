/**
 * Phase 8.1 for Preact: a server resource and a draft branched off it, driven
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
import { render, cleanup, fireEvent, act } from '@testing-library/preact';
import { h } from 'preact';
import type { StateRefStore, Watch } from 'state-ref';
import { createSyncClient } from '@stateref/sync';
import type { MutationStatus, QueryStatus } from '@stateref/sync';
import { createDraft } from 'state-ref/draft';
import { connectPreact } from '@/index';

type Address = { city: string; zip: string };

if (import.meta.vitest) {
  const { describe, it, expect, afterEach, vi } = import.meta.vitest;
  afterEach(cleanup);

  function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(accept => {
      resolve = accept;
    });
    return { promise, resolve };
  }

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

  describe('Preact resource and draft in one component', () => {
    it('branches a clean draft off a dirty source and keeps the two inputs apart', async () => {
      const { query } = await load();
      query.ref.city.value = '부산'; // The source is already edited.
      const draft = createDraft(query.ref);
      expect(draft.isDirty()).toBe(false); // A dirty source still branches clean.

      const useSource = connectPreact(query.watch);
      const useBranch = connectPreact(draft.watch);
      const useStatus = connectPreact(draft.watchStatus);
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
      const useSource = connectPreact(query.watch);
      const useBranch = connectPreact(draft.watch);
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
      const useSource = connectPreact(
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

    it('hands back the store itself, so a held ref is not a mirror to release', async () => {
      const { query } = await load();
      const useSource = connectPreact(query.watch);
      let held!: ReturnType<typeof useSource>;
      function Panel() {
        const source = useSource();
        held = source;
        return <span data-testid="city">{source.city.value}</span>;
      }
      render(<Panel />);
      cleanup();

      // Unlike Vue, Svelte and Solid, this connector builds no framework-owned
      // mirror: the hook returns the resource ref. A reference kept past
      // unmount therefore still writes, exactly as any other reference to the
      // same resource would - there is no subscription here to leak, and
      // nothing for the connector to release.
      act(() => {
        held.city.value = '부산';
      });
      expect(query.ref.city.value).toBe('부산');
      query.dispose();
    });

    it('refuses a write from a component that outlived its query', async () => {
      const { query } = await load();
      const useSource = connectPreact(query.watch);
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

      // The refusal is real, but no framework hands it back at the call site.
      // So the contract cannot be "the app catches it" - it is "do not dispose
      // a query while a component still writes to it".
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

  describe('Preact two consumers and two drafts', () => {
    it('counts owners by handle and keeps two drafts apart', async () => {
      const { client, query } = await load();
      const second = client.query<Address>({
        queryKey: ['address'],
        queryFn: () => ({ city: '서울', zip: '01' }),
      });
      // Owners follow handles, not components: a second handle on the same key
      // makes two, and a component mounting or leaving changes neither.
      expect(client.inspectCache()[0]!.owners).toBe(2);

      const left = createDraft(query.ref);
      const right = createDraft(query.ref);
      const useSource = connectPreact(query.watch);
      const useShared = connectPreact(second.watch);
      const useLeft = connectPreact(left.watch);
      const useRight = connectPreact(right.watch);
      const useRightStatus = connectPreact(right.watchStatus);

      function Panel() {
        const source = useSource();
        const shared = useShared();
        const a = useLeft();
        const b = useRight();
        const status = useRightStatus();
        return (
          <div>
            <span data-testid="source">{source.city.value}</span>
            <span data-testid="shared">{shared.city.value}</span>
            <span data-testid="left">{a.city.value}</span>
            <span data-testid="right">{b.city.value}</span>
            <span data-testid="right-conflicts">{status.conflicts.value}</span>
            <button
              data-testid="edit-left"
              onClick={() => (a.city.value = '대전')}
            />
            <button
              data-testid="edit-right"
              onClick={() => (b.city.value = '광주')}
            />
          </div>
        );
      }
      const screen = render(<Panel />);

      // Two handles on one key share the baseline and the edits.
      act(() => {
        query.ref.city.value = '부산';
      });
      expect(screen.getByTestId('shared').textContent).toBe('부산');
      expect(client.inspectCache()[0]!.status.dirty).toBe(true);

      // Each draft branched before that edit, so each holds its own value.
      fireEvent.click(screen.getByTestId('edit-left'));
      fireEvent.click(screen.getByTestId('edit-right'));
      expect(screen.getByTestId('left').textContent).toBe('대전');
      expect(screen.getByTestId('right').textContent).toBe('광주');
      expect(screen.getByTestId('source').textContent).toBe('부산');

      // Applying one reaches the other as a source update on the same path,
      // which is exactly what a conflict is.
      act(() => {
        expect(left.apply()).toEqual({ ok: true, applied: 1 });
      });
      expect(screen.getByTestId('source').textContent).toBe('대전');
      expect(screen.getByTestId('shared').textContent).toBe('대전');
      expect(screen.getByTestId('right-conflicts').textContent).toBe('1');
      expect(right.apply()).toEqual({ ok: false, reason: 'conflict' });

      cleanup();
      expect(client.inspectCache()[0]!.owners).toBe(2); // unmount owns nothing
      second.dispose();
      expect(client.inspectCache()[0]!.owners).toBe(1);
      left.discard();
      right.discard();
      query.dispose();
    });
  });

  describe('Preact tells a local apply from a server WRITE', () => {
    function makePanel(
      query: { watch: Watch<Address>; watchStatus: Watch<QueryStatus> },
      mutation: { watchStatus: Watch<MutationStatus> }
    ) {
      const useSource = connectPreact(query.watch);
      const useStatus = connectPreact(query.watchStatus);
      const usePhase = connectPreact(mutation.watchStatus);
      return function Panel() {
        const source = useSource();
        const status = useStatus();
        const phase = usePhase();
        return (
          <div>
            <span data-testid="city">{source.city.value}</span>
            <span data-testid="zip">{source.zip.value}</span>
            <span data-testid="dirty">{String(status.dirty.value)}</span>
            <span data-testid="pending">{status.pending.value}</span>
            <span data-testid="unconfirmed">
              {String(status.unconfirmed.value)}
            </span>
            <span data-testid="phase">{phase.phase.value}</span>
          </div>
        );
      };
    }

    it('shows a local apply with no sign of a server call', async () => {
      const { client, query } = await load();
      const write = vi.fn(() => ({ ok: true }));
      const mutation = client.mutation({ mutationFn: write });
      const Panel = makePanel(query, mutation);
      const screen = render(<Panel />);

      const draft = createDraft(query.ref);
      draft.ref.city.value = '부산';
      act(() => {
        expect(draft.apply()).toEqual({ ok: true, applied: 1 });
      });

      // A local apply is not a save. `dirty` moves; the two marks a server call
      // leaves - the linked count and the mutation phase - do not. A screen
      // that reads "saving" off `dirty` would be lying here.
      expect(screen.getByTestId('city').textContent).toBe('부산');
      expect(screen.getByTestId('dirty').textContent).toBe('true');
      expect(screen.getByTestId('pending').textContent).toBe('0');
      expect(screen.getByTestId('phase').textContent).toBe('idle');
      expect(write).not.toHaveBeenCalled();
      draft.discard();
      mutation.dispose();
      query.dispose();
    });

    it('marks a WRITE in flight and takes an input unlike the query shape', async () => {
      const { client, query } = await load();
      const gate = deferred<{ accepted: boolean }>();
      const write = vi.fn((_input: { full: string }) => gate.promise);
      const mutation = client.mutation({ mutationFn: write });
      const Panel = makePanel(query, mutation);
      const screen = render(<Panel />);

      act(() => {
        query.ref.city.value = '부산';
      });
      const submission = query.capture();
      let settled!: Promise<{ kind: string }>;
      act(() => {
        settled = mutation.start(
          { full: '부산 01' },
          { links: [{ query, submission, accept: { kind: 'submitted' } }] }
        ).result as Promise<{ kind: string }>;
      });
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByTestId('pending').textContent).toBe('1');
      expect(screen.getByTestId('phase').textContent).toBe('pending');
      // The DTO is the caller's, not the query's shape.
      expect(write.mock.calls[0]![0]).toEqual({ full: '부산 01' });

      gate.resolve({ accepted: true });
      await act(async () => {
        expect((await settled).kind).toBe('success');
      });
      expect(screen.getByTestId('pending').textContent).toBe('0');
      expect(screen.getByTestId('phase').textContent).toBe('success');
      expect(screen.getByTestId('dirty').textContent).toBe('false');
      mutation.dispose();
      query.dispose();
    });

    it('keeps input typed while the WRITE was in flight', async () => {
      const { client, query } = await load();
      const gate = deferred<{ accepted: boolean }>();
      const mutation = client.mutation({ mutationFn: () => gate.promise });
      const Panel = makePanel(query, mutation);
      const screen = render(<Panel />);

      act(() => {
        query.ref.city.value = '부산';
      });
      const submission = query.capture();
      let settled!: Promise<{ kind: string }>;
      act(() => {
        settled = mutation.start(
          { full: '부산 01' },
          { links: [{ query, submission, accept: { kind: 'submitted' } }] }
        ).result as Promise<{ kind: string }>;
      });
      act(() => {
        query.ref.city.value = '대전'; // same path, after the capture
        query.ref.zip.value = '02'; // a path the submission never covered
      });

      gate.resolve({ accepted: true });
      await act(async () => {
        expect((await settled).kind).toBe('success');
      });
      // Acceptance consumes the captured revision only, so everything typed
      // after it survives and the query stays dirty.
      expect(screen.getByTestId('city').textContent).toBe('대전');
      expect(screen.getByTestId('zip').textContent).toBe('02');
      expect(screen.getByTestId('dirty').textContent).toBe('true');
      mutation.dispose();
      query.dispose();
    });

    it('shows an unknown result as unconfirmed and never resends it', async () => {
      const { client, query } = await load();
      const write = vi.fn((_input: { full: string }) =>
        Promise.reject(new Error('connection lost'))
      );
      const mutation = client.mutation({ mutationFn: write });
      const Panel = makePanel(query, mutation);
      const screen = render(<Panel />);

      act(() => {
        query.ref.city.value = '부산';
      });
      await act(async () => {
        const result = await mutation.run(
          { full: '부산 01' },
          { links: [{ query, submission: query.capture() }] }
        );
        expect(result.kind).toBe('unknown');
      });

      // Unknown is neither success nor a settled failure: the WRITE may have
      // reached the server, so the input stays and the baseline is marked
      // unconfirmed until something confirms it.
      expect(screen.getByTestId('unconfirmed').textContent).toBe('true');
      expect(screen.getByTestId('dirty').textContent).toBe('true');
      expect(screen.getByTestId('city').textContent).toBe('부산');
      expect(screen.getByTestId('phase').textContent).toBe('unknown');
      expect(write).toHaveBeenCalledTimes(1); // no automatic resend
      mutation.dispose();
      query.dispose();
    });

    it('shows a failed baseline recovery as unconfirmed rather than as success', async () => {
      const client = createSyncClient({ ssr: true });
      const query = client.query<Address>({
        queryKey: ['sync-error'],
        queryFn: vi
          .fn()
          .mockResolvedValueOnce({ city: '서울', zip: '01' })
          .mockRejectedValueOnce(new Error('read failed')),
        retry: 0,
      });
      await query.load();
      const mutation = client.mutation({ mutationFn: () => ({ ok: true }) });
      const Panel = makePanel(query, mutation);
      const screen = render(<Panel />);

      await act(async () => {
        const result = await mutation.run(
          { full: '부산 01' },
          { links: [{ query, accept: { kind: 'refetch' } }] }
        );
        expect(result.kind).toBe('sync-error');
      });

      // The WRITE succeeded but the baseline could not be refetched. Showing
      // this as success would invite a second submit against a baseline the
      // client no longer has.
      expect(screen.getByTestId('unconfirmed').textContent).toBe('true');
      expect(screen.getByTestId('dirty').textContent).toBe('false');
      expect(screen.getByTestId('phase').textContent).toBe('sync-error');
      mutation.dispose();
      query.dispose();
    });
  });
}
