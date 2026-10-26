import { describe, it, expect, vi } from 'vitest';
import { devtools, stopDevtools } from '../auto.development';
import type { InspectableSyncClient } from '../sync';
import * as recorder from '../index';

describe('auto server boundary', () => {
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
