// Contract-only type experiment. These declarations are not package exports.
// Run after `pnpm build:core` with:
// pnpm exec tsc --noEmit --strict --target es2020 --module esnext --moduleResolution bundler docs/server-sync/experiments/phase0-types.ts
import type {
  StateRefStore,
  Watch,
} from '../../../packages/state-ref/dist/index';
import { createStore } from '../../../packages/state-ref/dist/index';

type Change = Readonly<{
  id: string;
  version: number;
  path: readonly (string | number)[];
  before: unknown;
  after: unknown;
}>;

type ApplyResult =
  | { ok: true; appliedVersion: number }
  | { ok: false; reason: 'conflict' | 'readonly' | 'expired' | 'stale' };

interface DraftHandle<T> {
  readonly ref: StateRefStore<T>;
  readonly watch: Watch<T>;
  isDirty(): boolean;
  changes(): readonly Change[];
  apply(expectedVersion?: number): ApplyResult;
  reset(): void;
  discard(): void;
}

// StateRefStore<T> infers T from a held branch in this repository's TypeScript.
declare function createDraft<T>(source: StateRefStore<T>): DraftHandle<T>;

const watch = createStore({ address: { city: '서울', postcode: '00000' } });
const source = watch().address;
const editor = createDraft(source);
const connectorInput: Watch<{ city: string; postcode: string }> = editor.watch;
editor.ref.city.value = '대전';
// @ts-expect-error The branch keeps the source's string value type.
editor.ref.city.value = 123;
const city: string = editor.ref.city.value;
const unchangedSource: string = source.city.value;
const result: ApplyResult = editor.apply();
// @ts-expect-error Changes are readonly review snapshots.
editor.changes().push({ id: 'x', version: 1, path: [], before: 0, after: 1 });
void city;
void connectorInput;
void unchangedSource;
void result;

// Object-shaped fakes lacking nested ref nodes fail at compile time.
// @ts-expect-error A nested city ref is required.
createDraft({ value: { city: 'not a state-ref' } });
// Primitive-shaped fakes remain structurally assignable. Runtime provenance
// validation in the core opt-in connection is therefore mandatory.
createDraft({ value: 'not a state-ref' });
