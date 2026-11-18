import type { ProjectionOptions, QueryDisplayOptions } from './display';
import type { QueryKey } from './key';
import { hashQueryKey } from './key';
import { frozenCopy } from './tree';

export type PlaceholderDataContext = Readonly<{
  previousQueryKey: QueryKey | undefined;
  queryKey: QueryKey;
}>;

/** A pure display preview. Neither its input nor its result seeds a query. */
export type PlaceholderDataFunction<T> = (
  previousData: T | undefined,
  context: PlaceholderDataContext
) => T | undefined;

/** Keep the last loaded data of this observer while its next key loads. */
export function keepPreviousData<T>(
  previousData: T | undefined
): T | undefined {
  return previousData;
}

export type PreviousQueryData<T> = Readonly<{ data: T; queryKey: QueryKey }>;

type Options<T, S> = Omit<QueryDisplayOptions<T, S>, 'placeholderData'> & {
  queryKey: QueryKey;
  placeholderData?: T | PlaceholderDataFunction<T>;
};

/** Each display/peek keeps a bounded memo, including callback failures. */
export function placeholderOptions<T, S>(
  readOptions: () => Options<T, S>,
  readPrevious: () => PreviousQueryData<T> | undefined
): (
  needsPlaceholder?: boolean
) => ProjectionOptions<T, S> & { queryKey: QueryKey } {
  let last:
    | {
        callback: PlaceholderDataFunction<T>;
        previous: PreviousQueryData<T> | undefined;
        hash: string;
        resolve: () => T | undefined;
      }
    | undefined;
  return (needsPlaceholder = true) => {
    const options = readOptions();
    const { placeholderData, ...rest } = options;
    if (typeof placeholderData !== 'function')
      return { ...rest, placeholderData: placeholderData as T | undefined };
    if (!needsPlaceholder) return rest;
    const callback = placeholderData as PlaceholderDataFunction<T>;
    const previous = readPrevious();
    // Invalid keys are reported by the peek/cursor before any projection.
    let hash: string;
    try {
      hash = hashQueryKey(options.queryKey);
    } catch {
      return rest;
    }
    if (
      !last ||
      last.callback !== callback ||
      last.previous !== previous ||
      last.hash !== hash
    ) {
      const context: PlaceholderDataContext = Object.freeze({
        previousQueryKey: previous?.queryKey,
        queryKey: frozenCopy(JSON.parse(hash)) as QueryKey,
      });
      let result: { data: T | undefined } | { error: unknown } | undefined;
      last = {
        callback,
        previous,
        hash,
        resolve: () => {
          if (!result) {
            try {
              result = { data: callback(previous?.data, context) };
            } catch (error) {
              result = { error };
            }
          }
          if ('error' in result) throw result.error;
          return result.data;
        },
      };
    }
    return { ...rest, resolvePlaceholder: last.resolve };
  };
}
