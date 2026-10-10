import { useEffect, useState } from 'preact/hooks';
import type {
  ObserveOptions,
  QueryDisplayRef,
  QueryDisplayState,
  QueryObserverControls,
  SyncClient,
} from '@stateref/sync';
import { connectPreactView } from './index';

/** Run after Preact's after-paint effects, including the 100ms fallback. */
function scheduleRelease(release: () => void): void {
  let scheduled = false;
  let frame: number | undefined;
  const afterPaint = () => {
    if (scheduled) return;
    scheduled = true;
    clearTimeout(fallback);
    if (frame !== undefined && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(frame);
    }
    setTimeout(() => setTimeout(release, 0), 0);
  };
  const fallback = setTimeout(afterPaint, 200);
  if (typeof requestAnimationFrame === 'function') {
    frame = requestAnimationFrame(afterPaint);
  }
}

/** Observe a query for this component's lifetime; leaf values use `.value`. */
export function useSyncQuery<T, S = T>(
  client: SyncClient,
  options: ObserveOptions<T, S>
): readonly [QueryDisplayRef<QueryDisplayState<S>>, QueryObserverControls<T>] {
  const [link] = useState(() => {
    if (typeof client.observe !== 'function') {
      throw new Error(
        'This sync client has no observe(); align the @stateref/sync versions of the bundles on this page.'
      );
    }
    const observer = client.observe(options, { scheduleRelease });
    return { client, observer, useView: connectPreactView(observer.watch) };
  });
  if (link.client !== client) {
    throw new Error('This query observer is bound to another client.');
  }

  // Preact has no external-store consistency check. A committed key change
  // needs another render through the subscribed ref to collect its paths.
  const [, setVersion] = useState(0);
  useEffect(() => {
    if (link.observer.setOptions(options)) setVersion(value => value + 1);
  });
  const display = link.useView();
  return [
    link.observer.matches(options) ? display : link.observer.peek(options),
    link.observer.controls,
  ];
}
