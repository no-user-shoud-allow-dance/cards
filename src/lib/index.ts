/**
 * The public barrel: the ONLY import surface for routes. Everything the
 * app exposes goes through here — routes never import lib subpaths.
 */

// ── Domain core (namespaced) + the shared constants/types the UI uses ─
export * as core from "#lib/core/index";
export { BOX_COUNT, BOX_ROMANS } from "#lib/core/learning/leitner";
export type { Box } from "#lib/core/learning/leitner";
// NOTE: the core `Card` type is deliberately NOT re-exported flat — it would
// clash with the `Card` component in `#components`. Import it via `core.Card`
// or the core subpath instead.
export type {
    CardImage,
    DeckDocument,
    DeckType,
    Span,
    Style,
    StyledText,
} from "#lib/core/deck/document";
export type { CardId } from "#lib/core/deck/ids";
export type { DeckHash } from "#lib/core/deck/hash";

export * as messages from "#messages/locale.svelte";

// ── Storage mechanics (capability layer, engine-blind above this) ──
export { largeEngine, smallEngine } from "#lib/storage/detect";
export type { EngineKind, KeyValueEngine } from "#lib/storage/engine";
export { detectImpersistentStorage } from "#lib/storage/impersistent";
export {
    STORAGE,
    SESSION_KEYS,
    deckRecordKey,
    stateRecordKey,
    isAppLocalKey,
} from "#lib/storage/keys";
export { readDraftDeck, stashDraftDeck } from "#lib/storage/draftDeck";
export type { DraftDeck } from "#lib/storage/draftDeck";

// ── Repositories (one per aggregate, self-contained) ───────────────
// Interface convention: get / list / put / remove (+ passthroughs).
export { createDeckRepository, makeDeckEntry } from "#lib/repositories/decksRepository";
export type { DeckEntry, DeckRepository } from "#lib/repositories/decksRepository";
export { createStateRepository } from "#lib/repositories/stateRepository";
export type { StateRepository } from "#lib/repositories/stateRepository";
export {
    createSettingsRepository,
    defaultPrintOptionsRecord,
    defaultSettings,
    normalizePrintOptions,
} from "#lib/repositories/settingsRepository";
export type {
    PrintOptionsRecord,
    Settings,
    SettingsRepository,
    Theme,
} from "#lib/repositories/settingsRepository";
export {
    createFoldersRepository,
    normalizeFolderStates,
} from "#lib/repositories/foldersRepository";
export type { FolderState, FoldersRepository } from "#lib/repositories/foldersRepository";
// NOTE: ./server/kv is server-only ($lib/server) and deliberately NOT
// re-exported here — only +server.ts endpoints may import it directly.

// ── One-shot data migration 1.0.0 → 2.0.0 ───────────────────────────
// Relative specifier on purpose: module ids with dots (…-v1.0.0-…)
// do not resolve through the #lib/* alias mapping.
export { hasV1Data, migrateV1ToV2 } from "./migration-v1.0.0-v2.0.0";
export type {
    V1toV2DeckOutcome,
    V1toV2DeckReport,
    V1toV2Report,
    V1toV2SettingsOutcome,
} from "./migration-v1.0.0-v2.0.0";

// ── State (stores) ──────────────────────────────────────────────
// NOTE: `deckStore` and `learningStore` are deliberately NOT exported
// here — they are storage internals. The UI works on compiled deck
// views (components/model: the `decks` facade + deckView), never on
// stores or records. The barrel is routes' ONLY lib import surface.
export { settingsStore } from "#lib/state/settings.svelte";
export { foldersStore } from "#lib/state/folders.svelte";
// NOTE: the `Toast`/`Dialog` types are not re-exported flat — they would clash
// with the components of the same name in `#components`. Import them from the
// state subpaths instead.
export { toastStore } from "#lib/state/toasts.svelte";
export type { ToastKind, ToastOptions } from "#lib/state/toasts.svelte";
export { dialogStore } from "#lib/state/dialog.svelte";
export type { DialogOptions, DialogType } from "#lib/state/dialog.svelte";

// ── Utils (non-view) ───────────────────────────────────────────────
export * from "#lib/sync/share.ts";
export * from "#lib/sync/serverShare.ts";
export * from "#lib/utils/transitions";

// ── Sync ───────────────────────────────────────────────────────────
export { syncStore } from "#lib/sync/store.svelte";
export type { SyncStatus } from "#lib/sync/store.svelte";
export {
    hostSync,
    joinSync,
    makePeerId,
    generatePeerId,
    normalizePeerId,
    type PeerId,
} from "#lib/sync/peer";
export {
    buildProgressBody,
    progressBodyToState,
    buildTogetherBody,
    decodeTogetherBody,
    encodeFullSync,
    decodeFullSync,
} from "#lib/sync/protocol";
export type { DecodedTogether, FullSyncItem } from "#lib/sync/protocol";
export { mergeSyncItems, applyRemoteDecks, localHash } from "#lib/sync/merge";
