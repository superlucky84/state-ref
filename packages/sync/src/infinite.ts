import { hashQueryKey } from './key';
import type { QueryHandle, QueryOptions } from './index';
import type { QueryViewRef, QueryViewState, QueryViewWatch } from './view';

export type InfiniteData<Page, Param> = Readonly<{
  pages: readonly Page[];
  pageParams: readonly Param[];
}>;

export type InfiniteQueryOptions<Page, Param> = Omit<
  QueryOptions<InfiniteData<Page, Param>>,
  'queryFn' | 'editable' | 'initialData'
> &
  Readonly<{
    queryFn: (context: {
      signal: AbortSignal;
      pageParam: Param;
    }) => Promise<Page> | Page;
    initialPageParam: Param;
    getNextPageParam: (
      lastPage: Page,
      pages: readonly Page[],
      lastPageParam: Param,
      pageParams: readonly Param[]
    ) => Param | null | undefined;
    getPreviousPageParam?: (
      firstPage: Page,
      pages: readonly Page[],
      firstPageParam: Param,
      pageParams: readonly Param[]
    ) => Param | null | undefined;
    maxPages?: number;
    initialData?: InfiniteData<Page, Param>;
  }>;

export type InfiniteQueryHandle<Page, Param> = Readonly<{
  ref: QueryViewRef<InfiniteData<Page, Param>>;
  watch: QueryViewWatch<InfiniteData<Page, Param>>;
  status: QueryHandle<InfiniteData<Page, Param>>['status'];
  watchStatus: QueryHandle<InfiniteData<Page, Param>>['watchStatus'];
  load: () => Promise<InfiniteData<Page, Param>>;
  refetch: () => Promise<InfiniteData<Page, Param>>;
  fetchNextPage: () => Promise<InfiniteData<Page, Param>>;
  fetchPreviousPage: () => Promise<InfiniteData<Page, Param>>;
  hasNextPage: () => boolean;
  hasPreviousPage: () => boolean;
  invalidate: () => void;
  dispose: () => void;
}>;

export type InfiniteQueryViewHandle<Page, Param, S> = Readonly<{
  query: InfiniteQueryHandle<Page, Param>;
  ref: QueryViewRef<QueryViewState<S>>;
  watch: QueryViewWatch<QueryViewState<S>>;
  dispose: () => void;
}>;

export function checkPageParam(value: unknown): void {
  hashQueryKey([value]);
}

export function checkInfiniteData(
  value: unknown,
  maxPages?: number
): asserts value is InfiniteData<unknown, unknown> {
  if (
    !value ||
    typeof value !== 'object' ||
    !Array.isArray((value as InfiniteData<unknown, unknown>).pages) ||
    !Array.isArray((value as InfiniteData<unknown, unknown>).pageParams)
  ) {
    throw new TypeError('Infinite data needs pages and pageParams arrays.');
  }
  const data = value as InfiniteData<unknown, unknown>;
  if (
    data.pages.length === 0 ||
    data.pages.length !== data.pageParams.length ||
    (maxPages !== undefined && data.pages.length > maxPages)
  ) {
    throw new TypeError(
      'Infinite pages and pageParams must have equal nonzero lengths within maxPages.'
    );
  }
  const seen = new Set<string>();
  for (let index = 0; index < data.pageParams.length; index += 1) {
    if (
      !Object.prototype.hasOwnProperty.call(data.pageParams, index) ||
      !Object.prototype.hasOwnProperty.call(data.pages, index)
    )
      throw new TypeError('Infinite pages and pageParams cannot be sparse.');
    const hash = hashQueryKey([data.pageParams[index]]);
    if (seen.has(hash))
      throw new TypeError('Infinite pageParams cannot repeat.');
    seen.add(hash);
  }
}

export function makeInfiniteData<Page, Param>(
  pages: readonly Page[],
  pageParams: readonly Param[]
): InfiniteData<Page, Param> {
  return Object.freeze({
    pages: Object.freeze([...pages]),
    pageParams: Object.freeze([...pageParams]),
  });
}

export function checkInfiniteOptions<Page, Param>(
  options: InfiniteQueryOptions<Page, Param>
) {
  checkPageParam(options.initialPageParam);
  if (
    typeof options.queryFn !== 'function' ||
    typeof options.getNextPageParam !== 'function' ||
    (options.getPreviousPageParam !== undefined &&
      typeof options.getPreviousPageParam !== 'function')
  )
    throw new TypeError('Infinite query requires page readers and cursors.');
  if (
    options.maxPages !== undefined &&
    (!Number.isSafeInteger(options.maxPages) || options.maxPages <= 0)
  ) {
    throw new RangeError('maxPages must be a positive safe integer.');
  }
  if (options.initialData !== undefined)
    checkInfiniteData(options.initialData, options.maxPages);
}

export function samePageParam(a: unknown, b: unknown): boolean {
  return hashQueryKey([a]) === hashQueryKey([b]);
}

export function nextPageParam<Page, Param>(
  options: InfiniteQueryOptions<Page, Param>,
  data: InfiniteData<Page, Param>
): Param | null | undefined {
  const last = data.pages.length - 1;
  const param = options.getNextPageParam(
    data.pages[last],
    data.pages,
    data.pageParams[last],
    data.pageParams
  );
  if (param != null) checkPageParam(param);
  return param;
}

export function previousPageParam<Page, Param>(
  options: InfiniteQueryOptions<Page, Param>,
  data: InfiniteData<Page, Param>
): Param | null | undefined {
  const param = options.getPreviousPageParam?.(
    data.pages[0],
    data.pages,
    data.pageParams[0],
    data.pageParams
  );
  if (param != null) checkPageParam(param);
  return param;
}
