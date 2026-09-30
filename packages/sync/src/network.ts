import type { SyncEnvironment } from './automatic-refetch';

export type NetworkMode = 'online' | 'always' | 'offlineFirst';

export function checkNetworkMode(value: unknown): asserts value is NetworkMode {
  if (
    value !== undefined &&
    value !== 'online' &&
    value !== 'always' &&
    value !== 'offlineFirst'
  )
    throw new TypeError('networkMode must be online, always or offlineFirst.');
}

export function createNetworkGate(
  environment: SyncEnvironment | undefined,
  ssr: boolean
) {
  const isOnline = () => ssr || (environment?.isOnline() ?? true);
  const wait = (signal: AbortSignal): Promise<void> => {
    if (signal.aborted)
      return Promise.reject(
        new DOMException('Query was cancelled.', 'AbortError')
      );
    if (isOnline()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let release: (() => void) | null = null;
      let settled = false;
      const finish = (error?: unknown) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener('abort', cancel);
        release?.();
        if (error !== undefined) reject(error);
        else resolve();
      };
      const cancel = () =>
        finish(new DOMException('Query was cancelled.', 'AbortError'));
      const check = () => {
        try {
          if (isOnline()) finish();
        } catch (error) {
          finish(error);
        }
      };
      signal.addEventListener('abort', cancel, { once: true });
      try {
        const unsubscribe = environment!.subscribe(check);
        if (typeof unsubscribe !== 'function')
          throw new TypeError(
            'environment.subscribe must return an unsubscribe function.'
          );
        release = unsubscribe;
        if (settled) release();
        else if (signal.aborted) cancel();
        else check();
      } catch (error) {
        finish(error);
      }
    });
  };
  return Object.freeze({ isOnline, wait });
}
