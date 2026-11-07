import { decks } from "../stores/data/deckStore.svelte";
import { cardStore } from "../stores/persistent/cardStore.svelte";
import { applyProgress } from "../utils/pendingProgress";
import {
    decodeSyncShare,
    encodeSyncShare,
    type SyncPayload,
} from "../utils/share";
import { syncStore } from "./store/syncStore.svelte";
import type { DeckType } from "../types";

/** Shape of one deck record inside the sync payload (subset of Deck). */
interface SyncDeck {
    name: string;
    folder: string;
    deckType: DeckType;
    raw: string;
    contentHash: string;
}

function isSyncDeck(value: unknown): value is SyncDeck {
    if (typeof value !== "object" || value === null) return false;
    const d = value as Record<string, unknown>;
    return (
        typeof d.name === "string" &&
        typeof d.folder === "string" &&
        typeof d.deckType === "string" &&
        typeof d.raw === "string" &&
        typeof d.contentHash === "string" &&
        /^[0-9a-f]{16}$/.test(d.contentHash)
    );
}

/**
 * Builds the full-sync payload of this device: all decks (raw markdown
 * included) plus learning progress keyed by deck contentHash — the slug
 * is per-device, the hash is the stable identity, so progress maps onto
 * the local card ids (`${slug}/${index}`) after merging.
 */
export async function buildSyncPayload(): Promise<string> {
    await decks.init();
    cardStore.init();

    const syncDecks: SyncDeck[] = Object.values(decks.decks).map((deck) => ({
        name: deck.name,
        folder: deck.folder,
        deckType: deck.deckType,
        raw: deck.raw,
        contentHash: deck.contentHash,
    }));

    const progress: SyncPayload["progress"] = {};
    for (const deck of Object.values(decks.decks)) {
        const loaded = decks.load(deck.slug);
        if (!loaded) continue;
        // One box per card index, 0 = untouched; trailing zeros trimmed.
        const boxes = loaded.cards.map(
            (card) => cardStore.states[card.id]?.box ?? 0,
        );
        let end = boxes.length;
        while (end > 0 && boxes[end - 1] === 0) end--;
        progress[deck.contentHash] = {
            s: boxes.slice(0, end),
            o: cardStore.isOverviewDone(deck.slug),
        };
    }

    return encodeSyncShare({
        kind: "nsc-sync",
        version: 1,
        uuid: syncStore.profile.uuid,
        decks: syncDecks,
        progress,
    });
}

/** What a successfully applied sync payload changed. */
export interface SyncResult {
    /** Decks that were actually new on this device. */
    decksAdded: number;
    /** Progress entries (per deck) that were merged. */
    progressApplied: number;
}

/**
 * Merges a received sync payload into the local stores. Throws a German
 * error when the payload comes from a different account UUID or is
 * malformed. Decks dedup by contentHash (existing deck keeps its local
 * slug and progress); progress merges with "higher box wins" via the
 * existing applyProgress; the overview flag is OR-merged.
 */
export async function applySyncPayload(
    encoded: string,
): Promise<SyncResult> {
    const payload = await decodeSyncShare(encoded);
    if (!payload) {
        throw new Error("Das Sync-Paket ist ungültig oder beschädigt.");
    }
    if (payload.uuid !== syncStore.profile.uuid) {
        throw new Error(
            "Das Sync-Paket stammt von einem anderen Konto (andere UUID) und wurde abgelehnt.",
        );
    }

    await decks.init();
    cardStore.init();

    // Decks: add the ones we don't have (dedup by contentHash inside add).
    let decksAdded = 0;
    for (const raw of payload.decks) {
        if (!isSyncDeck(raw)) continue;
        if (await decks.findByHash(raw.contentHash)) continue; // already have it
        await decks.add(raw.raw, raw.folder, raw.name, raw.deckType);
        decksAdded++;
    }

    // Progress: map contentHash → local slug, then merge positionally.
    let progressApplied = 0;
    for (const [hash, prog] of Object.entries(payload.progress)) {
        const local = await decks.findByHash(hash);
        if (!local) continue; // deck not present on this device — skip
        const loaded = decks.load(local.slug);
        applyProgress(local.slug, loaded?.cards.length ?? 0, {
            hash,
            boxes: prog.s,
            overviewDone: prog.o,
            studyTimeMs: 0, // study time stays device-local
        });
        progressApplied++;
    }

    return { decksAdded, progressApplied };
}
