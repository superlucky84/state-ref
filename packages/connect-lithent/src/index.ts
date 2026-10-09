import * as lithent from 'lithent';
import type { Renew } from 'state-ref';

export type ViewWatch<R> = (
  renew?: Renew<R>,
  option?: { cache?: boolean }
) => R;

/** Read a query view in a Lithent mounter; subscribe only after its mount. */
export function connectLithentView<R extends { readonly value: unknown }>(
  viewWatch: ViewWatch<R>
): () => R {
  if (typeof window === 'undefined') return () => viewWatch();
  const renew = lithent.useRenew();
  const controller = new AbortController();
  let current: R | undefined;
  let queued = false;
  const redraw = () => {
    if (queued || controller.signal.aborted) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (!controller.signal.aborted) renew();
    });
  };
  lithent.mountCallback(() => {
    try {
      const notify = (
        lithent as typeof lithent & { notifyStoreWrite?: () => void }
      ).notifyStoreWrite;
      if (notify) {
        // All display writes invalidate a concurrent build. This subscription
        // never schedules a render; the other one follows only rendered paths.
        viewWatch((ref, first) => {
          void ref.value;
          if (first) return controller.signal;
          notify();
          return undefined;
        });
      }
      current = viewWatch((_ref, first) => {
        if (first) return controller.signal;
        redraw();
        return undefined;
      });
      redraw(); // Collect paths through the subscribed ref after the initial peek.
    } catch (error) {
      controller.abort();
      throw error;
    }
    return () => {
      controller.abort();
      current = undefined;
    };
  });
  return () => current ?? viewWatch();
}
