import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncInfiniteKo = mount(() => {
  return () => (
    <div>
      <h1>무한 조회</h1>

      <p>
        &quot;더 보기&quot; 버튼이나 스크롤로 페이지가 쌓이는 목록에는{' '}
        <code>client.infiniteQuery</code>를 씁니다. 한 key 아래에 여러 페이지를
        순서대로 들고, 다음 페이지를 어디서 읽을지는 방금 받은 페이지가 알려
        줍니다.
      </p>

      <p>
        번호가 붙은 페이지를 한 번에 한 장씩 보여 주는 화면이라면 이 장이 아니라{' '}
        <a href="#/ko/guide/sync-view">반응형 key</a>로 페이지 번호를 key에 넣는
        편이 맞습니다.
      </p>

      <h2>기본 사용법</h2>

      <CodeBlock
        language="typescript"
        code={`type Page = { items: Item[]; next: number | null };

const feed = client.infiniteQuery({
  queryKey: ['feed'],
  initialPageParam: 0,
  queryFn: ({ pageParam, signal }): Promise<Page> =>
    api.readFeed({ cursor: pageParam, signal }),
  getNextPageParam: lastPage => lastPage.next, // null이면 끝
});

await feed.load();        // 첫 페이지만 읽는다
feed.ref.value.pages;     // [page0]
feed.ref.value.pageParams; // [0]

if (feed.hasNextPage()) {
  await feed.fetchNextPage(); // pages: [page0, page1], pageParams: [0, 1]
}`}
      />

      <p>
        데이터는 <code>{'{ pages, pageParams }'}</code>입니다.{' '}
        <code>pageParams[i]</code>가 <code>pages[i]</code>를 읽을 때 쓴 값이고,
        둘은 늘 같은 길이입니다.
      </p>

      <h2>다음 페이지를 정하는 함수</h2>

      <CodeBlock
        language="typescript"
        code={`getNextPageParam: (lastPage, pages, lastPageParam, pageParams) =>
  lastPage.next ?? null,

// 선택. 앞쪽으로도 읽을 수 있을 때만
getPreviousPageParam: (firstPage, pages, firstPageParam, pageParams) =>
  firstPageParam > 0 ? firstPageParam - 1 : null,`}
      />

      <ul>
        <li>
          <code>null</code>이나 <code>undefined</code>를 답하면 그 방향의
          끝입니다. <code>hasNextPage()</code>가 <code>false</code>가 되고, 그때{' '}
          <code>fetchNextPage()</code>는 요청 없이 현재 데이터를 돌려줍니다.
        </li>
        <li>
          <code>getPreviousPageParam</code>이 없으면{' '}
          <code>hasPreviousPage()</code>는 항상 <code>false</code>입니다.
        </li>
        <li>
          페이지 값(<code>pageParam</code>)은 JSON 호환이어야 합니다. 스냅숏에
          들어가기 때문입니다.
        </li>
      </ul>

      <h2>maxPages</h2>

      <p>
        긴 목록이 메모리에 끝없이 쌓이지 않게 들고 있을 페이지 수를 제한할 수
        있습니다. 넘치면 반대쪽 끝의 페이지가 빠집니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const feed = client.infiniteQuery({ ...options, maxPages: 2 });

await feed.load();          // pageParams: [0]
await feed.fetchNextPage(); // [0, 1]
await feed.fetchNextPage(); // [1, 2] — 앞의 0이 빠졌다
feed.hasPreviousPage();     // true (getPreviousPageParam이 있을 때)
await feed.fetchPreviousPage(); // [0, 1] — 이번에는 뒤의 2가 빠졌다`}
      />

      <h2>다시 읽기</h2>

      <p>
        <code>refetch()</code>와 자동 재조회는 지금 들고 있는 페이지 수만큼,{' '}
        <strong>들고 있는 첫 페이지의 값부터 순서대로</strong> 다시 읽습니다. 두
        번째부터의 값은 저장해 둔 것을 쓰지 않고 방금 읽은 페이지로부터 다시
        계산하므로, 서버에서 목록이 바뀌었다면 페이지 경계도 새로 맞춰집니다.
        도중에 <code>getNextPageParam</code>이 끝을 답하면 그만큼 적은 페이지로
        끝납니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`// pageParams: [0, 1]를 들고 있을 때
await feed.refetch(); // 0, 1 순서로 두 번 읽는다`}
      />

      <p>
        <code>staleTime</code>, <code>gcTime</code>, <code>retry</code>,{' '}
        <code>networkMode</code>, <code>refetchOnFocus</code> 같은 나머지 옵션은{' '}
        <a href="#/ko/guide/sync-refetch">일반 조회</a>와 같습니다.
      </p>

      <h2>읽기 전용이다</h2>

      <p>
        무한 조회의 페이지는 편집할 수 없습니다. <code>ref</code>에 쓰면{' '}
        <code>This query is readonly.</code>로 거절하고, 핸들에는{' '}
        <code>changes()</code>도 <code>capture()</code>도 없습니다. 목록의 한
        항목을 고치는 화면이라면 그 항목을 일반 조회로 따로 열고, 저장한 뒤 무한
        조회를 <code>invalidate()</code>하거나 <code>refetch()</code>
        하세요.
      </p>

      <p>
        로드 전에 <code>ref</code>를 읽으면{' '}
        <code>Query data is not loaded. Call load() first.</code>로 던지는 것은
        일반 조회와 같습니다.
      </p>

      <h2>화면에 펼치기</h2>

      <p>
        <code>select</code>로 페이지를 평평한 목록으로 바꾸면 화면 쪽 코드가
        단순해집니다. 표시는 관찰자마다 따로라서 캐시는 페이지 모양 그대로
        남습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const feed = client.infiniteQuery({
  ...options,
  select: data => data.pages.flatMap(page => page.items),
});

await feed.load();
await feed.fetchNextPage();
feed.display.data.value; // [...page0.items, ...page1.items]

// React
const useFeed = connectReactView(feed.watchDisplay);`}
      />

      <h2>한계</h2>

      <ul>
        <li>
          <strong>고정 key만 받습니다.</strong> 반응형 key(
          <code>{'{ source, resolve }'}</code>)의 무한 조회판은 없습니다.
          검색어가 바뀌면 이전 핸들을 <code>dispose()</code>하고 새 key로 다시
          여세요.
        </li>
        <li>
          캐시 준비는 <code>client.prefetchInfinite</code>·
          <code>fetchInfinite</code>·<code>ensureInfinite</code>로 합니다. 일반
          조회의 <code>prefetch</code>·<code>fetch</code>·<code>ensure</code>와
          같은 규칙입니다.
        </li>
      </ul>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/sync-view">표시와 반응형 key</a> - 번호 페이지와{' '}
          <code>select</code>
        </li>
        <li>
          <a href="#/ko/guide/sync-refetch">자동 재조회</a> - 무한 조회에도 같은
          정책
        </li>
        <li>
          <a href="#/ko/api/sync">Sync API</a> -{' '}
          <code>InfiniteQueryOptions</code>와 핸들 모양
        </li>
      </ul>
    </div>
  );
});
