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
    title: '시작하기',
    description: 'StateRef의 기본을 배워보세요',
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
      { text: '소개', link: '/guide/introduction' },
      { text: '빠른 시작', link: '/guide/quick-start' },
    ],
  },
  {
    title: '핵심 개념',
    description: '기본 개념을 이해해보세요',
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
      { text: 'Watch 함수', link: '/guide/watch' },
      { text: 'Lens 패턴', link: '/guide/lens' },
    ],
  },
  {
    title: '헬퍼 함수',
    description: '강력한 상태 관리 유틸리티',
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
    title: '프레임워크 연동',
    description: '좋아하는 UI 프레임워크와 연결하세요',
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

export const HomeKo = mount(() => {
  const handleNavigation = (link: string) => {
    navigateTo(link);
  };

  return () => (
    <div>
      {/* Hero Section */}
      <div class="mb-12">
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          StateRef 문서
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
          데이터 불변성에 초점을 맞춘 범용 상태 관리 라이브러리
        </p>
        <p class="text-base text-gray-600 dark:text-gray-400">
          StateRef는 프록시와 함수형 프로그래밍 렌즈 패턴을 결합하여 깊게 중첩된 데이터를 효율적이고 안전하게 접근하고 수정합니다.
        </p>
      </div>

      {/* Features Grid */}
      <div class="mb-12 grid gap-4 md:grid-cols-2">
        <div class="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🎯 세밀한 반응성
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            프록시 기반 추적으로 업데이트가 필요한 컴포넌트만 다시 렌더링됩니다
          </p>
        </div>
        <div class="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🔒 기본 불변성
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Copy-on-write 패턴으로 변경 없이 안전한 상태 업데이트를 보장합니다
          </p>
        </div>
        <div class="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🔌 프레임워크 독립적
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            React, Vue, Svelte, Solid 등과 쉽게 통합됩니다
          </p>
        </div>
        <div class="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📦 경량
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            의존성 없이 작은 번들 크기를 유지합니다
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
