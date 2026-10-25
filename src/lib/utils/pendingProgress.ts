import { cardStore } from "../store/store.svelte";
import { studyTimeStore } from "../store/studyTimeStore.svelte";
import { userDecks } from "../store/userDecks.svelte";
import type { CardStates } from "./types";
import type { ProgressSharePayload } from "./share";

/**
 * Deck and progress are shared as two separate links, so a progress link
 * can arrive before the deck itself. Pending progress is stashed in
 * localStorage keyed by content hash and applied as soon as a deck with
 * that hash exists — on share-import, on upload, and when the home page
 * mounts. Syncing is stateless: nothing ever leaves the device except
 * the links the user shares themselves.
 */

const STORAGE_KEY = "kk_pending_progress";
/** Pending progress expires after a week. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface StoredPendingProgress extends ProgressSharePayload {
    storedAt: number;
}

function readAll(): Record<string, StoredPendingProgress> {
    if (typeof window === "undefined") return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return {};
        const now = Date.now();
        const entries = Object.entries(
            parsed as Record<string, StoredPendingProgress>,
        ).filter(
            ([, value]) =>
                value &&
                typeof value.storedAt === "number" &&
                now - value.storedAt < MAX_AGE_MS,
        );
        return Object.fromEntries(entries);
    } catch {
        return {};
    }
}

function writeAll(entries: Record<string, StoredPendingProgress>): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** Stashes progress for a deck that is not stored locally yet. */
export function stashPendingProgress(progress: ProgressSharePayload): void {
    const entries = readAll();
    entries[progress.hash] = { ...progress, storedAt: Date.now() };
    writeAll(entries);
}

/**
 * Applies a progress payload to a deck: per-card boxes (positional, so
 * the deck must match the hash), the overview flag, and the study time.
 */
export function applyProgress(
    slug: string,
    cardCount: number,
    progress: ProgressSharePayload,
): void {
    const states: CardStates = {};
    const count = Math.min(progress.boxes.length, cardCount);
    for (let i = 0; i < count; i++) {
        const box = progress.boxes[i];
        if (box <= 0) continue;
        states[`${slug}/${i}`] = { box, lastSeen: Date.now() };
    }
    cardStore.mergeProgress(states);
    if (progress.overviewDone) cardStore.markOverviewDone(slug);
    if (progress.studyTimeMs > 0) {
        studyTimeStore.set(
            slug,
            Math.max(studyTimeStore.get(slug), progress.studyTimeMs),
        );
    }
}

/**
 * Applies and clears the pending progress for a hash, if a deck with
 * that hash is stored. Returns whether progress was applied.
 */
export async function applyPendingProgressFor(
    hash: string,
): Promise<boolean> {
    const entries = readAll();
    const pending = entries[hash];
    if (!pending) return false;
    const deck = await userDecks.findByHash(hash);
    if (!deck) return false;
    const loaded = userDecks.load(deck.slug);
    applyProgress(deck.slug, loaded?.cards.length ?? 0, pending);
    delete entries[hash];
    writeAll(entries);
    return true;
}

/** Applies all pending progress entries whose decks now exist. */
export async function applyAllPendingProgress(): Promise<void> {
    for (const hash of Object.keys(readAll())) {
        await applyPendingProgressFor(hash);
    }
}
