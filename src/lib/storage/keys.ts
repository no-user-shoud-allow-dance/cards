/**
 * The central storage map: every database, object store, record prefix and
 * key the app uses in IndexedDB, localStorage and sessionStorage is defined
 * exactly once, here. Nothing above or beside this file may hard-code a
 * storage key — import the map instead. Pure constants and pure key
 * builders (no DOM access), so any layer may import it without cycles.
 */

export const STORAGE = {
    /** IndexedDB: one database, one object store for the deck records. */
    indexeddb: {
        dbName: "kk",
        dbVersion: 1,
        stores: { decks: "decks" },
    },
    /** localStorage keys (used when the "small"/"large" engine picks localStorage). */
    localStorage: {
        settings: "kk-settings",
        folders: "kk-folders",
        persistenceProbe: "kk-__probe__-persistence",
        /**
         * Run-once marker of the 1.0.0 → 2.0.0 data migration: the boot
         * gate reads it synchronously (before hydration) to decide
         * whether to bounce to /migrate. Deliberately NOT wiped by the
         * account reset — a fresh start must not resurrect v1 progress.
         */
        v1Migration: "kk-v1-migration",
    },
    /** sessionStorage keys (tab-scoped hand-offs and one-shot flags). */
    sessionStorage: {
        importHandoff: "kk-import",
        draftDeck: "kk-draft-deck",
        sampleDialogDismissed: "kk-sample-dialog-dismissed",
    },
    /** Transient probe key of the engine capability detection; never persisted. */
    engineProbe: "kk-__probe__",
    /** Prefixes of the versioned records inside whichever engine holds them. */
    recordPrefix: {
        deck: "kk-deck:",
        state: "kk-state:",
        /** Quarantined corrupt records, preserved for manual recovery. */
        recovery: "kk-recovery:",
    },
} as const;

/** Record key of one deck (slug) inside the records engine. */
export function deckRecordKey(slug: string): string {
    return STORAGE.recordPrefix.deck + slug;
}

/**
 * Record key of one deck's learning state (deck slug) inside the records
 * engine. Legacy records were keyed by deck hash — see the state
 * repository for the one-off migration.
 */
export function stateRecordKey(slug: string): string {
    return STORAGE.recordPrefix.state + slug;
}

/** Recovery key of one quarantined corrupt record (`recovery:<uuid>`). */
export function recoveryRecordKey(uuid: string): string {
    return STORAGE.recordPrefix.recovery + uuid;
}

/** True when a localStorage key belongs to this app (known keys + record prefixes). */
export function isAppLocalKey(key: string): boolean {
    return (
        key === STORAGE.localStorage.settings ||
        key === STORAGE.localStorage.folders ||
        key === STORAGE.localStorage.persistenceProbe ||
        key === STORAGE.localStorage.v1Migration ||
        key.startsWith(STORAGE.recordPrefix.deck) ||
        key.startsWith(STORAGE.recordPrefix.state) ||
        key.startsWith(STORAGE.recordPrefix.recovery)
    );
}

/** All sessionStorage keys of the app (for a targeted clear instead of clear()). */
export const SESSION_KEYS: readonly string[] = Object.values(STORAGE.sessionStorage);
