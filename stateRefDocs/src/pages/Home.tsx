import { mount } from 'lithent';
import { navigateTo } from '@/store';

interface MenuItem {
  text: string;
  link: string;
}

interface Category {
  title: string;
  description: string;
  icon: string;
  items: MenuItem[];
  theme: {
    gradient: string;
    borderColor: string;
    hoverBorder: string;
    tagBg: string;
    tagHover: string;
    textColor: string;
  };
}

const categories: Category[] = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of StateRef',
    icon: '🚀',
    theme: {
      gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-600',
      tagBg: 'bg-blue-100 dark:bg-blue-900/40',
      tagHover: 'hover:bg-blue-200 dark:hover:bg-blue-800/60',
      textColor: 'text-blue-900 dark:text-blue-100',
    },
    items: [
      { text: 'Introduction', link: '/guide/introduction' },
      { text: 'Quick Start', link: '/guide/quick-start' },
    ],
  },
  {
    title: 'Core Concepts',
    description: 'Understand the fundamental concepts',
    icon: '⚡',
    theme: {
      gradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      hoverBorder: 'hover:border-green-400 dark:hover:border-green-600',
      tagBg: 'bg-green-100 dark:bg-green-900/40',
      tagHover: 'hover:bg-green-200 dark:hover:bg-green-800/60',
      textColor: 'text-green-900 dark:text-green-100',
    },
    items: [
      { text: 'createStore', link: '/guide/create-store' },
      { text: 'Watch Function', link: '/guide/watch' },
      { text: 'Lens Pattern', link: '/guide/lens' },
    ],
  },
  {
    title: 'Helper Functions',
    description: 'Powerful utilities for state management',
    icon: '🔧',
    theme: {
      gradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      hoverBorder: 'hover:border-purple-400 dark:hover:border-purple-600',
      tagBg: 'bg-purple-100 dark:bg-purple-900/40',
      tagHover: 'hover:bg-purple-200 dark:hover:bg-purple-800/60',
      textColor: 'text-purple-900 dark:text-purple-100',
    },
    items: [
      { text: 'copyable', link: '/guide/copyable' },
      { text: 'createComputed', link: '/guide/computed' },
      { text: 'combineWatch', link: '/guide/combine-watch' },
    ],
  },
  {
    title: 'Framework Integration',
    description: 'Connect with your favorite UI framework',
    icon: '🔗',
    theme: {
      gradient: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      hoverBorder: 'hover:border-orange-400 dark:hover:border-orange-600',
      tagBg: 'bg-orange-100 dark:bg-orange-900/40',
      tagHover: 'hover:bg-orange-200 dark:hover:bg-orange-800/60',
      textColor: 'text-orange-900 dark:text-orange-100',
    },
    items: [
      { text: 'React', link: '/guide/react' },
      { text: 'Vue', link: '/guide/vue' },
      { text: 'Svelte', link: '/guide/svelte' },
      { text: 'Solid', link: '/guide/solid' },
    ],
  },
];

export const Home = mount(_renew => {
  const handleNavigation = (link: string) => {
    navigateTo(link);
  };

  return () => (
    <div>
      {/* Hero Section */}
      <div class="mb-12">
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          StateRef Documentation
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Universal state management library focused on data immutability
        </p>
        <p class="text-base text-gray-600 dark:text-gray-400">
          StateRef combines proxies and the functional programming lens pattern to efficiently and safely access and modify deeply structured data.
        </p>
      </div>

      {/* Features Grid */}
      <div class="mb-12 grid gap-4 md:grid-cols-2">
        <div class="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🎯 Fine-grained Reactivity
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Proxy-based tracking ensures only the components that need to update will re-render
          </p>
        </div>
        <div class="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🔒 Immutable by Default
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Copy-on-write pattern ensures safe state updates without mutations
          </p>
        </div>
        <div class="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🔌 Framework Agnostic
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Easy integration with React, Vue, Svelte, Solid, and more
          </p>
        </div>
        <div class="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📦 Lightweight
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Small bundle size with zero dependencies
          </p>
        </div>
      </div>

      {/* Categories */}
      <div class="space-y-6">
        {categories.map(category => (
          <div
            key={category.title}
            class={`bg-gradient-to-r ${category.theme.gradient} rounded-lg border ${category.theme.borderColor} ${category.theme.hoverBorder} p-6 transition-all hover:shadow-xl`}
          >
            <div class="flex items-start gap-4 mb-4">
              <span class="text-4xl flex-shrink-0">{category.icon}</span>
              <div class="flex-1">
                <h2 class={`text-2xl font-bold ${category.theme.textColor} mb-2`}>
                  {category.title}
                </h2>
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  {category.description}
                </p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              {category.items.map(item => (
                <a
                  key={item.link}
                  href={item.link}
                  onClick={(e: Event) => {
                    e.preventDefault();
                    handleNavigation(item.link);
                  }}
                  class={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${category.theme.tagBg} ${category.theme.tagHover} ${category.theme.textColor} transition-all hover:shadow-md`}
                >
                  {item.text}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
