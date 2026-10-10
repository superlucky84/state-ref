import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/vue';
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue';
import { createSyncClient } from '@stateref/sync';
import type { QueryObserverControls } from '@stateref/sync';
import { useSyncQuery } from '@/sync';

type Account = { name: string };
afterEach(cleanup);

describe('query KeepAlive (T-QH-42)', () => {
  it.each(['eviction', 'root unmount'] as const)(
    'keeps the inactive owner and releases it on %s',
    async finish => {
      const client = createSyncClient();
      const visible = ref(true);
      const included = ref(true);
      let setups = 0;
      let q!: QueryObserverControls<Account>;
      let signal!: AbortSignal;
      const queryFn = vi.fn((context: { signal: AbortSignal }) => {
        signal = context.signal;
        return finish === 'eviction'
          ? { name: 'loaded' }
          : new Promise<Account>(() => {});
      });
      const Panel = defineComponent({
        name: 'QueryPanel',
        setup() {
          setups += 1;
          const [select, controls] = useSyncQuery(client, {
            queryKey: ['account'],
            queryFn,
            staleTime: Infinity,
            gcTime: Infinity,
          });
          q = controls;
          const name = select(display => display.data.name.value);
          return () => h('p', name.value ?? 'waiting');
        },
      });
      const Other = defineComponent({
        name: 'Other',
        setup: () => () => h('p', 'other'),
      });
      const Root = defineComponent({
        setup: () => () =>
          h(
            KeepAlive,
            { include: included.value ? ['QueryPanel'] : ['Other'] },
            { default: () => (visible.value ? h(Panel) : h(Other)) }
          ),
      });
      const screen = render(Root);
      const controls = q;
      if (finish === 'eviction')
        await waitFor(() =>
          expect(screen.container.textContent).toBe('loaded')
        );
      expect(client.inspectCache()[0].owners).toBe(1);
      visible.value = false;
      await nextTick();
      // Move beyond the release schedule; inactivity must retain ownership.
      await new Promise<void>(resolve => setTimeout(resolve, 10));
      expect(screen.container.textContent).toBe('other');
      expect(client.inspectCache()[0].owners).toBe(1);
      expect(q.handle()).not.toBeNull();
      expect(signal.aborted).toBe(false);
      expect(queryFn).toHaveBeenCalledTimes(1);
      if (finish === 'eviction') {
        q.handle()!.ref.name.value = 'edited while inactive';
        visible.value = true;
        await nextTick();
        expect(setups).toBe(1);
        expect(q).toBe(controls);
        expect(screen.container.textContent).toBe('edited while inactive');
        expect(queryFn).toHaveBeenCalledTimes(1);
        visible.value = false;
        await nextTick();
        included.value = false;
        await nextTick();
      } else screen.unmount();
      expect(q.handle()).toBeNull();
      await waitFor(() => expect(client.inspectCache()[0].owners).toBe(0));
      if (finish === 'root unmount') expect(signal.aborted).toBe(true);
      screen.unmount();
    }
  );
});
