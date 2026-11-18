import type { DeckDocument } from "#lib/core/deck/document";
import { hashDeckContent } from "#lib/core/deck/hash";
import { isSlug, makeSlug, randomSlugSuffix, type Slug } from "#lib/core/deck/identity";
import { parse, type RawMarkdown } from "#lib/core/deck/parse";
import { serialize, serializeCard } from "#lib/core/deck/serialize";
import { makeEpochMs, nowEpochMs, type EpochMs } from "#lib/core/primitives";
import { largeEngine } from "#lib/storage/detect";
import { stashForRecovery, writeJson, type KeyValueEngine } from "#lib/storage/engine";
import { deckRecordKey, STORAGE } from "#lib/storage/keys";
import {
    isStorageRecord,
    makeDeckSlug,
    rawToPayload,
    recordToRaw,
    type StorageRecord,
} from "#lib/storage/schema";

/**
 * Deck repository — the L0↔L1 boundary for decks. get/put convert via
 * core parse/serialize and store gzipped markdown under kk-deck:<slug>
 * (record contract in storage/schema.ts). Content only: a deck's
 * folders persist in its learning-state record (kk-state), never in
 * the deck record. getRaw/putRaw are the single markdown exception
 * (editor only). Nothing above this file sees markdown or the record
 * format.
 */

export interface DeckEntry {
    slug: Slug;
    createdAt: EpochMs;
    doc: DeckDocument;
}

export interface DeckRepository {
    list(): Promise<DeckEntry[]>;
    /** Returns the L1 domain model — never raw markdown. */
    get(slug: Slug): Promise<DeckDocument | null>;
    put(entry: DeckEntry): Promise<void>;
    remove(slug: Slug): Promise<void>;
    /**
     * The single defined markdown exception, for the editor only:
     * `getRaw`/`putRaw` are unique in the codebase so the exception stays
     * traceable and doesn't spread.
     */
    getRaw(slug: Slug): Promise<RawMarkdown | null>;
    putRaw(slug: Slug, raw: RawMarkdown): Promise<void>;
}

/**
 * Reads one deck record's envelope; null when missing. A record whose
 * JSON/shape is invalid is quarantined to `recovery:<uuid>` (raw value
 * preserved, original key deleted) so one corrupt record never breaks
 * loading — and stays recoverable.
 */
async function readRecordAt(engine: KeyValueEngine, slug: Slug): Promise<StorageRecord | null> {
    const key = deckRecordKey(slug);
    const raw = await engine.get(key);
    if (raw === null) return null;
    let value: unknown;
    try {
        value = JSON.parse(raw);
    } catch {
        value = null;
    }
    if (!isStorageRecord(value)) {
        await stashForRecovery(engine, key, raw);
        return null;
    }
    return value;
}

/** Decodes a record into an entry; payload/parse failure → quarantine + null. */
async function entryFromRecord(
    engine: KeyValueEngine,
    slug: Slug,
    record: StorageRecord
): Promise<DeckEntry | null> {
    try {
        const raw = await recordToRaw(record);
        const doc = parse(raw);
        return {
            slug: slugFromString(record.slug),
            createdAt: makeEpochMs(record.createdAt),
            doc,
        };
    } catch {
        await stashForRecovery(engine, deckRecordKey(slug), JSON.stringify(record));
        return null;
    }
}

async function listEntries(engine: KeyValueEngine): Promise<DeckEntry[]> {
    const out: DeckEntry[] = [];
    for (const key of await engine.keys()) {
        if (!key.startsWith(STORAGE.recordPrefix.deck)) continue;
        const slugText = key.slice(STORAGE.recordPrefix.deck.length);
        if (!isSlug(slugText)) {
            // A malformed deck key: preserve the raw value, drop the key.
            const raw = await engine.get(key);
            if (raw !== null) await stashForRecovery(engine, key, raw);
            continue;
        }
        const slug = slugFromString(slugText);
        const record = await readRecordAt(engine, slug);
        if (!record) continue;
        const entry = await entryFromRecord(engine, slug, record);
        if (entry) out.push(entry);
    }
    return out;
}

async function putEntry(engine: KeyValueEngine, entry: DeckEntry): Promise<void> {
    // Content only — folders are owned by kk-state (learning state).
    await writeJson(engine, deckRecordKey(entry.slug), {
        slug: entry.slug,
        createdAt: entry.createdAt,
        payload: await rawToPayload(serialize(entry.doc)),
    });
}

async function putRawAt(engine: KeyValueEngine, slug: Slug, raw: RawMarkdown): Promise<void> {
    const existing = await readRecordAt(engine, slug);
    await writeJson(engine, deckRecordKey(slug), {
        slug,
        createdAt: existing?.createdAt ?? nowEpochMs(),
        payload: await rawToPayload(raw),
    });
}

/** Decks are large payloads, so the repository picks a large engine itself. */
export async function createDeckRepository(): Promise<DeckRepository> {
    const engine = await largeEngine();
    return {
        list: () => listEntries(engine),
        async get(slug) {
            const record = await readRecordAt(engine, slug);
            if (!record) return null;
            const entry = await entryFromRecord(engine, slug, record);
            return entry ? entry.doc : null;
        },
        put: (entry) => putEntry(engine, entry),
        remove: (slug) => engine.delete(deckRecordKey(slug)),
        async getRaw(slug) {
            const record = await readRecordAt(engine, slug);
            if (!record) return null;
            try {
                return await recordToRaw(record);
            } catch {
                await stashForRecovery(engine, deckRecordKey(slug), JSON.stringify(record));
                return null;
            }
        },
        putRaw: (slug, raw) => putRawAt(engine, slug, raw),
    };
}

function slugFromString(value: string): Slug {
    return makeSlug(value.slice(0, 16), value.slice(17));
}

/** Convenience: builds a fresh content-only DeckEntry for a parsed document. */
export function makeDeckEntry(
    doc: ReturnType<typeof parse>,
    now: EpochMs = nowEpochMs(),
    random: () => number = Math.random
): DeckEntry {
    return {
        slug: makeDeckSlug(hashDeckContent(doc, serializeCard), random),
        createdAt: now,
        doc,
    };
}

export { randomSlugSuffix };
