// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStore } from 'state-ref';
import { createDevtools } from '../index';
import { mountPanel, type PanelOptions } from '../panel';

const key = '@stateref/devtools/button-position/v1';
const cleanups: (() => void)[] = [];
function mount(options: PanelOptions = {}) {
  const tools = createDevtools();
  const watch = createStore({ count: 0 });
  tools.attachStore(watch);
  const unmount = mountPanel(tools, options);
  cleanups.push(() => {
    unmount();
    tools.dispose();
  });
  const host = document.querySelector<HTMLElement>('[data-stateref-devtools]')!;
  const shadow = host.shadowRoot!;
  const settings = shadow.querySelector<HTMLDetailsElement>('details')!;
  const select = settings.querySelector('select')!;
  const choose = (position: string) => {
    select.value = position;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  };
  return { tools, watch, host, shadow, settings, select, choose, unmount };
}
afterEach(() => {
  cleanups.splice(0).forEach(cleanup => cleanup());
  vi.restoreAllMocks();
  localStorage.clear();
  document.body.replaceChildren();
});

describe('panel toggle preferences', () => {
  it('saves only the selected corner without reconnecting sources or changing history', () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const view = mount();
    expect(view.select.value).toBe('bottom-right');
    expect(write).not.toHaveBeenCalled();
    const before = view.tools.getSnapshot();
    view.choose('top-left');
    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith(key, 'top-left');
    expect(view.tools.getSnapshot()).toEqual(before);
    expect(view.watch().count.value).toBe(0);
    expect(Array.from(view.select.options).map(option => option.value)).toEqual(
      ['top-left', 'top-right', 'bottom-left', 'bottom-right']
    );
    view.unmount();
    view.choose('bottom-left');
    expect(write).toHaveBeenCalledTimes(1);
  });

  it('prefers a saved choice over the initial option across mounts', () => {
    localStorage.setItem(key, 'top-right');
    const view = mount({ buttonPosition: 'bottom-left' });
    expect(view.select.value).toBe('top-right');
    view.choose('top-left');
    view.unmount();
    const next = mount({ buttonPosition: 'bottom-left' });
    expect(next.select.value).toBe('top-left');
  });

  it.each([null, 'invalid', '{"position":"top-left"}'])(
    'ignores an invalid saved value (%s)',
    saved => {
      if (saved !== null) localStorage.setItem(key, saved);
      const view = mount({ buttonPosition: 'bottom-left' });
      expect(view.select.value).toBe('bottom-left');
    }
  );

  it('works when even obtaining localStorage is blocked', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Denied', 'SecurityError');
    });
    const view = mount({ buttonPosition: 'top-left' });
    expect(() => view.choose('bottom-left')).not.toThrow();
    expect(view.select.value).toBe('bottom-left');
    expect(view.host.dataset.buttonPosition).toBe('bottom-left');
  });

  it('keeps operating when storage reads or writes fail', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw Error('read denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('quota');
    });
    const view = mount({ buttonPosition: 'top-right' });
    expect(view.select.value).toBe('top-right');
    expect(() => view.choose('bottom-left')).not.toThrow();
    expect(view.host.dataset.buttonPosition).toBe('bottom-left');
    expect(view.tools.getSnapshot().sources).toHaveLength(1);
  });

  it('keeps inline controls in their container without reading or writing storage', () => {
    const read = vi.spyOn(Storage.prototype, 'getItem');
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const view = mount({ layout: 'inline', buttonPosition: 'top-left' });
    expect(view.settings.hidden).toBe(true);
    view.choose('bottom-left');
    expect(read).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it('closes settings before collapsing, and preserves keyboard focus', () => {
    const view = mount();
    view.settings.open = true;
    view.select.focus();
    const escape = () =>
      view.select.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          composed: true,
        })
      );
    escape();
    expect(view.settings.open).toBe(false);
    expect(view.shadow.activeElement).toBe(
      view.settings.querySelector('summary')
    );
    const shell = view.shadow.querySelector<HTMLElement>('.shell')!;
    expect(shell.hidden).toBe(false);
    escape();
    const launcher = view.shadow.querySelector<HTMLButtonElement>('.launcher')!;
    expect(shell.hidden).toBe(true);
    expect(view.shadow.activeElement).toBe(launcher);
    launcher.click();
    expect(shell.hidden).toBe(false);
    expect(view.shadow.activeElement?.getAttribute('role')).toBe('tab');
  });

  it('rejects invalid initial positions without mounting a panel', () => {
    const tools = createDevtools();
    try {
      // @ts-expect-error Invalid positions are also rejected at runtime.
      expect(() => mountPanel(tools, { buttonPosition: 'middle' })).toThrow(
        /buttonPosition/
      );
      expect(document.querySelector('[data-stateref-devtools]')).toBeNull();
    } finally {
      tools.dispose();
    }
  });
});
