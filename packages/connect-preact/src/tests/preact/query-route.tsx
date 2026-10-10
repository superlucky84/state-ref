/** T-QH-30: native Preact render and real timers preserve after-paint ordering. */
import { h, render } from 'preact';
import { createSyncClient } from '@stateref/sync';
import { useSyncQuery } from '@/sync';

void h;
const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;
  describe('Preact query hook route replacement', () => {
    it.each([
      [false, false],
      [false, true],
      [true, false],
      [true, true],
    ])(
      'keeps the in-flight READ across replacement (stalled rAF=%s, unmount first=%s)',
      async (stalled, unmountFirst) => {
        if (stalled) {
          vi.stubGlobal('requestAnimationFrame', () => 0);
          vi.stubGlobal('cancelAnimationFrame', () => {});
        }
        const client = createSyncClient();
        const signals: AbortSignal[] = [];
        const queryFn = vi.fn(({ signal }: { signal: AbortSignal }) => {
          signals.push(signal);
          return new Promise<{ name: string }>(() => {});
        });
        const trail: number[] = [];
        const stopEvents = client.subscribeCache(event => {
          if (event.type === 'updated') trail.push(event.entry.owners);
        });
        const host = document.createElement('div');
        document.body.appendChild(host);
        function Panel() {
          const [display] = useSyncQuery(client, {
            queryKey: ['route'],
            queryFn,
            gcTime: Infinity,
          });
          return <p>{display.fetchStatus.value}</p>;
        }
        try {
          render(<Panel key="first" />, host);
          const deadline = performance.now() + 1000;
          while (
            queryFn.mock.calls.length === 0 &&
            performance.now() < deadline
          )
            await sleep(5);
          expect(queryFn).toHaveBeenCalledTimes(1);
          // Drain the mount's path-collection render too. Its queued effects
          // could otherwise attach the next route early and mask a release
          // that runs one timer stage before the new subscription.
          await sleep(stalled ? 130 : 40);
          if (unmountFirst) render(null, host);
          render(<Panel key="second" />, host);
          // Let both the effects and the previous handle's release run.
          await sleep(stalled ? 260 : 80);
          expect(queryFn).toHaveBeenCalledTimes(1);
          expect(signals.every(signal => !signal.aborted)).toBe(true);
          expect(client.inspectCache()[0].owners).toBe(1);
          expect(trail).not.toContain(0);
          render(null, host);
          await sleep(stalled ? 260 : 80);
          expect(client.inspectCache()[0].owners).toBe(0);
          expect(signals[0].aborted).toBe(true);
        } finally {
          render(null, host);
          host.remove();
          stopEvents();
          vi.unstubAllGlobals();
        }
      }
    );
  });
}
