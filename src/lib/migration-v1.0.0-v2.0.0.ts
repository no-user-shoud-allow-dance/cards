/**
 * One-shot data migration: NSC 1.0.0 → 2.0.0.
 *
 * 1.0.0 stored decks in the IndexedDB database `nsc-user-decks` (raw
 * records keyed by a SHA-256 content-hash slug, name/folder/deckType as
 * separate fields) and everything else under localStorage `kk_*` keys
 * (per-card states keyed `<slug>/<index>`, overview completion, study
 * time, settings, countdown timers). 2.0.0 stores gzipped deck records
 * and slug-keyed DeckState records via the repositories
 * (storage/schema.ts, storage/keys.ts) and one `kk-settings` record.
 *
 * Design rules:
 * - **Non-destructive.** The script only reads 1.0.0 storage and never
 *   deletes or rewrites a v1 record. Users can roll back by returning to
 *   1.0.0 (or clearing the 2.0.0 data).
 * - **Idempotent.** Decks are deduplicated by their 2.0.0 content hash,
 *   existing 2.0.0 state/settings records are never overwritten — a
 *   second run is a no-op.
 * - **Conservative.** A deck whose markdown the 2.0.0 parser rejects is
 *   skipped (reported with the parse-error code), together with its
 *   progress — nothing is half-migrated.
 *
 * Run it via `migrateV1Once()`: the root layout bounces browsers with
 * pending v1 data to /migrate before anything initializes (see
 * routes/+layout.svelte's module script and routes/migrate), the page
 * runs the migration there and bounces back — the stores then load the
 * migrated records as if they had always been 2.0.0 data. The v1 card
 * identity `<slug>/<index>` is remapped to the 2.0.0 content-hash
 * CardId through the re-parsed document; boxes carry
 * over 1:1 (both versions run the same six-box Leitner system, default
 * box 1). v1 `overview_done` was deck-level, so it sets `overviewDone`
 * on every card of that deck. The v1 folder becomes the deck's single
 * kk-state folder. `kk_timer_state` has no 2.0.0 equivalent (the
 * countdown timer was removed) and is only counted in the report.
 */

import { hashDeckContent, type DeckHash } from "#lib/core/deck/hash";
import {
    FOLDER_DEFAULT,
    parseFolderName,
    TITLE_MAX_LENGTH,
    type FolderName,
} from "#lib/core/deck/identity";
import type { CardId } from "#lib/core/deck/ids";
import { makeRawMarkdown, parse, validate, type RawMarkdown } from "#lib/core/deck/parse";
import { serializeCard } from "#lib/core/deck/serialize";
import { makeBox, BOX_COUNT } from "#lib/core/learning/leitner";
import { newCardState, type CardState, type DeckState } from "#lib/core/learning/state";
import { makeEpochMs } from "#lib/core/primitives";
import {
    createDeckRepository,
    makeDeckEntry,
    type DeckEntry,
    type DeckRepository,
} from "#lib/repositories/decksRepository";
import { createStateRepository, type StateRepository } from "#lib/repositories/stateRepository";
import { createSettingsRepository, defaultSettings } from "#lib/repositories/settingsRepository";
import { smallEngine } from "#lib/storage/detect";
import { readJson } from "#lib/storage/engine";
import { STORAGE } from "#lib/storage/keys";

// ── The 1.0.0 contract, frozen history ──────────────────────────────
// v1 key literals live HERE and nowhere else: keys.ts is the 2.0.0 map
// and must not know retired versions. These constants are read-only.

const V1 = {
    keys: {
        states: "kk_states",
        overviewDone: "kk_overview_done",
        studyTime: "kk_study_time",
        pure: "kk_pure",
        mistralApiKey: "kk_mistral_api_key",
        privacyToastDismissed: "kk_privacy_toast_dismissed",
        impersistentToastDismissed: "kk_impersistent_toast_dismissed",
        timerState: "kk_timer_state",
    },
    indexeddb: { dbName: "nsc-user-decks", dbVersion: 1, storeName: "decks" },
} as const;

/** Title written when a v1 deck's markdown has no `# ` heading. */
const V1_FALLBACK_TITLE = "Unbenannter Stapel";

interface V1DeckRecord {
    slug: string;
    name: string;
    folder: string;
    deckType: "english" | "latin" | "greek";
    raw: string;
    createdAt: number;
}

interface V1CardEntry {
    box: number;
    lastSeen: number;
}

function isV1DeckRecord(value: unknown): value is V1DeckRecord {
    if (typeof value !== "object" || value === null) return false;
    const r = value as Record<string, unknown>;
    return (
        typeof r.slug === "string" &&
        typeof r.name === "string" &&
        typeof r.folder === "string" &&
        typeof r.raw === "string" &&
        Number.isInteger(r.createdAt) &&
        (r.deckType === "english" || r.deckType === "latin" || r.deckType === "greek")
    );
}

function isV1CardEntry(value: unknown): value is V1CardEntry {
    if (typeof value !== "object" || value === null) return false;
    const r = value as Record<string, unknown>;
    return typeof r.box === "number" && typeof r.lastSeen === "number";
}

// ── Report (machine-readable; user wording lives in the messages) ──

export type V1toV2DeckOutcome = "migrated" | "adopted" | "duplicate" | "failed";
export type V1toV2SettingsOutcome = "migrated" | "kept" | "none";

/** Per-deck outcome. `reason` carries the NscError code on failure. */
export interface V1toV2DeckReport {
    sourceSlug: string;
    name: string;
    targetSlug: string | null;
    outcome: V1toV2DeckOutcome;
    reason: string | null;
    /** v1 card entries whose progress was written into the target record. */
    cardStates: number;
}

export interface V1toV2Report {
    decks: V1toV2DeckReport[];
    settings: V1toV2SettingsOutcome;
    /** v1 card entries of decks that did not migrate (still in v1 storage). */
    orphanedCardStates: number;
    /** v1 countdown timers; the feature was removed in 2.0.0. */
    droppedTimers: number;
}

// ── v1 localStorage readers (booleans were "true"/"false" strings) ──

function readLocalJson(key: string): unknown {
    if (typeof localStorage === "undefined") return null;
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? null : (JSON.parse(raw) as unknown);
    } catch {
        return null;
    }
}

function readLocalFlag(key: string): boolean | null {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(key);
    return raw === null ? null : raw === "true";
}

/** Reads a JSON object key; missing, invalid and scalar values yield an empty object. */
function readLocalObject(key: string): Record<string, unknown> {
    const parsed = readLocalJson(key);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
}

/** Cheap sync probe: is there any 1.0.0 data at all? (v1 wrote these keys on every visit.) */
export function hasV1Data(): boolean {
    return Object.values(V1.keys).some((key) => {
        try {
            return typeof localStorage !== "undefined" && localStorage.getItem(key) !== null;
        } catch {
            return false;
        }
    });
}

// ── Run-once gate (boot redirect on /migrate) ──────────────────────

/**
 * Whether the run-once marker is set. Read synchronously and directly:
 * the boot gate decides in the root layout's module script, before the
 * component tree (and any async engine) exists. Whenever localStorage
 * is unavailable, hasV1Data() is false too, so the gate stays closed
 * and no loop is possible.
 */
function v1MigrationMarked(): boolean {
    try {
        return (
            typeof localStorage !== "undefined" &&
            localStorage.getItem(STORAGE.localStorage.v1Migration) !== null
        );
    } catch {
        return false;
    }
}

/**
 * The boot gate: 1.0.0 data exists and has not been migrated yet —
 * the browser should bounce to /migrate before anything initializes.
 */
export function v1MigrationPending(): boolean {
    return hasV1Data() && !v1MigrationMarked();
}

let once: Promise<void> | null = null;

/**
 * Runs the pending migration exactly once per browser: the first call
 * migrates (the run itself is idempotent per record) and writes the
 * marker either way — even on failure, so the boot gate can never
 * bounce into a loop; a failed run leaves all v1 records intact.
 * Rejections propagate to the caller (the /migrate page explains).
 */
export function migrateV1Once(): Promise<void> {
    once ??= (async () => {
        if (!v1MigrationPending()) return;
        try {
            await migrateV1ToV2();
        } finally {
            const engine = await smallEngine();
            await engine.set(STORAGE.localStorage.v1Migration, "1");
        }
    })();
    return once;
}

// ── v1 IndexedDB reader (read-only, creates nothing) ────────────────

/**
 * Reads all raw v1 deck records; the caller shape-checks (so malformed
 * records still surface as failures in the report instead of vanishing
 * inside this reader).
 */
function readV1Decks(): Promise<unknown[]> {
    return new Promise((resolve) => {
        if (typeof indexedDB === "undefined") return resolve([]);
        let settled = false;
        const done = (records: unknown[]): void => {
            if (!settled) {
                settled = true;
                resolve(records);
            }
        };
        let request: IDBOpenDBRequest;
        try {
            request = indexedDB.open(V1.indexeddb.dbName, V1.indexeddb.dbVersion);
        } catch {
            return done([]);
        }
        request.onsuccess = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(V1.indexeddb.storeName)) {
                db.close();
                return done([]);
            }
            void readAllFrom(db).then((records) => done(records));
        };
        // A missing database is opened as an empty one — an upgrade fires
        // exactly then, and aborting rolls the empty creation back.
        request.onupgradeneeded = () => {
            request.transaction?.abort();
        };
        request.onerror = () => done([]);
    });
}

/** All values of the v1 deck store; [] on any read failure. */
function readAllFrom(db: IDBDatabase): Promise<unknown[]> {
    return new Promise((resolve) => {
        const query = db
            .transaction(V1.indexeddb.storeName, "readonly")
            .objectStore(V1.indexeddb.storeName)
            .getAll();
        query.onsuccess = () => {
            db.close();
            resolve((query.result as unknown[]) ?? []);
        };
        query.onerror = () => {
            db.close();
            resolve([]);
        };
    });
}

// ── Source markdown: v1 raw → 2.0.0 deck format ──────────────────────

/** Collapsed, non-empty, ≤ TITLE_MAX_LENGTH (parseDeckTitle's invariants). */
function titleFromV1Name(name: string): string {
    const collapsed = name.trim().replace(/\s+/g, " ");
    if (collapsed.length === 0) return V1_FALLBACK_TITLE;
    return collapsed.length > TITLE_MAX_LENGTH ? collapsed.slice(0, TITLE_MAX_LENGTH) : collapsed;
}

/**
 * Builds the 2.0.0 source of one deck: the v1 deckType as frontmatter
 * (2.0.0 would otherwise re-guess it from the card fronts) and the v1
 * name as the `# ` title when the raw has none — the 2.0.0 parser
 * rejects decks without a heading.
 */
export function buildV1Source(
    raw: string,
    name: string,
    deckType: V1DeckRecord["deckType"]
): RawMarkdown {
    const lines = raw.split(/\r?\n/);
    let first = 0;
    while (first < lines.length && lines[first]!.trim().length === 0) first++;
    // Same title rule as both parsers: only a leading `# ` counts.
    const body =
        first < lines.length && lines[first]!.startsWith("# ")
            ? raw
            : `# ${titleFromV1Name(name)}\n${raw}`;
    return makeRawMarkdown(`---\ntype: ${deckType}\n---\n${body}`);
}

// ── v1 progress grouping ────────────────────────────────────────────

/** `<slug>/<index>` states grouped per v1 deck slug, index order kept. */
export function groupV1States(
    states: Record<string, unknown>
): Map<string, Map<number, V1CardEntry>> {
    const out = new Map<string, Map<number, V1CardEntry>>();
    for (const [key, value] of Object.entries(states)) {
        if (!isV1CardEntry(value)) continue;
        const split = key.lastIndexOf("/");
        if (split === -1) continue;
        const index = Number.parseInt(key.slice(split + 1), 10);
        if (!Number.isInteger(index) || index < 0) continue;
        const slug = key.slice(0, split);
        const group = out.get(slug) ?? new Map<number, V1CardEntry>();
        group.set(index, value);
        out.set(slug, group);
    }
    return out;
}

// ── Settings ────────────────────────────────────────────────────────

/**
 * Merges the v1 settings flags into `kk-settings` — only when no 2.0.0
 * record exists yet (a record means the user already decided here);
 * "none" when the v1 keys are absent (fresh browser).
 */
async function migrateSettings(): Promise<V1toV2SettingsOutcome> {
    const engine = await smallEngine();
    if ((await readJson(engine, STORAGE.localStorage.settings)) !== null) return "kept";
    const pure = readLocalFlag(V1.keys.pure);
    const privacy = readLocalFlag(V1.keys.privacyToastDismissed);
    const impersistent = readLocalFlag(V1.keys.impersistentToastDismissed);
    const mistral = readLocalJson(V1.keys.mistralApiKey);
    if (pure === null && privacy === null && impersistent === null && mistral === null) {
        return "none";
    }
    const settings = defaultSettings();
    if (pure !== null) settings.pureMode = pure;
    if (privacy !== null) settings.privacyToastDismissed = privacy;
    if (impersistent !== null) settings.impersistentToastDismissed = impersistent;
    if (typeof mistral === "string") settings.mistralApiKey = mistral;
    await (await createSettingsRepository()).put(settings);
    return "migrated";
}

// ── Deck + state migration ───────────────────────────────────────────

/** Per-deck v1 progress, resolved from the grouped localStorage data. */
interface V1Progress {
    cardStates: Map<number, V1CardEntry>;
    overviewDone: boolean;
    studyTime: number;
}

/** The migration's running index of 2.0.0 deck records (content identity). */
interface TargetIndex {
    byHash: Map<DeckHash, DeckEntry>;
}

/** Card-mapping result of one deck's v1 progress. */
interface MappedCards {
    cards: Record<CardId, CardState>;
    mapped: number;
    /** Newest lastReviewed across mapped entries (0 when none). */
    latest: number;
}

/**
 * Maps the v1 `<slug>/<index>` progress onto the entry's content-hash
 * CardIds: an out-of-range index means the deck content diverged from
 * the remembered progress — that entry is dropped, not guessed onto a
 * wrong card. A deck-level v1 overview flag marks every card seen.
 */
function buildStateCards(entry: DeckEntry, progress: V1Progress): MappedCards {
    const cards: Record<CardId, CardState> = {};
    let latest = 0;
    let mapped = 0;
    for (const [index, v1] of progress.cardStates) {
        const card = entry.doc.cards[index];
        if (!card || !Number.isInteger(v1.box) || v1.box < 1 || v1.box > BOX_COUNT) continue;
        const lastReviewed =
            Number.isInteger(v1.lastSeen) && v1.lastSeen >= 0 ? makeEpochMs(v1.lastSeen) : null;
        cards[card.id] = {
            cardId: card.id,
            box: makeBox(v1.box),
            lapses: 0, // v1 did not count lapses
            lastReviewed,
            overviewDone: progress.overviewDone,
        };
        mapped += 1;
        latest = Math.max(latest, lastReviewed ?? 0);
    }
    if (progress.overviewDone) {
        for (const card of entry.doc.cards) {
            cards[card.id] ??= { ...newCardState(card.id, entry.createdAt), overviewDone: true };
        }
    }
    return { cards, mapped, latest };
}

/**
 * Writes one deck's DeckState (kk-state:<slug>): the mapped card
 * progress, the v1 study time and folder. Returns the number of mapped
 * card entries; an existing 2.0.0 state record wins untouched
 * (idempotence).
 */
async function migrateDeckState(
    states: StateRepository,
    entry: DeckEntry,
    hash: DeckHash,
    source: V1DeckRecord,
    progress: V1Progress
): Promise<number> {
    if ((await states.get(entry.slug)) !== null) return 0;
    const { cards, mapped, latest } = buildStateCards(entry, progress);
    const folders = v1Folders(source.folder);
    const record: DeckState = {
        deckHash: hash,
        updatedAt: latest > 0 ? makeEpochMs(latest) : entry.createdAt,
        streak: 0, // v1 did not persist a streak
        studyTime: progress.studyTime,
        folders,
        cards,
    };
    const empty =
        mapped === 0 && !progress.overviewDone && progress.studyTime === 0 && folders === undefined;
    if (!empty) await states.put(entry.slug, record);
    return mapped;
}

/** The v1 folder as a one-element folder list; undefined keeps the default. */
function v1Folders(folder: string): FolderName[] | undefined {
    try {
        const parsed = parseFolderName(folder);
        return parsed === FOLDER_DEFAULT ? undefined : [parsed];
    } catch {
        return undefined;
    }
}

/** Reason code for a v1 record that fails before 2.0.0 parsing exists. */
const INVALID_RECORD = "INVALID_RECORD";
/** Reason code when a 2.0.0 repository write fails (e.g. quota) mid-deck. */
const WRITE_FAILED = "STORAGE_WRITE_FAILED";

function failedReport(source: { slug: string; name: string }, reason: string): V1toV2DeckReport {
    return {
        sourceSlug: source.slug,
        name: source.name,
        targetSlug: null,
        outcome: "failed",
        reason,
        cardStates: 0,
    };
}

/**
 * Migrates one v1 deck record into the 2.0.0 deck repository (plus its
 * learning state). Content already present in 2.0.0 (by content hash)
 * is not duplicated, but its missing progress may still be adopted.
 */
async function migrateV1Deck(
    decks: DeckRepository,
    states: StateRepository,
    targets: TargetIndex,
    record: V1DeckRecord,
    progress: V1Progress
): Promise<V1toV2DeckReport> {
    const source = buildV1Source(record.raw, record.name, record.deckType);
    const errors = validate(source);
    if (errors.length > 0) return failedReport(record, errors[0]!.code);
    const doc = parse(source);
    const hash = hashDeckContent(doc, serializeCard);
    const existing = targets.byHash.get(hash);
    const entry = existing ?? makeDeckEntry(doc, makeEpochMs(record.createdAt));
    if (!existing) {
        await decks.put(entry);
        targets.byHash.set(hash, entry);
    }
    const mapped = await migrateDeckState(states, entry, hash, record, progress);
    return {
        sourceSlug: record.slug,
        name: record.name,
        targetSlug: entry.slug,
        // Content was written ("migrated"), or already existed and the v1
        // progress was adopted into it ("adopted") — or nothing was to do
        // ("duplicate").
        outcome: existing ? (mapped > 0 ? "adopted" : "duplicate") : "migrated",
        reason: null,
        cardStates: mapped,
    };
}

// ── Entry point ─────────────────────────────────────────────────────

/** One deck's v1 progress, resolved from the grouped localStorage reads. */
function progressOf(
    stateGroups: Map<string, Map<number, V1CardEntry>>,
    overviewDone: Record<string, unknown>,
    studyTime: Record<string, unknown>,
    slug: string
): V1Progress {
    return {
        cardStates: stateGroups.get(slug) ?? new Map(),
        overviewDone: overviewDone[slug] === true,
        studyTime: studyTimeOf(studyTime, slug),
    };
}

/**
 * Runs the per-deck migration. One deck's storage failure (e.g. quota)
 * never aborts the rest: the deck is reported as failed and the run
 * continues — a later re-run picks it up again (idempotence).
 */
async function migrateRecords(
    decks: DeckRepository,
    states: StateRepository,
    targets: TargetIndex,
    stateGroups: Map<string, Map<number, V1CardEntry>>,
    overviewDone: Record<string, unknown>,
    studyTime: Record<string, unknown>,
    records: unknown[]
): Promise<{ reports: V1toV2DeckReport[]; handled: Set<string> }> {
    const reports: V1toV2DeckReport[] = [];
    const handled = new Set<string>();
    for (const value of records) {
        if (!isV1DeckRecord(value)) {
            reports.push(failedReport({ slug: slugOf(value), name: "" }, INVALID_RECORD));
            continue;
        }
        const progress = progressOf(stateGroups, overviewDone, studyTime, value.slug);
        try {
            reports.push(await migrateV1Deck(decks, states, targets, value, progress));
            handled.add(value.slug);
        } catch {
            reports.push(failedReport(value, WRITE_FAILED));
        }
    }
    return { reports, handled };
}

/** Best-effort slug extraction of a foreign v1 record, for the report. */
function slugOf(value: unknown): string {
    if (typeof value === "object" && value !== null) {
        const slug = (value as Record<string, unknown>).slug;
        if (typeof slug === "string") return slug;
    }
    return "unknown";
}

/**
 * Runs the whole 1.0.0 → 2.0.0 data migration and returns a
 * machine-readable report (nothing is deleted; a second run is a no-op).
 */
export async function migrateV1ToV2(): Promise<V1toV2Report> {
    const [records, settings] = await Promise.all([readV1Decks(), migrateSettings()]);
    const stateGroups = groupV1States(readLocalObject(V1.keys.states));
    const overviewDone = readLocalObject(V1.keys.overviewDone);
    const studyTime = readLocalObject(V1.keys.studyTime);
    const timerState = readLocalObject(V1.keys.timerState);

    const decks = await createDeckRepository();
    const states = await createStateRepository();
    const targets: TargetIndex = { byHash: new Map() };
    for (const entry of await decks.list()) {
        targets.byHash.set(hashDeckContent(entry.doc, serializeCard), entry);
    }

    const { reports, handled } = await migrateRecords(
        decks,
        states,
        targets,
        stateGroups,
        overviewDone,
        studyTime,
        records
    );
    let orphans = 0;
    for (const [slug, group] of stateGroups) {
        if (!handled.has(slug)) orphans += group.size;
    }
    return {
        decks: reports,
        settings,
        orphanedCardStates: orphans,
        droppedTimers: Object.keys(timerState).length,
    };
}

/** One deck's v1 study time (ms); invalid/absent values count as 0. */
function studyTimeOf(studyTime: Record<string, unknown>, slug: string): number {
    const value = studyTime[slug];
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}
