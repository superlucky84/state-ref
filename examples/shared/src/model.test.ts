import { describe, expect, it } from 'vitest';
import {
  CITY,
  INITIAL_PROFILE,
  OPERATION_IDS,
  QUERY_RETRY,
  READING_QUERIES,
  createDemoModel,
  operationLabel,
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

describe('selective submission', () => {
  it('captures only the changes the DTO carries', async () => {
    const model = await loaded();

    model.run('edit-busan');
    model.run('edit-memo');
    expect(model.panelA.changes()).toHaveLength(2);

    model.run('capture');

    // `memo` is not in the DTO, so it must not be in the submission either:
    // `submitted` would otherwise move the baseline for a value the server
    // never received (B8-7-03).
    expect(
      model.panelA
        .capture()
        .changes.map(change => change.path.join('.'))
        .sort()
    ).toEqual(['city', 'memo']);
    expect(readUi(model).captured).toBe('version 2, 변경 1건');

    model.dispose();
  });

  it('keeps an unsent edit dirty after the WRITE succeeds', async () => {
    const model = await loaded();

    model.run('edit-busan');
    model.run('edit-memo');
    model.run('capture');
    model.run('save');
    model.run('settle-write');
    // The link accepts the baseline before the result promise resolves, so a
    // macrotask is what makes the settled phase observable.
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(readUi(model).mutationPhase).toBe('success');
    expect(model.server.value().city).toBe(CITY.resource);
    // The server never saw `memo`, so it stays a local difference.
    expect(model.server.value().memo).toBe(INITIAL_PROFILE.memo);
    expect(model.panelA.changes().map(change => change.path.join('.'))).toEqual(
      ['memo']
    );
    expect(model.panelA.isDirty()).toBe(true);

    model.dispose();
  });
});

describe('response mapping', () => {
  it('takes the server correction into the baseline', async () => {
    const model = await loaded();

    model.run('edit-busan');
    model.run('capture');
    model.run('next-write-corrected');
    model.run('save-with-response');
    model.run('settle-write');
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(readUi(model).mutationPhase).toBe('success');
    // The DTO carried zip "01"; the server stores its own five-digit form and
    // the app maps the stored record back, so the correction is the baseline
    // rather than a difference the user has to resolve.
    expect(model.server.value().zip).toBe('00001');
    expect(model.panelA.ref.zip.value).toBe('00001');
    expect(model.panelA.changes()).toHaveLength(0);
    expect(model.panelA.isDirty()).toBe(false);

    model.dispose();
  });

  it('keeps an unsubmitted edit while accepting the response', async () => {
    const model = await loaded();

    model.run('edit-busan');
    model.run('edit-memo');
    model.run('capture');
    model.run('next-write-corrected');
    model.run('save-with-response');
    model.run('settle-write');
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(readUi(model).mutationPhase).toBe('success');
    // `memo` never reached the server, so accepting the response must not
    // swallow it (the same rule as B8-7-03, on the other acceptance kind).
    expect(model.panelA.changes().map(change => change.path.join('.'))).toEqual(
      ['memo']
    );
    expect(model.server.value().memo).toBe(INITIAL_PROFILE.memo);

    model.dispose();
  });

  it('costs one extra READ when the baseline comes from a refetch', async () => {
    const model = await loaded();
    const before = model.server.counts().read;

    model.run('edit-busan');
    model.run('capture');
    model.run('save-with-refetch');
    model.run('settle-write');
    await new Promise(resolve => setTimeout(resolve, 0));

    // This is what separates `refetch` from the other two kinds: the WRITE
    // landing is not the end, a READ follows and has to settle as well.
    expect(model.server.counts().read).toBe(before + 1);
    model.run('settle-read');
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(readUi(model).mutationPhase).toBe('success');
    expect(model.panelA.ref.city.value).toBe(CITY.resource);
    expect(model.panelA.changes()).toHaveLength(0);
    expect(model.panelA.isDirty()).toBe(false);

    model.dispose();
  });

  it('refuses a second linked save instead of throwing', async () => {
    const model = await loaded();

    model.run('edit-busan');
    model.run('capture');
    model.run('save');
    expect(() => model.run('save-with-response')).not.toThrow();
    expect(readUi(model).lastResult).toContain('이미 진행 중');
    expect(model.server.counts().write).toBe(1);

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

/**
 * R2-11 on screen.
 *
 * Both halves of the requirement need a *confirmed* rejection, and the demo
 * could not produce one: the mock rejected with a plain Error and sync
 * classifies anything that is not a `MutationRejectedError` as `unknown`,
 * because a transport failure cannot say whether the server stored the write
 * (B8-7-05). These tests fail on the old fixture.
 */
describe('failure recovery (M2-09)', () => {
  const settled = () => new Promise(resolve => setTimeout(resolve, 0));

  async function rejectedSave(saveId: 'save' | 'save-reject-remove') {
    const model = await loaded();
    model.run('edit-busan');
    model.run('edit-memo');
    model.run('capture');
    model.run('next-write-rejected');
    model.run(saveId);
    model.run('settle-all');
    await settled();
    return model;
  }

  it('reports a queued rejection as rejected, not unknown', async () => {
    const model = await rejectedSave('save');

    expect(readUi(model).mutationPhase).toBe('rejected');
    // A confirmed rejection ends the operation: `unknown` is what stays
    // pending forever, and the two must not look alike (R2-12).
    expect(model.panelA.status.pending.value).toBe(0);

    model.dispose();
  });

  it("keeps the submitted input under onReject: 'keep'", async () => {
    const model = await rejectedSave('save');
    const paths = model.panelA.changes().map(change => change.path.join('.'));

    expect(model.panelA.ref.city.value).toBe(CITY.resource);
    expect(paths).toContain('city');
    expect(paths).toContain('memo');
    expect(model.panelA.status.dirty.value).toBe(true);

    model.dispose();
  });

  it("removes only the submitted input under onReject: 'remove'", async () => {
    const model = await rejectedSave('save-reject-remove');
    const paths = model.panelA.changes().map(change => change.path.join('.'));

    // The capture carried `city` alone, so `city` goes back to the server
    // value and the untouched `memo` edit survives the recovery.
    expect(model.panelA.ref.city.value).toBe(CITY.server);
    expect(paths).not.toContain('city');
    expect(paths).toContain('memo');

    model.dispose();
  });

  it('keeps a later input on the submitted path and an outside server update', async () => {
    const model = await loaded();

    // An update the client does not know about yet, on a field no DTO
    // carries. A refetch is what brings it into the baseline.
    model.run('server-edit-memo');
    const serverMemo = model.server.value().memo;
    model.run('refetch');
    model.run('settle-all');
    await settled();
    expect(model.panelA.ref.memo.value).toBe(serverMemo);

    model.run('edit-busan');
    model.run('capture');
    model.run('next-write-rejected');
    model.run('save-reject-remove');
    // After the operation has started, not before: any local edit bumps the
    // resource version and `mutation.start` refuses a stale submission.
    model.run('edit-gwangju');
    model.run('settle-all');
    await settled();

    expect(readUi(model).mutationPhase).toBe('rejected');
    // The later input on the same path is not what was submitted, so the
    // recovery leaves it alone.
    expect(model.panelA.ref.city.value).toBe(CITY.overlap);
    expect(model.panelA.ref.memo.value).toBe(serverMemo);
    expect(model.server.counts().write).toBe(1);

    model.dispose();
  });

  it('leaves an earlier accepted operation alone when a later one is rejected', async () => {
    const model = await loaded();

    // One save that lands: its accepted values become the baseline.
    model.run('edit-busan');
    model.run('capture');
    model.run('save');
    model.run('settle-all');
    await settled();
    expect(readUi(model).mutationPhase).toBe('success');
    expect(model.panelA.changes()).toHaveLength(0);

    // A second save on top of it, rejected.
    model.run('edit-gwangju');
    model.run('capture');
    model.run('next-write-rejected');
    model.run('save-reject-remove');
    model.run('settle-all');
    await settled();

    expect(readUi(model).mutationPhase).toBe('rejected');
    // The recovery undoes the rejected submission alone. It does not reach
    // back past the operation that already succeeded, so the city is what the
    // first save stored - not the value the server started with.
    expect(model.panelA.ref.city.value).toBe(CITY.resource);
    expect(model.panelA.ref.city.value).not.toBe(CITY.server);
    expect(model.panelA.status.dirty.value).toBe(false);
    expect(model.server.value().city).toBe(CITY.resource);

    model.dispose();
  });

  it('answers instead of throwing when the submission went stale', async () => {
    const model = await loaded();

    model.run('edit-busan');
    model.run('capture');
    model.run('edit-after-capture');
    expect(() => model.run('save')).not.toThrow();

    expect(readUi(model).lastResult).toContain('저장을 시작하지 못했다');
    // Nothing was sent, so the operation never started.
    expect(model.server.counts().write).toBe(0);
    expect(readUi(model).mutationPhase).toBe('idle');

    model.dispose();
  });
});

/**
 * R2-12 on screen.
 *
 * A WRITE that landed but left the baseline unrecovered, and a WRITE that may
 * or may not have been stored at all, are two different results - and neither
 * was reachable from the demo. The recovery READ is an ordinary query load and
 * retries like one, so a single queued failure was absorbed and the operation
 * reported a plain success (B8-7-10); and once DC8-5-38 typed every rejection,
 * nothing was left that reached a *settled* `unknown` (B8-7-11). These tests
 * fail on the old fixture.
 */
describe('baseline recovery (M2-10)', () => {
  const settled = () => new Promise(resolve => setTimeout(resolve, 0));

  /**
   * Settle the WRITE and then every attempt of the recovery READ.
   *
   * Each attempt costs two passes: one settles the request that is in flight,
   * and the retry is only issued during the macrotask after it. Rather than
   * work that factor into a count, loop until the linked operation is over -
   * `pending` drops back to 0 whichever way it ends.
   */
  async function drain(model: DemoModel) {
    for (let pass = 0; pass < 4 * (QUERY_RETRY + 2); pass += 1) {
      model.run('settle-all');
      await settled();
      if (model.panelA.status.pending.value === 0) {
        // One more turn, so the result promise has reported the phase.
        await settled();
        return;
      }
    }
    throw new Error('the linked operation never settled');
  }

  const panelOf = (model: DemoModel) =>
    resourcePanel(model.panelA.status.value, model.panelA.changes());

  it('absorbs a single recovery READ failure into a plain success', async () => {
    const model = await loaded();

    model.run('edit-busan');
    model.run('capture');
    // Straight at the mock rather than through `next-write-sync-error`: that
    // operation now reserves the whole chain, and what this pins is the state
    // a shorter run leaves behind.
    model.server.nextWrite('success-then-read-failure', 1);
    model.run('save-with-refetch');
    await drain(model);

    // The READ really did fail on the server...
    expect(
      model.server
        .requests()
        .some(row => row.kind === 'READ' && row.outcome === 'error')
    ).toBe(true);
    // ...and the screen shows a plain success anyway, which is why M2-10
    // could not be performed against a single queued failure.
    expect(readUi(model).mutationPhase).toBe('success');
    const panel = panelOf(model);
    expect(panel.unconfirmed).toBe(false);
    expect(panel.invalidated).toBe(false);
    expect(panel.dirty).toBe(false);

    model.dispose();
  });

  it('reaches sync-error once the recovery READ exhausts its budget', async () => {
    const model = await loaded();

    model.run('edit-busan');
    model.run('capture');
    model.run('next-write-sync-error');
    model.run('save-with-refetch');
    await drain(model);

    // The WRITE landed: the server holds the new city and the operation is
    // over. Only the baseline recovery failed.
    expect(model.server.value().city).toBe(CITY.resource);
    expect(model.server.counts().write).toBe(1);
    expect(model.panelA.status.pending.value).toBe(0);

    // What separates it from a failed WRITE on screen: the phase names the
    // recovery, and the baseline is marked unconfirmed and invalidated rather
    // than rolled back.
    expect(readUi(model).mutationPhase).toBe('sync-error');
    const panel = panelOf(model);
    expect(panel.unconfirmed).toBe(true);
    expect(panel.invalidated).toBe(true);
    expect(panel.status).toBe('error');
    expect(panel.loaded).toBe(true);
    // The submitted edit is still a local difference - nothing accepted it.
    expect(panel.dirty).toBe(true);
    expect(model.panelA.ref.city.value).toBe(CITY.resource);

    model.dispose();
  });

  it('recovers from sync-error by reading again, not by resending the WRITE', async () => {
    const model = await loaded();

    model.run('edit-busan');
    model.run('capture');
    model.run('next-write-sync-error');
    model.run('save-with-refetch');
    await drain(model);
    expect(readUi(model).mutationPhase).toBe('sync-error');

    model.run('refetch');
    model.run('settle-all');
    await settled();

    // One WRITE, before and after. A save that already landed is never
    // replayed to repair the baseline (R2-12).
    expect(model.server.counts().write).toBe(1);
    const panel = panelOf(model);
    expect(panel.unconfirmed).toBe(false);
    expect(panel.invalidated).toBe(false);
    expect(panel.status).toBe('success');
    // The refetch brings back what the WRITE stored, so the local edit is no
    // longer a difference.
    expect(panel.dirty).toBe(false);
    expect(model.panelA.ref.city.value).toBe(CITY.resource);

    model.dispose();
  });

  it('settles a transport failure as unknown and leaves the baseline unconfirmed', async () => {
    const model = await loaded();

    model.run('edit-busan');
    model.run('capture');
    model.run('next-write-transport-failure');
    model.run('save');
    model.run('settle-all');
    await settled();

    // A plain transport error cannot say whether the server stored the write,
    // so sync ends the operation as `unknown` rather than rejecting it - and
    // does not resend it.
    expect(readUi(model).mutationPhase).toBe('unknown');
    expect(model.server.counts().write).toBe(1);
    // Settled, unlike the WRITE that never answers: `pending` is back to 0.
    expect(model.panelA.status.pending.value).toBe(0);

    const panel = panelOf(model);
    expect(panel.unconfirmed).toBe(true);
    expect(panel.serverBusy).toBe(false);
    // This mock did not store it - but the client was never told that, and
    // must not act as if it had been. Nothing is rolled back, the submitted
    // edit stands, and the baseline carries the mark instead.
    expect(model.server.value().city).toBe(CITY.server);
    expect(model.panelA.ref.city.value).toBe(CITY.resource);
    expect(panel.dirty).toBe(true);

    model.dispose();
  });

  it('separates a confirmed rejection from an unknown on the panel', async () => {
    const rejected = await loaded();
    rejected.run('edit-busan');
    rejected.run('capture');
    rejected.run('next-write-rejected');
    rejected.run('save-reject-remove');
    rejected.run('settle-all');
    await settled();

    const unknown = await loaded();
    unknown.run('edit-busan');
    unknown.run('capture');
    unknown.run('next-write-transport-failure');
    unknown.run('save-reject-remove');
    unknown.run('settle-all');
    await settled();

    // Both operations are over and neither is pending, so the phase and the
    // unconfirmed flag are what a person reads them apart by.
    expect(readUi(rejected).mutationPhase).toBe('rejected');
    expect(readUi(unknown).mutationPhase).toBe('unknown');
    expect(panelOf(rejected).unconfirmed).toBe(false);
    expect(panelOf(unknown).unconfirmed).toBe(true);

    // The two servers are in the same state - neither stored the write - so
    // what separates the screens is what the client was *told*, not what the
    // server did.
    expect(rejected.server.value().city).toBe(CITY.server);
    expect(unknown.server.value().city).toBe(CITY.server);
    // And the recovery follows it: `remove` may undo a submission the server
    // confirmed it refused, and must not touch one it might have stored.
    expect(rejected.panelA.ref.city.value).toBe(CITY.server);
    expect(unknown.panelA.ref.city.value).toBe(CITY.resource);

    rejected.dispose();
    unknown.dispose();
  });

  it('names the one save the reservation actually reaches', async () => {
    const model = await loaded();
    model.run('next-write-sync-error');

    // Only the refetch acceptance reads the server again, so it is the only
    // save that consumes the queued failure. The name comes from the
    // catalogue rather than a copy of it, or a renamed button would leave an
    // instruction pointing at a control nobody can find.
    expect(readUi(model).lastResult).toContain(
      operationLabel('save-with-refetch')
    );

    // Pressed with any other acceptance kind, the reservation sits unused and
    // the screen shows an ordinary success - the trap the text warns about.
    model.run('edit-busan');
    model.run('capture');
    model.run('save');
    await drain(model);
    expect(readUi(model).mutationPhase).toBe('success');
    expect(panelOf(model).unconfirmed).toBe(false);

    model.dispose();
  });

  it('repaints when a retry issues a request with no operation behind it', async () => {
    const model = await loaded();
    model.run('next-read-error');
    model.run('refetch');
    model.run('settle-read');

    // The press is over and the request it settled is gone. What happens next
    // - the retry - has no operation behind it.
    const afterPress = readUi(model).tick;
    expect(model.server.inFlight()).toHaveLength(0);
    // Two turns: the retry's own timer is scheduled after this one, so the
    // request does not exist yet when the first macrotask runs.
    await settled();
    await settled();

    // Without this, the panel kept showing `진행 중 0` while a READ was open
    // and the row was missing from the request table, which stopped a verifier
    // mid-chain (B8-7-13).
    expect(model.server.inFlight()).toHaveLength(1);
    expect(readUi(model).tick).toBeGreaterThan(afterPress);

    model.run('settle-all');
    await settled();
    model.dispose();
  });

  it('says so when the recovery barrier refuses a refetch', async () => {
    const model = await loaded();

    model.run('edit-busan');
    model.run('capture');
    model.run('save');
    expect(model.panelA.status.pending.value).toBe(1);
    const reads = model.server.counts().read;

    model.run('refetch');
    await settled();

    // The demo used to swallow this rejection and still answer '재조회를
    // 시작했다', so a refusal and a normal start looked the same (B8-7-12).
    const result = readUi(model).lastResult;
    expect(result).toContain('연결 장벽에 막혀 거절됐다');
    expect(result).toContain('A linked operation is pending for this query.');
    // Refused means refused: no request reached the server.
    expect(model.server.counts().read).toBe(reads);

    model.run('settle-all');
    await settled();
    model.dispose();
  });
});
