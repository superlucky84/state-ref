import { mount } from 'lithent';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { appStore } from '@/store';
import { Home } from '@/pages/Home';
import { HomeKo } from '@/pages/Home_ko';
import { Introduction } from '@/pages/Introduction';
import { IntroductionKo } from '@/pages/Introduction_ko';

type PageComponent = (...args: any[]) => any;

const normalizeRoute = (path: string) => {
  const cleaned = path.replace(/\/+$/, '');
  return cleaned || '/';
};

// Route configuration
const routes: Record<string, PageComponent> = {
  '/': Home,
  '/ko': HomeKo,
  '/guide/introduction': Introduction,
  '/ko/guide/introduction': IntroductionKo,
};

const resolveRoute = (path: string): PageComponent => {
  const normalized = normalizeRoute(path);
  const current = routes[normalized];

  if (current) {
    return current;
  }

  if (normalized.startsWith('/ko')) {
    const fallback = normalizeRoute(normalized.replace(/^\/ko/, '') || '/');
    return routes[fallback] || Introduction;
  }

  return Introduction;
};

export const Layout = mount(renew => {
  const store = appStore.watch(renew);

  return () => {
    const CurrentPage = resolveRoute(store.route);

    return (
      <div class="min-h-screen bg-white dark:bg-[#1b1b1f] transition-colors">
        <Header />

        {/* Main Container - centered with max-width */}
        <div class="mx-auto max-w-[1440px]">
          <div class="flex">
            <Sidebar />

            {/* Main Content */}
            <main class="flex-1 w-full min-w-0 px-6 md:px-12 py-8 max-w-full">
              <div class="max-w-full md:max-w-[43rem] page-shell">
                <CurrentPage />
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  };
});
