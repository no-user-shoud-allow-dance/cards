import type { DeckHash } from "#lib/core/deck/hash";
import { isDeckHash } from "#lib/core/deck/hash";
import { isSlug, parseFolderName, type FolderName, type Slug } from "#lib/core/deck/identity";
import type { CardState, DeckState } from "#lib/core/learning/state";
import { BOX_COUNT, makeBox } from "#lib/core/learning/leitner";
import { cardIdFromString, isCardId, type CardId } from "#lib/core/deck/ids";
import { makeEpochMs } from "#lib/core/primitives";
import { smallEngine } from "#lib/storage/detect";
import { stashForRecovery, writeJson, type KeyValueEngine } from "#lib/storage/engine";
import { stateRecordKey, STORAGE } from "#lib/storage/keys";

/**
 * Learning-state repository — one record per deck slug under
 * kk-state:<slug> (the record is the DeckState itself, JSON-serialized,
 * study time and the deck's folders included; the DeckState's
 * `deckHash` stays the content
 * fingerprint for the sync merge, only the key is the slug, so progress
 * survives deck edits). Small and written on every answer, so the
 * repository picks a small engine itself. The state layer updates
 * exactly one CardState entry per answer, never whole arrays.
 *
 * Legacy records (pre-slug keys) lived under kk-state:<hash>; they are
 * adopted per deck (adoptLegacy) or dropped wholesale (listLegacy +
 * removeLegacy in clearAll).
 */

export interface StateRepository {
    get(slug: Slug): Promise<DeckState | null>;
    put(slug: Slug, state: DeckState): Promise<void>;
    list(): Promise<Slug[]>;
    remove(slug: Slug): Promise<void>;
    /** One-off migration: re-keys one legacy kk-state:<hash> record under the deck's slug, deleting the legacy key. */
    adoptLegacy(hash: DeckHash, slug: Slug): Promise<DeckState | null>;
    /** Legacy (hash-keyed) records still present — orphans of deleted/edited decks. */
    listLegacy(): Promise<DeckHash[]>;
    removeLegacy(hash: DeckHash): Promise<void>;
}

type StateRecord = DeckState;

function isStateRecord(value: unknown): value is StateRecord {
    if (typeof value !== "object" || value === null) return false;
    const s = value as Record<string, unknown>;
    return (
        typeof s.deckHash === "string" &&
        isDeckHash(s.deckHash) &&
        Number.isInteger(s.updatedAt) &&
        Number.isInteger(s.streak) &&
        // studyTime is newer than the record format: absent means 0.
        (s.studyTime === undefined || typeof s.studyTime === "number") &&
        // A deck that was never assigned folders has none on record —
        // readers fall back to the default folder.
        (s.folders === undefined ||
            (Array.isArray(s.folders) && s.folders.every((f) => typeof f === "string"))) &&
        // Same story as folders: an absent pure-mode override follows
        // the global settings default.
        (s.pureMode === undefined || typeof s.pureMode === "boolean") &&
        typeof s.cards === "object" &&
        s.cards !== null
    );
}

/** Re-validates a persisted record into branded types (edges → branded). */
function reviveDeckState(record: StateRecord): DeckState {
    const cards: Record<string, CardState> = {};
    for (const [id, raw] of Object.entries(record.cards)) {
        if (!isCardId(id) || typeof raw !== "object" || raw === null) continue;
        const c = raw as unknown as Record<string, unknown>;
        if (typeof c.box !== "number" || !Number.isInteger(c.box) || c.box < 0 || c.box > BOX_COUNT)
            continue;
        if (typeof c.lapses !== "number" || !Number.isInteger(c.lapses)) continue;
        cards[id] = {
            cardId: cardIdFromString(id),
            box: makeBox(c.box as number),
            lapses: c.lapses as number,
            lastReviewed: typeof c.lastReviewed === "number" ? makeEpochMs(c.lastReviewed) : null,
            overviewDone: c.overviewDone === true,
        };
    }
    return {
        deckHash: record.deckHash,
        updatedAt: makeEpochMs(record.updatedAt as number),
        streak: record.streak as number,
        studyTime: typeof record.studyTime === "number" ? record.studyTime : 0,
        folders: reviveFolders(record.folders),
        pureMode: typeof record.pureMode === "boolean" ? record.pureMode : undefined,
        cards: cards as Record<CardId, CardState>,
    };
}

/**
 * Folders of a state record (kk-state) may hold anything historical —
 * invalid names are dropped, order kept. Absent stays absent: the deck
 * was never assigned folders and readers fall back to the default.
 */
function reviveFolders(raw: unknown): FolderName[] | undefined {
    if (!Array.isArray(raw)) return undefined;
    const folders: FolderName[] = [];
    for (const name of raw) {
        try {
            folders.push(parseFolderName(String(name), { allowSpecial: true }));
        } catch {
            // A name that no longer validates is dropped, not fatal.
        }
    }
    return folders;
}

/**
 * Reads and validates one state record. A corrupt record is quarantined
 * to `recovery:<uuid>` (raw value preserved, original key deleted)
 * instead of breaking the whole state load.
 */
async function readRecord(engine: KeyValueEngine, key: string): Promise<DeckState | null> {
    const raw = await engine.get(key);
    if (raw === null) return null;
    let value: unknown;
    try {
        value = JSON.parse(raw);
    } catch {
        value = null;
    }
    if (!isStateRecord(value)) {
        await stashForRecovery(engine, key, raw);
        return null;
    }
    try {
        return reviveDeckState(value);
    } catch {
        await stashForRecovery(engine, key, raw);
        return null;
    }
}

/** State is written on every answer, so the repository picks a small engine itself. */
export async function createStateRepository(): Promise<StateRepository> {
    const engine = await smallEngine();
    const stateKeys = async (): Promise<string[]> => {
        const keys = await engine.keys();
        return keys.filter((k) => k.startsWith(STORAGE.recordPrefix.state));
    };
    return {
        async get(slug) {
            return readRecord(engine, stateRecordKey(slug));
        },
        async put(slug, state) {
            await writeJson(engine, stateRecordKey(slug), state);
        },
        async list() {
            const suffixes = (await stateKeys()).map((k) =>
                k.slice(STORAGE.recordPrefix.state.length)
            );
            return suffixes.filter(isSlug) as Slug[];
        },
        async remove(slug) {
            await engine.delete(stateRecordKey(slug));
        },
        async adoptLegacy(hash, slug) {
            const legacy = await readRecord(engine, stateRecordKey(hash));
            if (legacy === null) return null;
            // A slug-keyed record always wins: the deck was already used
            // with the new keying, the legacy copy is stale.
            const existing = await engine.get(stateRecordKey(slug));
            if (existing === null) {
                await writeJson(engine, stateRecordKey(slug), legacy);
            }
            await engine.delete(stateRecordKey(hash));
            return legacy;
        },
        async listLegacy() {
            const suffixes = (await stateKeys()).map((k) =>
                k.slice(STORAGE.recordPrefix.state.length)
            );
            return suffixes.filter(isDeckHash) as DeckHash[];
        },
        async removeLegacy(hash) {
            await engine.delete(stateRecordKey(hash));
        },
    };
}
