import { mount } from 'lithent';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { appStore } from '@/store';
import { Home } from '@/pages/Home';
import { HomeKo } from '@/pages/Home_ko';
import { Introduction } from '@/pages/Introduction';
import { IntroductionKo } from '@/pages/Introduction_ko';
import { QuickStart } from '@/pages/QuickStart';
import { QuickStartKo } from '@/pages/QuickStart_ko';
import { CreateStore } from '@/pages/CreateStore';
import { CreateStoreKo } from '@/pages/CreateStore_ko';
import { Watch } from '@/pages/Watch';
import { WatchKo } from '@/pages/Watch_ko';
import { References } from '@/pages/References';
import { ReferencesKo } from '@/pages/References_ko';
import { StateRefStore } from '@/pages/StateRefStore';
import { StateRefStoreKo } from '@/pages/StateRefStore_ko';
import { Subscription } from '@/pages/Subscription';
import { SubscriptionKo } from '@/pages/Subscription_ko';
import { Primitives } from '@/pages/Primitives';
import { PrimitivesKo } from '@/pages/Primitives_ko';
import { Computed } from '@/pages/Computed';
import { ComputedKo } from '@/pages/Computed_ko';
import { CombineWatch } from '@/pages/CombineWatch';
import { CombineWatchKo } from '@/pages/CombineWatch_ko';
import { Batch } from '@/pages/Batch';
import { BatchKo } from '@/pages/Batch_ko';
import { Draft } from '@/pages/Draft';
import { DraftKo } from '@/pages/Draft_ko';
import { DraftApply } from '@/pages/DraftApply';
import { DraftApplyKo } from '@/pages/DraftApply_ko';
import { DraftConflicts } from '@/pages/DraftConflicts';
import { DraftConflictsKo } from '@/pages/DraftConflicts_ko';
import { DraftLifetime } from '@/pages/DraftLifetime';
import { DraftLifetimeKo } from '@/pages/DraftLifetime_ko';
import { Sync } from '@/pages/Sync';
import { SyncKo } from '@/pages/Sync_ko';
import { SyncQuery } from '@/pages/SyncQuery';
import { SyncQueryKo } from '@/pages/SyncQuery_ko';
import { SyncMutation } from '@/pages/SyncMutation';
import { SyncMutationKo } from '@/pages/SyncMutation_ko';
import { SyncLifecycle } from '@/pages/SyncLifecycle';
import { SyncLifecycleKo } from '@/pages/SyncLifecycle_ko';
import { SyncView } from '@/pages/SyncView';
import { SyncInfinite } from '@/pages/SyncInfinite';
import { SyncInfiniteKo } from '@/pages/SyncInfinite_ko';
import { SyncViewKo } from '@/pages/SyncView_ko';
import { SyncRefetch } from '@/pages/SyncRefetch';
import { SyncRefetchKo } from '@/pages/SyncRefetch_ko';
import { SyncPersistence } from '@/pages/SyncPersistence';
import { SyncPersistenceKo } from '@/pages/SyncPersistence_ko';
import { SyncObservation } from '@/pages/SyncObservation';
import { SyncObservationKo } from '@/pages/SyncObservation_ko';
import { ManualSync } from '@/pages/ManualSync';
import { ManualSyncKo } from '@/pages/ManualSync_ko';
import { Lens } from '@/pages/Lens';
import { LensKo } from '@/pages/Lens_ko';
import { Copyable } from '@/pages/Copyable';
import { CopyableKo } from '@/pages/Copyable_ko';
import { CloneDeep } from '@/pages/CloneDeep';
import { CloneDeepKo } from '@/pages/CloneDeep_ko';
import { React } from '@/pages/React';
import { ReactKo } from '@/pages/React_ko';
import { Preact } from '@/pages/Preact';
import { PreactKo } from '@/pages/Preact_ko';
import { Vue } from '@/pages/Vue';
import { VueKo } from '@/pages/Vue_ko';
import { Svelte } from '@/pages/Svelte';
import { SvelteKo } from '@/pages/Svelte_ko';
import { Solid } from '@/pages/Solid';
import { SolidKo } from '@/pages/Solid_ko';
import { Lithent } from '@/pages/Lithent';
import { LithentKo } from '@/pages/Lithent_ko';
import { CustomConnector } from '@/pages/CustomConnector';
import { CustomConnectorKo } from '@/pages/CustomConnector_ko';
import { ApiCore } from '@/pages/ApiCore';
import { ApiCoreKo } from '@/pages/ApiCore_ko';
import { ApiHelpers } from '@/pages/ApiHelpers';
import { ApiHelpersKo } from '@/pages/ApiHelpers_ko';
import { ApiDraft } from '@/pages/ApiDraft';
import { ApiDraftKo } from '@/pages/ApiDraft_ko';
import { ApiSync } from '@/pages/ApiSync';
import { ApiSyncKo } from '@/pages/ApiSync_ko';
import { ApiPlugin } from '@/pages/ApiPlugin';
import { ApiPluginKo } from '@/pages/ApiPlugin_ko';
import { ApiTypes } from '@/pages/ApiTypes';
import { ApiTypesKo } from '@/pages/ApiTypes_ko';
import { AIAgentSkills } from '@/pages/AIAgentSkills';
import { AIAgentSkillsKo } from '@/pages/AIAgentSkills_ko';
import { AIAgentAddon } from '@/pages/AIAgentAddon';
import { AIAgentAddonKo } from '@/pages/AIAgentAddon_ko';

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
  '/guide/quick-start': QuickStart,
  '/ko/guide/quick-start': QuickStartKo,
  '/guide/create-store': CreateStore,
  '/ko/guide/create-store': CreateStoreKo,
  '/guide/watch': Watch,
  '/ko/guide/watch': WatchKo,
  '/guide/references': References,
  '/ko/guide/references': ReferencesKo,
  '/guide/state-ref-store': StateRefStore,
  '/ko/guide/state-ref-store': StateRefStoreKo,
  '/guide/subscription': Subscription,
  '/ko/guide/subscription': SubscriptionKo,
  '/guide/primitives': Primitives,
  '/ko/guide/primitives': PrimitivesKo,
  '/guide/computed': Computed,
  '/ko/guide/computed': ComputedKo,
  '/guide/combine-watch': CombineWatch,
  '/ko/guide/combine-watch': CombineWatchKo,
  '/guide/manual-sync': ManualSync,
  '/ko/guide/manual-sync': ManualSyncKo,
  '/guide/batch': Batch,
  '/ko/guide/batch': BatchKo,
  '/guide/draft': Draft,
  '/ko/guide/draft': DraftKo,
  '/guide/draft-apply': DraftApply,
  '/ko/guide/draft-apply': DraftApplyKo,
  '/guide/draft-conflicts': DraftConflicts,
  '/ko/guide/draft-conflicts': DraftConflictsKo,
  '/guide/draft-lifetime': DraftLifetime,
  '/ko/guide/draft-lifetime': DraftLifetimeKo,
  '/guide/sync': Sync,
  '/ko/guide/sync': SyncKo,
  '/guide/sync-query': SyncQuery,
  '/ko/guide/sync-query': SyncQueryKo,
  '/guide/sync-mutation': SyncMutation,
  '/ko/guide/sync-mutation': SyncMutationKo,
  '/guide/sync-lifecycle': SyncLifecycle,
  '/ko/guide/sync-lifecycle': SyncLifecycleKo,
  '/guide/sync-view': SyncView,
  '/ko/guide/sync-view': SyncViewKo,
  '/guide/sync-infinite': SyncInfinite,
  '/ko/guide/sync-infinite': SyncInfiniteKo,
  '/guide/sync-refetch': SyncRefetch,
  '/ko/guide/sync-refetch': SyncRefetchKo,
  '/guide/sync-persistence': SyncPersistence,
  '/ko/guide/sync-persistence': SyncPersistenceKo,
  '/guide/sync-observation': SyncObservation,
  '/ko/guide/sync-observation': SyncObservationKo,
  '/guide/lens': Lens,
  '/ko/guide/lens': LensKo,
  '/guide/copyable': Copyable,
  '/ko/guide/copyable': CopyableKo,
  '/guide/clone-deep': CloneDeep,
  '/ko/guide/clone-deep': CloneDeepKo,
  '/guide/react': React,
  '/ko/guide/react': ReactKo,
  '/guide/preact': Preact,
  '/ko/guide/preact': PreactKo,
  '/guide/vue': Vue,
  '/ko/guide/vue': VueKo,
  '/guide/svelte': Svelte,
  '/ko/guide/svelte': SvelteKo,
  '/guide/solid': Solid,
  '/ko/guide/solid': SolidKo,
  '/guide/lithent': Lithent,
  '/ko/guide/lithent': LithentKo,
  '/guide/custom-connector': CustomConnector,
  '/ko/guide/custom-connector': CustomConnectorKo,
  '/api/core': ApiCore,
  '/ko/api/core': ApiCoreKo,
  '/api/helpers': ApiHelpers,
  '/ko/api/helpers': ApiHelpersKo,
  '/api/types': ApiTypes,
  '/ko/api/types': ApiTypesKo,
  '/api/draft': ApiDraft,
  '/ko/api/draft': ApiDraftKo,
  '/api/sync': ApiSync,
  '/ko/api/sync': ApiSyncKo,
  '/api/plugin': ApiPlugin,
  '/ko/api/plugin': ApiPluginKo,
  '/ai-agent-skills': AIAgentSkills,
  '/ko/ai-agent-skills': AIAgentSkillsKo,
  '/ai-agent-addon': AIAgentAddon,
  '/ko/ai-agent-addon': AIAgentAddonKo,
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
