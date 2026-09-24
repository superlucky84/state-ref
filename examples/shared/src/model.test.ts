import { describe, expect, it } from 'vitest';
import {
  CITY,
  OPERATION_IDS,
  QUERY_RETRY,
  READING_QUERIES,
  createDemoModel,
  resourcePanel,
} from './index';
import type { DemoModel } from './index';

/**
 * The demo model's own suite.
 *
 * Five demos render this one model, so a wrong operation here would show up
 * as five screens that agree with each other and are all wrong - the same
 * reason the fixture has its own tests (DC8-5-01).
 */

function readUi(model: DemoModel) {
  return model.watchUi().value;
}

async function loaded() {
  const model = createDemoModel();
  model.run('load');
  model.run('settle-all');
  // `load()` resolves on a microtask after the request settles.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return model;
}

describe('operation catalogue', () => {
  it('lists every operation exactly once', () => {
    expect(new Set(OPERATION_IDS).size).toBe(OPERATION_IDS.length);
    expect(OPERATION_IDS).toContain('branch-drafts');
  });

  it('answers every operation id before the first load', () => {
    const model = createDemoModel();
    // `query.watch` and `query.ref` both throw until the query has loaded -
    // touching the handle at all is enough. Every operation that would reach
    // them has to say so instead (M2-04).
    for (const id of OPERATION_IDS) {
      expect(() => model.run(id), id).not.toThrow();
    }
    expect(readUi(model).lastResult).not.toBe('');
    model.dispose();
  });

  it('answers every operation id without throwing', async () => {
    const model = await loaded();
    for (const id of OPERATION_IDS) {
      expect(() => model.run(id)).not.toThrow();
    }
    model.dispose();
  });
});

describe('retry budget', () => {
  it('absorbs a single queued failure instead of showing an error', async () => {
    const model = createDemoModel();
    model.run('next-read-error');
    model.run('load');
    model.run('settle-read');
    await Promise.resolve();
    await Promise.resolve();

    // The READ failed on the server, but the query retried it rather than
    // publishing an error - the reason M2-04 could not be performed before
    // DC8-5-30.
    expect(model.server.requests().some(row => row.outcome === 'error')).toBe(
      true
    );
    expect(model.panelA.status.status.value).not.toBe('error');
    model.dispose();
  });

  it('reaches an error status once the retry budget is exhausted', async () => {
    const model = createDemoModel();
    model.run('next-read-error-exhausted');
    model.run('load');

    // `retryDelay` is 0, so each retry is queued on a macrotask; settle the
    // whole chain by draining it until the query gives up (DC8-5-29).
    for (
      let attempt = 0;
      attempt <= (QUERY_RETRY + 1) * READING_QUERIES;
      attempt += 1
    ) {
      model.run('settle-all');
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    expect(model.panelA.status.status.value).toBe('error');
    expect(model.panelA.status.loaded.value).toBe(false);
    model.dispose();
  });

  it('recovers explicitly after the failed first load', async () => {
    const model = createDemoModel();
    model.run('next-read-error-exhausted');
    model.run('load');
    for (
      let attempt = 0;
      attempt <= (QUERY_RETRY + 1) * READING_QUERIES;
      attempt += 1
    ) {
      model.run('settle-all');
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    expect(model.panelA.status.status.value).toBe('error');

    model.run('refetch');
    model.run('settle-all');
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(model.panelA.status.status.value).toBe('success');
    expect(model.panelA.ref.city.value).toBe(CITY.server);
    model.dispose();
  });
});

describe('representative flow', () => {
  it('branches a clean draft off an already edited source', async () => {
    const model = await loaded();

    model.run('edit-busan');
    expect(model.panelA.ref.city.value).toBe(CITY.resource);
    expect(model.panelA.isDirty()).toBe(true);

    model.run('branch-drafts');
    const draft = model.drafts().a;
    expect(draft).not.toBeNull();
    // M2-12: the source's own change log is not inherited.
    expect(draft!.isDirty()).toBe(false);
    expect(draft!.ref.city.value).toBe(CITY.resource);

    model.run('draft-a-daejeon');
    expect(draft!.ref.city.value).toBe(CITY.draft);
    // The draft input has not reached the source.
    expect(model.panelA.ref.city.value).toBe(CITY.resource);

    model.run('draft-a-apply');
    expect(model.panelA.ref.city.value).toBe(CITY.draft);
    // A local apply is not a server WRITE (Phase 8.3).
    expect(model.server.counts().write).toBe(0);
    expect(model.panelA.status.pending.value).toBe(0);

    model.dispose();
  });

  it('turns an overlapping source change into a draft conflict', async () => {
    const model = await loaded();

    model.run('branch-drafts');
    model.run('draft-a-daejeon');
    model.run('edit-gwangju');

    const draft = model.drafts().a!;
    expect(draft.changes()[0].conflict).toBe(true);
    model.run('draft-a-apply');
    expect(readUi(model).lastResult).toContain('conflict');
    // The overlapping source value stands until the conflict is resolved.
    expect(model.panelA.ref.city.value).toBe(CITY.overlap);

    model.run('draft-a-resolve-draft');
    model.run('draft-a-apply');
    expect(model.panelA.ref.city.value).toBe(CITY.draft);

    model.dispose();
  });

  it('shares one baseline between two handles on the same key', async () => {
    const model = await loaded();

    model.run('edit-busan');
    // panelB is a second handle on the same key: it sees the same edit and no
    // WRITE happened.
    expect(model.panelB.ref.city.value).toBe(CITY.resource);
    expect(model.server.counts().write).toBe(0);

    const entry = model.client
      .inspectCache()
      .find(row => row.queryKey.length === 1);
    expect(entry?.owners).toBe(2);

    model.dispose();
  });
});

describe('server outcomes on screen', () => {
  it('keeps an unknown WRITE pending and never resends it', async () => {
    const model = await loaded();

    model.run('edit-busan');
    model.run('capture');
    model.run('next-write-unknown');
    model.run('save');

    expect(model.server.counts().write).toBe(1);
    model.run('settle-write');
    model.run('settle-all');
    await Promise.resolve();

    // Still one WRITE: nothing resends an unknown operation.
    expect(model.server.counts().write).toBe(1);
    expect(readUi(model).mutationPhase).toBe('pending');
    expect(model.panelA.status.pending.value).toBe(1);

    model.dispose();
  });

  it('separates a local apply from a server WRITE in the panel', async () => {
    const model = await loaded();

    model.run('branch-drafts');
    model.run('draft-a-daejeon');
    model.run('draft-a-apply');

    const panel = resourcePanel(
      model.panelA.status.value,
      model.panelA.changes()
    );
    // `dirty` is true for a purely local apply; only `serverBusy` marks a
    // WRITE (Phase 8.3).
    expect(panel.dirty).toBe(true);
    expect(panel.serverBusy).toBe(false);
    expect(model.server.counts().write).toBe(0);

    model.dispose();
  });
});

describe('callback-less computed panel', () => {
  it('reuses the result object and reads current inputs before sync()', async () => {
    const model = createDemoModel();

    model.run('computed-read');
    const first = readUi(model);
    expect(first.computedValue).toBe('doubled=2');
    const calculations = first.computedCalculations;

    // An unrelated change must not recalculate, and the object identity holds.
    model.run('computed-bump-unrelated');
    model.run('computed-read');
    const second = readUi(model);
    expect(second.computedCalculations).toBe(calculations);
    expect(second.computedIdentityStable).toBe(true);

    // A dependency change is visible on the next read, before any sync().
    model.run('computed-bump-dep');
    model.run('computed-read');
    const third = readUi(model);
    expect(third.computedValue).toBe('doubled=4');
    expect(third.computedCalculations).toBe(calculations + 1);
    expect(third.computedIdentityStable).toBe(false);

    // The subscribed computed keeps its own timing: it waits for sync().
    expect(third.computedSubscribed).toBe('doubled=2');
    model.run('computed-sync');
    expect(readUi(model).computedSubscribed).toBe('doubled=4');

    model.dispose();
  });
});
