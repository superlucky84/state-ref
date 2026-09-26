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
  CARD_FIELDS,
  CARD_TITLE,
  CARDS_ON_LOAD,
  FIELD_LABEL,
  REQUEST_CELLS,
  REQUEST_ROW_ATTR,
  label,
  show,
} from './fields';
export type { CardId, FieldId, RequestCell } from './fields';
export {
  CITY,
  INITIAL_PROFILE,
  removeOffice,
  reorderContacts,
  toSaveDto,
  withMemo,
} from './scenario';
export {
  AUTO_REFETCH,
  PANEL_KEY,
  QUERY_RETRY,
  READING_QUERIES,
  READONLY_KEY,
  createDemoModel,
  keyText,
} from './model';
export type { ComputedSource, DemoModel, DemoUi, DraftPair } from './model';
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
  requestPanel,
  resourceChangeLines,
  resourcePanel,
} from './panels';
export type {
  ChangeLine,
  DraftPanel,
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
