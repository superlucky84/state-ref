/**
 * Fixtures shared by every state-ref example demo.
 *
 * The mock server, the controllable request settlement, the injected
 * `SyncEnvironment`, the scenario values and the panel projections live here
 * so that all five connector demos drive the *same* fixture. When Phase 8.7
 * compares the five by hand, a difference on screen then has to come from the
 * connector - not from a fixture that drifted apart between copies
 * (DC8-5-01 in docs/server-sync/PHASE8_5.md).
 *
 * This package is never published and never talks to a real server
 * (DC8-5-07). What it controls is request settlement and environment events;
 * `staleTime` and `refetchInterval` still run on the real clock, because sync
 * takes no injectable time source (DC8-5-12).
 */
export { createDeferred } from './deferred';
export type { Deferred } from './deferred';
export { createControlledEnvironment } from './environment';
export type { ControlledEnvironment } from './environment';
export { createMockServer } from './mock-server';
export type { MockServer } from './mock-server';
export {
  CACHE_CELLS,
  CACHE_ROW_ATTR,
  CACHE_TABLE_CARDS,
  CARD_FIELDS,
  CARD_TITLE,
  CARDS_ON_LOAD,
  CHANGE_CELLS,
  CHANGE_ROW_ATTR,
  FIELD_LABEL,
  MUTATION_CELLS,
  MUTATION_ROW_ATTR,
  MUTATION_TABLE_CARDS,
  REQUEST_CELLS,
  REQUEST_ROW_ATTR,
  displayPhase,
  displayPhaseOf,
  keyText,
  label,
  show,
} from './fields';
export type {
  CacheCell,
  CardId,
  ChangeCell,
  FieldId,
  MutationCell,
  RequestCell,
} from './fields';
export { screenOf } from './screen';
export type { ScreenReading } from './screen';
export { SCENARIOS, mismatches, pressesOf } from './scenarios';
export type { Expectation, Match, Scenario, Step } from './scenarios';
export {
  CITY,
  CONTACT_RENAME,
  INITIAL_PROFILE,
  removeOffice,
  reorderContacts,
  ROOM_EDIT,
  toSaveDto,
  withMemo,
} from './scenario';
export {
  AUTO_REFETCH,
  PANEL_KEY,
  POLICY_TEXT,
  QUERY_RETRY,
  READING_QUERIES,
  READONLY_KEY,
  createDemoModel,
} from './model';
export type {
  BoundaryPanel,
  ComputedSource,
  LifetimePanel,
  DemoModel,
  DemoUi,
  DraftPair,
  ProbePanel,
  SharePanel,
} from './model';
export { OPERATION_GROUPS, OPERATION_IDS, operationLabel } from './operations';
export {
  createSsrModelFromSnapshot,
  createSsrModelOnServer,
} from './ssr-model';
export type { SsrModel, SsrModelOptions, SsrPrefs } from './ssr-model';
export type { OperationGroupId, OperationId } from './operations';
export {
  draftChangeLines,
  draftPanel,
  inspectPanel,
  requestPanel,
  resourceChangeLines,
  resourcePanel,
} from './panels';
export type {
  CacheLine,
  ChangeLine,
  DraftPanel,
  InspectPanel,
  MutationLine,
  RequestPanel,
  ResourcePanel,
} from './panels';
export type {
  Contact,
  Office,
  Profile,
  ReadOutcome,
  RequestKind,
  RequestRecord,
  SaveAddressDto,
  SaveAddressResponse,
  WriteOutcome,
} from './types';
