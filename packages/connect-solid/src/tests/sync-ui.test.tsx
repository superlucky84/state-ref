/**
 * Phase 8.1 for Solid: a server resource and a draft branched off it, driven
 * through the editable connector in one real component.
 *
 * This is the server-sync plan's Phase 8 (docs/server-sync/PHASE8_1.md), not
 * the core plan's Phase 8 that `integration.test.ts` belongs to.
 */
import { render, cleanup, fireEvent } from '@solidjs/testing-library';
import type { Watch } from 'state-ref';
import { createSyncClient } from '@stateref/sync';
import { createDraft } from 'state-ref/draft';
import type { DraftStatus } from 'state-ref/draft';
import { connectSolid } from '@/index';

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

  const Panel = (props: {
    sourceWatch: Watch<Address>;
    branchWatch: Watch<Address>;
    statusWatch: Watch<DraftStatus>;
    onSelect?: () => void;
  }) => {
    const [source, setSource] = connectSolid(props.sourceWatch)(store => {
      props.onSelect?.();
      return store.city;
    });
    const [branch, setBranch] = connectSolid(props.branchWatch)(
      store => store.city
    );
    const [conflicts] = connectSolid(props.statusWatch)(
      store => store.conflicts
    );
    return (
      <div>
        <span data-testid="source">{source()}</span>
        <span data-testid="branch">{branch()}</span>
        <span data-testid="conflicts">{conflicts()}</span>
        <button data-testid="edit-branch" onClick={() => setBranch('대전')} />
        <button data-testid="edit-source" onClick={() => setSource('광주')} />
      </div>
    );
  };

  describe('Solid resource and draft in one component', () => {
    it('branches a clean draft off a dirty source and keeps the two inputs apart', async () => {
      const { query } = await load();
      query.ref.city.value = '부산';
      const draft = createDraft(query.ref);
      expect(draft.isDirty()).toBe(false); // A dirty source still branches clean.

      const screen = render(() => (
        <Panel
          sourceWatch={query.watch}
          branchWatch={draft.watch}
          statusWatch={draft.watchStatus}
        />
      ));
      expect(screen.getByTestId('source').textContent).toBe('부산');
      expect(screen.getByTestId('branch').textContent).toBe('부산');

      fireEvent.click(screen.getByTestId('edit-branch'));
      expect(screen.getByTestId('branch').textContent).toBe('대전');
      expect(screen.getByTestId('source').textContent).toBe('부산');
      expect(screen.getByTestId('conflicts').textContent).toBe('0');
      expect(query.ref.city.value).toBe('부산'); // No write reached the source.

      fireEvent.click(screen.getByTestId('edit-source'));
      expect(screen.getByTestId('source').textContent).toBe('광주');
      expect(screen.getByTestId('branch').textContent).toBe('대전');
      expect(screen.getByTestId('conflicts').textContent).toBe('1');
      expect(draft.apply()).toEqual({ ok: false, reason: 'conflict' });

      draft.discard();
      expect(screen.getByTestId('source').textContent).toBe('광주');
      expect(query.ref.city.value).toBe('광주');
      query.dispose();
    });

    it('applies the branch as one root change and shows it', async () => {
      const { query } = await load();
      const draft = createDraft(query.ref);
      const screen = render(() => (
        <Panel
          sourceWatch={query.watch}
          branchWatch={draft.watch}
          statusWatch={draft.watchStatus}
        />
      ));
      fireEvent.click(screen.getByTestId('edit-branch'));
      expect(draft.apply()).toEqual({ ok: true, applied: 1 });

      expect(screen.getByTestId('source').textContent).toBe('대전');
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

    it('stops selecting on disposal without disposing the query', async () => {
      const { client, query } = await load();
      const draft = createDraft(query.ref);
      let selections = 0;
      render(() => (
        <Panel
          sourceWatch={query.watch}
          branchWatch={draft.watch}
          statusWatch={draft.watchStatus}
          onSelect={() => (selections += 1)}
        />
      ));
      query.ref.city.value = '부산';
      const mounted = selections;
      expect(mounted).toBeGreaterThan(0);

      cleanup();
      query.ref.city.value = '대전';
      expect(selections).toBe(mounted);
      // Disposing a consumer never takes the query with it: the owner does.
      expect(client.size()).toBe(1);
      expect(query.ref.city.value).toBe('대전');
      draft.discard();
      query.dispose();
    });

    it('releases its write-back on disposal', async () => {
      const { query } = await load();
      let setCity!: (value: string) => void;
      const Release = (props: { sourceWatch: Watch<Address> }) => {
        const [city, set] = connectSolid(props.sourceWatch)(
          store => store.city
        );
        setCity = set as (value: string) => void;
        return <span data-testid="city">{city()}</span>;
      };
      render(() => <Release sourceWatch={query.watch} />);

      setCity('부산'); // While mounted the mirror writes through, as it must.
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(query.ref.city.value).toBe('부산');

      cleanup();
      setCity('대전');
      await new Promise(resolve => setTimeout(resolve, 0));
      // The effect belongs to the component's reactive root, so disposal stops
      // it. The same contract is what `connectSvelte` had to be fixed to meet.
      expect(query.ref.city.value).toBe('부산');
      query.dispose();
    });

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
      const TwoDrafts = () => {
        const [source] = connectSolid(query.watch)(store => store.city);
        const [shared] = connectSolid(second.watch)(store => store.city);
        const [leftCity, setLeft] = connectSolid(left.watch)(
          store => store.city
        );
        const [rightCity, setRight] = connectSolid(right.watch)(
          store => store.city
        );
        const [conflicts] = connectSolid(right.watchStatus)(
          store => store.conflicts
        );
        return (
          <div>
            <span data-testid="source">{source()}</span>
            <span data-testid="shared">{shared()}</span>
            <span data-testid="left">{leftCity()}</span>
            <span data-testid="right">{rightCity()}</span>
            <span data-testid="right-conflicts">{conflicts()}</span>
            <button data-testid="edit-left" onClick={() => setLeft('대전')} />
            <button data-testid="edit-right" onClick={() => setRight('광주')} />
          </div>
        );
      };
      const screen = render(() => <TwoDrafts />);

      // Two handles on one key share the baseline and the edits.
      query.ref.city.value = '부산';
      expect(screen.getByTestId('shared').textContent).toBe('부산');
      expect(client.inspectCache()[0]!.status.dirty).toBe(true);

      // Each draft branched before that edit, so each holds its own value.
      fireEvent.click(screen.getByTestId('edit-left'));
      fireEvent.click(screen.getByTestId('edit-right'));
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(screen.getByTestId('left').textContent).toBe('대전');
      expect(screen.getByTestId('right').textContent).toBe('광주');
      expect(screen.getByTestId('source').textContent).toBe('부산');

      // Applying one reaches the other as a source update on the same path,
      // which is exactly what a conflict is.
      expect(left.apply()).toEqual({ ok: true, applied: 1 });
      expect(screen.getByTestId('source').textContent).toBe('대전');
      expect(screen.getByTestId('shared').textContent).toBe('대전');
      expect(screen.getByTestId('right-conflicts').textContent).toBe('1');
      expect(right.apply()).toEqual({ ok: false, reason: 'conflict' });

      cleanup();
      expect(client.inspectCache()[0]!.owners).toBe(2); // disposal owns nothing
      second.dispose();
      expect(client.inspectCache()[0]!.owners).toBe(1);
      left.discard();
      right.discard();
      query.dispose();
    });

    it('refuses a write from a component that outlived its query', async () => {
      const { query } = await load();
      const draft = createDraft(query.ref);
      const screen = render(() => (
        <Panel
          sourceWatch={query.watch}
          branchWatch={draft.watch}
          statusWatch={draft.watchStatus}
        />
      ));
      query.dispose();

      // Solid writes back from its own effect, so the refusal is raised there
      // rather than handed to the caller. The contract cannot be "the caller
      // catches it" - it is "do not dispose a query while a component still
      // writes to it".
      const uncaught: string[] = [];
      const record = (event: ErrorEvent) => {
        uncaught.push(event.error?.message ?? event.message);
        event.preventDefault();
      };
      window.addEventListener('error', record);
      let direct = '';
      try {
        fireEvent.click(screen.getByTestId('edit-source'));
      } catch (error) {
        direct = (error as Error).message;
      }
      window.removeEventListener('error', record);

      expect([...uncaught, direct]).toContain(
        'This query handle has been disposed.'
      );
      draft.discard();
    });
  });
}
