/**
 * docs/shared-store (T-SH-10, connector half): a hook made from a watch that
 * arrived through `state-ref/shared` renders and re-renders like any other.
 * The two-copies half lives in packages/state-ref/test/shared-bundle.mjs.
 */
import { h } from 'preact';
import { render, cleanup, act } from '@testing-library/preact';
import { createStore } from 'state-ref';
import { onShared, provideShared } from 'state-ref/shared';
import { connectPreact } from '@/index';

if (import.meta.vitest) {
  const { describe, it, expect, afterEach } = import.meta.vitest;

  afterEach(() => {
    cleanup();
    delete (globalThis as any)[Symbol.for('state-ref.shared')];
  });

  describe('a shared watch through connectPreact', () => {
    it('connects a consumer that asked before the provider loaded', async () => {
      let useSubs: (() => { count: { value: number } }) | undefined;
      onShared<{ count: number }>('subs', watch => {
        useSubs = connectPreact(watch);
      });
      expect(useSubs).toBeUndefined();

      const writer = provideShared('subs', createStore({ count: 0 }))();
      expect(useSubs).toBeDefined();

      function Counter() {
        const state = useSubs!();
        return <span data-testid="count">{state.count.value}</span>;
      }
      const screen = render(<Counter />);
      expect(screen.getByTestId('count').textContent).toBe('0');

      await act(() => {
        writer.count.value = 5;
      });
      expect(screen.getByTestId('count').textContent).toBe('5');
    });
  });
}
