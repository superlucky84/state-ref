import { mount } from 'lithent';
import { appStore, navigateTo, resolveRouteForLanguage } from '@/store';

interface MenuItem {
  text: { en: string; ko: string };
  link: string;
}

interface MenuSection {
  text: { en: string; ko: string };
  items: MenuItem[];
}

const menuData: MenuSection[] = [
  {
    text: { en: 'Getting Started', ko: '시작하기' },
    items: [
      { text: { en: 'Introduction', ko: '소개' }, link: '/guide/introduction' },
      { text: { en: 'Quick Start', ko: '빠른 시작' }, link: '/guide/quick-start' },
    ],
  },
  {
    text: { en: 'Core Concepts', ko: '핵심 개념' },
    items: [
      { text: { en: 'createStore', ko: 'createStore' }, link: '/guide/create-store' },
      { text: { en: 'Watch Function', ko: 'Watch 함수' }, link: '/guide/watch' },
      { text: { en: 'Understanding References', ko: '참조 이해하기' }, link: '/guide/references' },
      { text: { en: 'StateRefStore', ko: 'StateRefStore' }, link: '/guide/state-ref-store' },
      { text: { en: 'Subscription', ko: '구독' }, link: '/guide/subscription' },
      { text: { en: 'Primitive Types', ko: '원시 타입' }, link: '/guide/primitives' },
    ],
  },
  {
    text: { en: 'Advanced Usage', ko: '고급 사용법' },
    items: [
      { text: { en: 'createComputed', ko: 'createComputed' }, link: '/guide/computed' },
      { text: { en: 'combineWatch', ko: 'combineWatch' }, link: '/guide/combine-watch' },
      { text: { en: 'Manual Sync (Flux)', ko: '수동 동기화 (Flux)' }, link: '/guide/manual-sync' },
    ],
  },
  {
    text: { en: 'Helper Functions', ko: '헬퍼 함수' },
    items: [
      { text: { en: 'Lens Pattern', ko: 'Lens 패턴' }, link: '/guide/lens' },
      { text: { en: 'copyable', ko: 'copyable' }, link: '/guide/copyable' },
      { text: { en: 'cloneDeep', ko: 'cloneDeep' }, link: '/guide/clone-deep' },
    ],
  },
  {
    text: { en: 'Framework Integration', ko: '프레임워크 연동' },
    items: [
      { text: { en: 'React', ko: 'React' }, link: '/guide/react' },
      { text: { en: 'Preact', ko: 'Preact' }, link: '/guide/preact' },
      { text: { en: 'Vue', ko: 'Vue' }, link: '/guide/vue' },
      { text: { en: 'Svelte', ko: 'Svelte' }, link: '/guide/svelte' },
      { text: { en: 'Solid', ko: 'Solid' }, link: '/guide/solid' },
      { text: { en: 'Lithent', ko: 'Lithent' }, link: '/guide/lithent' },
      { text: { en: 'Custom Connector', ko: '커스텀 커넥터' }, link: '/guide/custom-connector' },
    ],
  },
  {
    text: { en: 'API Reference', ko: 'API 레퍼런스' },
    items: [
      { text: { en: 'Core API', ko: '코어 API' }, link: '/api/core' },
      { text: { en: 'Helper API', ko: '헬퍼 API' }, link: '/api/helpers' },
      { text: { en: 'TypeScript Types', ko: 'TypeScript 타입' }, link: '/api/types' },
    ],
  },
];

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

export const Sidebar = mount(renew => {
  const store = appStore.watch(renew);
  const expanded: Record<string, boolean> = Object.fromEntries(
    menuData.map(section => [section.text.en, false])
  );
  let prevRoute = '';

  const handleClick = (link: string) => {
    const lang = store.route.startsWith('/ko') ? 'ko' : 'en';
    navigateTo(resolveRouteForLanguage(link, lang));
  };

  const toggleSection = (titleKey: string) => {
    expanded[titleKey] = !expanded[titleKey];
    renew();
  };

  return () => {
    const routeChanged = store.route !== prevRoute;
    const normalizedRoute = normalizePath(store.route);
    const currentLang = store.route.startsWith('/ko') ? 'ko' : 'en';
    const toLocalizedLink = (link: string) =>
      normalizePath(resolveRouteForLanguage(link, currentLang));

    // Close all sections when navigating to home
    if (
      routeChanged &&
      (normalizedRoute === '/' || normalizedRoute === '/ko')
    ) {
      menuData.forEach(section => {
        expanded[section.text.en] = false;
      });
    }

    const view = (
      <>
        {/* Mobile overlay */}
        {store.sidebarOpen && (
          <div
            class="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => {
              store.sidebarOpen = false;
            }}
          />
        )}

        {/* Sidebar */}
        <aside
          class={`
            fixed lg:sticky top-16 left-0 z-40
            w-64 h-[calc(100vh-4rem)] flex-shrink-0
            bg-white dark:bg-[#1b1b1f]
            border-r border-gray-200 dark:border-gray-800
            overflow-y-auto
            transition-transform duration-300
            ${store.sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav class="pl-6 md:pl-12 pr-3 md:pr-4 py-6">
            {menuData.map(section => {
              const sectionKey = section.text.en;
              if (
                routeChanged &&
                normalizedRoute !== '/' &&
                normalizedRoute !== '/ko'
              ) {
                const hasActive = section.items.some(
                  item => toLocalizedLink(item.link) === normalizedRoute
                );
                if (hasActive) {
                  expanded[sectionKey] = true;
                }
              }

              const isExpanded = expanded[sectionKey];

              return (
                <div class="mb-3">
                  <button
                    class="mb-1 w-full flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider"
                    onClick={() => toggleSection(sectionKey)}
                  >
                    <span>{section.text[currentLang]}</span>
                    <span class="text-base leading-none">
                      {isExpanded ? '▾' : '▸'}
                    </span>
                  </button>
                  <ul
                    class={`
                      space-y-0 overflow-hidden transition-all duration-200 ease-in-out
                      ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}
                    `}
                    aria-hidden={!isExpanded}
                  >
                    {section.items.map(item => {
                      const targetLink = resolveRouteForLanguage(
                        item.link,
                        currentLang
                      );
                      const isActive =
                        normalizedRoute === normalizePath(targetLink);
                      return (
                        <li>
                          <a
                            href={targetLink}
                            onClick={(e: Event) => {
                              e.preventDefault();
                              handleClick(item.link);
                            }}
                            class={`
                              block px-2 py-1.5 rounded-md text-sm font-normal transition-colors
                              ${
                                isActive
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                                  : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }
                            `}
                          >
                            {item.text[currentLang]}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>
      </>
    );

    prevRoute = store.route;
    return view;
  };
});
