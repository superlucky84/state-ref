import { describe, it, expect, vi } from 'vitest';
import { devtools, stopDevtools } from '../auto.development';
import type { InspectableSyncClient } from '../sync';
import * as recorder from '../index';

describe('auto server boundary', () => {
  it('imports the panel and returns targets without accessing browser preferences', async () => {
    const previous = Object.getOwnPropertyDescriptor(
      globalThis,
      'localStorage'
    );
    const read = vi.fn(() => {
      throw Error('server storage accessed');
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: read,
    });
    try {
      const panel = await import('../panel');
      expect(typeof panel.mountPanel).toBe('function');
      const client = {} as InspectableSyncClient;
      expect(devtools(client, { panel: { buttonPosition: 'top-left' } })).toBe(
        client
      );
      expect(read).not.toHaveBeenCalled();
    } finally {
      if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
      else Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });

  it('returns each request client unchanged without inspection, DOM or global registry', () => {
    const spy = vi.spyOn(recorder, 'createDevtools');
    try {
      for (let i = 0; i < 2; i++) {
        const client = new Proxy({} as InspectableSyncClient, {
          get() {
            throw Error('server read');
          },
        });
        expect(devtools(client, { enabled: true })).toBe(client);
        stopDevtools(client);
      }
      expect(spy).not.toHaveBeenCalled();
      expect(typeof document).toBe('undefined');
    } finally {
      spy.mockRestore();
    }
  });
});
