import { mount } from 'lithent';
import { appStore, toggleTheme, toggleLanguage, isKoreanRoute, navigateTo } from '@/store';

export const Header = mount(renew => {
  const store = appStore.watch(renew);

  return () => (
    <header class="sticky top-0 z-50 bg-white dark:bg-[#1b1b1f] border-b border-gray-200 dark:border-gray-800">
      <div class="mx-auto max-w-[1440px]">
        <div class="flex h-16">
          {/* Left: Logo area - matches sidebar width */}
          <div class="w-auto lg:w-64 flex-shrink-0 flex items-center px-6 md:px-12">
            <a
              href="#/"
              onClick={(e: Event) => {
                e.preventDefault();
                navigateTo('/');
              }}
              class="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <img src="/state-ref/stateref.png" alt="StateRef Logo" class="w-8 h-8 rounded-lg" />
              <span class="text-xl font-bold text-gray-900 dark:text-white">
                StateRef
              </span>
            </a>
          </div>

          {/* Right: Controls area - matches main content width */}
          <div class="flex-1 w-full min-w-0 px-6 md:px-12">
            <div class="max-w-full md:max-w-[43rem] flex items-center justify-end h-16">
              {/* Language Toggle */}
              <div class="flex items-center border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold overflow-hidden">
                <button
                  type="button"
                  onClick={() => !isKoreanRoute() || toggleLanguage()}
                  class={`px-3 py-1 transition-colors ${
                    !isKoreanRoute()
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                  aria-pressed={!isKoreanRoute()}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => isKoreanRoute() || toggleLanguage()}
                  class={`px-3 py-1 transition-colors ${
                    isKoreanRoute()
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                  aria-pressed={isKoreanRoute()}
                >
                  KO
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                class="hidden sm:inline-flex ml-6 relative items-center h-9 w-16 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 bg-gray-200 dark:bg-gray-700"
                aria-label="Toggle dark mode"
                title={store.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span
                  class={`inline-block h-7 w-7 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
                    store.theme === 'dark' ? 'translate-x-8' : 'translate-x-1'
                  }`}
                >
                  <span class="flex items-center justify-center h-full">
                    {store.theme === 'dark' ? (
                      <svg
                        class="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                        />
                      </svg>
                    ) : (
                      <svg
                        class="w-4 h-4 text-yellow-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    )}
                  </span>
                </span>
              </button>

              {/* GitHub Link */}
              <a
                href="https://github.com/superlucky84/state-ref"
                target="_blank"
                rel="noopener noreferrer"
                class="hidden sm:flex ml-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="GitHub"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5 text-gray-700 dark:text-gray-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill-rule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clip-rule="evenodd"
                  />
                </svg>
              </a>

              {/* Mobile menu button */}
              <button
                class="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md p-2 ml-4"
                aria-label="Toggle sidebar"
                onClick={() => {
                  store.sidebarOpen = !store.sidebarOpen;
                }}
              >
                <svg
                  class="w-6 h-6 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});
