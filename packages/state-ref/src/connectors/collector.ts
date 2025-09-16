import type { Run, RunInfo, StoreRenderList } from '@/types';

/**
 * Map to assign a unique ID to each Symbol.
 * - WeakMap can't use symbol as key in TS, so we use Map.
 * - This ensures every Symbol in a path is uniquely identified.
 */
const symbolIdMap = new Map<symbol, number>();
let symbolCounter = 0;

/**
 * The subscription to store starts the moment the user of stateRef fetches the reference as a “.value”.
 * This code captures the moment of fetching to “.value” and collects the subscription.
 */
export function collector<V>(
  value: V,
  getNextValue: () => V,
  newDepthList: (string | number | symbol)[],
  run: Run,
  storeRenderList: StoreRenderList<V>
) {
  if (run) {
    const key = keyFromDepthList(newDepthList);

    const runInfo: RunInfo<V> = {
      value,
      getNextValue,
      key,
    };

    if (storeRenderList.has(run)) {
      const subList = storeRenderList.get(run)!;
      if (!subList.has(key)) subList.set(key, runInfo);
    } else {
      const subList = new Map<string, typeof runInfo>();
      subList.set(key, runInfo);
      storeRenderList.set(run, subList);
    }
  }
}

/**
 * Escape special characters in strings to make keys bulletproof.
 * - Escapes ':', '|', and '\' to prevent collisions in the final key string.
 */
function escapeString(str: string): string {
  return str.replace(/[:|\\]/g, '\\$&');
}

/**
 * Convert a path array into a unique, collision-resistant string key.
 * - Supports strings, numbers, and Symbols.
 * - Prefixes each element with a type marker:
 *   - 's:' for string
 *   - 'n:' for number
 *   - 'y:' for Symbol (unique ID via Map)
 * - Escapes special characters in strings.
 * - Joins all elements with '|' to form a flat key string.
 *
 * Example:
 *  ["user", Symbol("id"), 42] -> "s:user|y:1|n:42"
 */
function keyFromDepthList(path: (string | number | symbol)[]): string {
  return path
    .map(k => {
      if (typeof k === 'string') return 's:' + escapeString(k);
      if (typeof k === 'number') return 'n:' + k;
      if (typeof k === 'symbol') {
        if (!symbolIdMap.has(k)) symbolIdMap.set(k, ++symbolCounter);
        return 'y:' + symbolIdMap.get(k);
      }
      return '?';
    })
    .join('|'); // safe separator
}
