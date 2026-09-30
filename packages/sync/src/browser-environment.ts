import type { SyncEnvironment } from './automatic-refetch';

type ListenerTarget = Readonly<{
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}>;

export type BrowserSyncHost = Readonly<{
  window: ListenerTarget;
  document: ListenerTarget & Readonly<{ visibilityState: string }>;
  navigator: Readonly<{ onLine: boolean }>;
}>;

/** Browser globals are read only when this factory is called. */
export function createBrowserSyncEnvironment(
  host?: BrowserSyncHost
): SyncEnvironment {
  const browser =
    host ??
    (typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof navigator !== 'undefined'
      ? { window, document, navigator }
      : null);
  if (!browser)
    throw new TypeError('Browser sync environment requires a browser host.');
  const isFocused = () => browser.document.visibilityState === 'visible';
  const isOnline = () => browser.navigator.onLine !== false;
  return Object.freeze({
    isFocused,
    isOnline,
    subscribe(listener) {
      const focus: EventListener = () => {
        if (isFocused()) listener('focus');
      };
      const reconnect: EventListener = () => {
        if (isOnline()) listener('reconnect');
      };
      browser.window.addEventListener('focus', focus);
      browser.document.addEventListener('visibilitychange', focus);
      browser.window.addEventListener('online', reconnect);
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        browser.window.removeEventListener('focus', focus);
        browser.document.removeEventListener('visibilitychange', focus);
        browser.window.removeEventListener('online', reconnect);
      };
    },
  });
}
