import { combineWatch, createComputed, createStore } from 'state-ref';
import type { Renew, StateRefStore, Watch } from 'state-ref';
import { batch } from 'state-ref/batch';
import { createDraft } from 'state-ref/draft';
import { createSyncClient, MutationRejectedError } from '@stateref/sync';
import type {
  ObserveOptions,
  QueryDisplayRef,
  QueryDisplayState,
  QueryObserverControls,
} from '@stateref/sync';
import { createControlledEnvironment } from './environment';
import { INITIAL_SHIPS } from './mission-data.mjs';

export { INITIAL_SHIPS } from './mission-data.mjs';
export type Ship = (typeof INITIAL_SHIPS)[number];
export type MissionUi = {
  id: number;
  open: boolean;
  twin: boolean;
  poll: boolean;
  online: boolean;
  message: string;
  saving: boolean;
  reads: number;
  writes: number;
  cancelled: number;
  cache: string;
  owners: number;
  counters: number;
  draftOpen: boolean;
  draftFuel: number;
  draftCargo: number;
  batchNotices: number;
  equipment: string;
};
export type ShipScreen = {
  id: number;
  name: string;
  destination: string;
  fuel: number;
  cargo: string;
  oxygen?: number;
  loaded: boolean;
  phase: string;
  fetch: string;
  error: string;
  dirty: boolean;
};
export function shipScreen(
  ref: QueryDisplayRef<QueryDisplayState<Ship>>
): ShipScreen {
  const id = Number(ref.queryKey.value?.[1] ?? 0);
  const error = ref.error.value;
  return {
    id,
    name: ref.data.name.value ?? '',
    destination: ref.data.destination.value ?? '',
    fuel: ref.data.fuel.value ?? 0,
    cargo: ref.data.cargo.value ?? '',
    oxygen: id === 2 ? ref.data.oxygen.value : undefined,
    loaded: ref.loaded.value,
    phase: ref.status.value,
    fetch: ref.fetchStatus.value,
    error: error instanceof Error ? error.message : error ? String(error) : '',
    dirty: ref.dirty.value,
  };
}

export function createMission() {
  const ui = createStore<MissionUi>({
    id: 1,
    open: false,
    twin: true,
    poll: false,
    online: true,
    message: '왼쪽에서 우주선을 골라 첫 정비를 시작하세요.',
    saving: false,
    reads: 0,
    writes: 0,
    cancelled: 0,
    cache: '아직 방문한 우주선이 없어요.',
    owners: 0,
    counters: 0,
    draftOpen: false,
    draftFuel: 40,
    draftCargo: 3,
    batchNotices: 0,
    equipment: '',
  });
  const state = ui();
  const environment = createControlledEnvironment();
  const client = createSyncClient({ environment });
  const controller = new AbortController();
  const loadout = createStore({ fuel: 40, cargo: 3 });
  const summary = createComputed(
    [loadout],
    ([gear]) => `탐험 준비 ${gear.fuel.value + gear.cargo.value * 10}점`
  );
  const gearSummary = combineWatch([loadout, summary]);
  gearSummary((refs, first) => {
    state.equipment.value = `연료 ${refs[0].fuel.value} · 화물 ${refs[0].cargo.value} · ${refs[1].value}`;
    if (first) return controller.signal;
    return undefined;
  });
  const counterStore = createStore(0);
  const counter: Watch<number> = (renew, option) => {
    if (!renew) return counterStore();
    const wrapped: Renew<StateRefStore<number>> = (ref, first) => {
      const signal = renew(ref, first);
      if (first && signal instanceof AbortSignal && !signal.aborted) {
        state.counters.value += 1;
        signal.addEventListener(
          'abort',
          () => {
            state.counters.value -= 1;
          },
          { once: true }
        );
      }
      return signal;
    };
    return counterStore(wrapped, option);
  };
  const off = client.subscribeCache(() => {
    const cache = client.inspectCache();
    batch(() => {
      state.owners.value = cache.reduce(
        (total, item) => total + item.owners,
        0
      );
      state.cache.value =
        cache
          .map(item => `${item.queryKey[1]}번: 화면 ${item.owners}개`)
          .join(' / ') || '아직 방문한 우주선이 없어요.';
    });
  });
  async function transport(
    id: number,
    signal: AbortSignal,
    name?: string
  ): Promise<Ship> {
    if (name === undefined) state.reads.value += 1;
    else state.writes.value += 1;
    try {
      const response = await fetch('/mission-api/ships/' + id, {
        method: name === undefined ? 'GET' : 'PUT',
        signal,
        ...(name === undefined
          ? {}
          : {
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ name }),
            }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409)
          throw new MutationRejectedError(result.error);
        throw new Error(result.error);
      }
      return result as Ship;
    } catch (error) {
      if (signal.aborted && name === undefined) state.cancelled.value += 1;
      throw error;
    }
  }
  const mutation = client.mutation({
    mutationFn: (input: { id: number; name: string }, { signal }) =>
      transport(input.id, signal, input.name),
  });
  let draft: ReturnType<
    typeof createDraft<{ fuel: number; cargo: number }>
  > | null = null;
  return {
    ui,
    counter,
    client,
    options(id: number, poll: boolean): ObserveOptions<Ship> {
      return {
        queryKey: ['mission', id],
        staleTime: 30_000,
        gcTime: 60_000,
        retry: 0,
        refetchInterval: poll ? 1000 : false,
        queryFn: ({ signal }) => transport(id, signal),
      };
    },
    choose(id: number) {
      batch(() => {
        state.id.value = id;
        state.open.value = true;
        if (!state.saving.value)
          state.message.value =
            '새 이름을 붙여 보세요. 보조 화면도 함께 바뀌어요.';
      });
    },
    close() {
      state.open.value = false;
    },
    toggleTwin() {
      state.twin.value = !state.twin.value;
    },
    togglePoll() {
      state.poll.value = !state.poll.value;
    },
    toggleOnline() {
      state.online.value = !state.online.value;
      environment.setOnline(state.online.value);
    },
    edit(q: QueryObserverControls<Ship>, name: string) {
      const handle = q.handle();
      if (handle?.status.value.loaded) handle.ref.name.value = name;
    },
    async save(q: QueryObserverControls<Ship>) {
      const handle = q.handle();
      if (!handle?.status.value.loaded || Boolean(state.saving.value)) return;
      const submission = handle.capture();
      state.saving.value = true;
      state.message.value =
        '정비소에 저장 중… 지금 이름을 다시 바꿔도 괜찮아요.';
      try {
        const result = await mutation.run(
          { id: Number(handle.queryKey[1]), name: submission.value.name },
          {
            links: [
              {
                query: handle,
                submission,
                accept: { kind: 'response', select: response => response },
                onReject: 'keep',
              },
            ],
          }
        );
        state.message.value =
          result.kind === 'success'
            ? '저장됐어요. 제출 뒤 고친 내용은 편집으로 남아요.'
            : result.kind === 'rejected'
            ? '정비소가 저장을 거절했어요. 이름을 그대로 두고 다시 시도해 보세요.'
            : '저장 결과를 확인하지 못했어요. 자동으로 다시 보내지는 않아요.';
      } finally {
        state.saving.value = false;
      }
    },
    async refresh(q: QueryObserverControls<Ship>) {
      try {
        await q.refetch();
      } catch {
        /* The display reports the error. */
      }
    },
    invalidate(q: QueryObserverControls<Ship>) {
      q.invalidate();
    },
    async control(input: Record<string, unknown>) {
      const response = await fetch('/mission-api/control', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('통신 설정을 바꾸지 못했어요.');
      state.message.value = input.failRead
        ? '다음 조회가 한 번 실패해요. 새로고침해 보세요.'
        : input.rejectSave
        ? '다음 저장이 한 번 거절돼요. 이름을 고쳐 저장해 보세요.'
        : input.change
        ? '다른 조종사가 서버의 연료와 산소를 보충했어요. 새로고침해 보세요.'
        : '느린 통신으로 바꿨어요. 빠르게 우주선을 바꿔 보세요.';
    },
    openDraft() {
      draft?.discard();
      draft = createDraft(loadout());
      batch(() => {
        state.draftFuel.value = draft!.ref.fuel.value;
        state.draftCargo.value = draft!.ref.cargo.value;
        state.draftOpen.value = true;
      });
    },
    editDraft(value: number) {
      if (draft) {
        draft.ref.fuel.value = value;
        state.draftFuel.value = value;
      }
    },
    closeDraft(apply: boolean) {
      if (apply && draft) draft.apply();
      draft?.discard();
      draft = null;
      state.draftOpen.value = false;
    },
    upgrade(batched: boolean) {
      let notices = 0;
      const abort = new AbortController();
      loadout((ref, first) => {
        void ref.value;
        if (first) return abort.signal;
        notices++;
        return undefined;
      });
      const upgrade = () => {
        loadout().fuel.value += 10;
        loadout().cargo.value += 1;
      };
      if (batched) batch(upgrade);
      else upgrade();
      abort.abort();
      state.batchNotices.value = notices;
    },
    dispose() {
      controller.abort();
      off();
      draft?.discard();
    },
  };
}
export type Mission = ReturnType<typeof createMission>;
