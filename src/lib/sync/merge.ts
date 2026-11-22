import { deckHashFromString, hashDeckContent, type DeckHash } from "#lib/core/deck/hash";
import { serializeCard } from "#lib/core/deck/serialize";
import type { CardId } from "#lib/core/deck/ids";
import type { DeckDocument } from "#lib/core/deck/document";
import { mergeDeckStates, type CardState, type DeckState } from "#lib/core/learning/state";
import { nowEpochMs } from "#lib/core/primitives";
import type { DeckEntry } from "#lib/repositories/decksRepository";
import type { FullSyncItem } from "#lib/sync/protocol";

/**
 * Field-level merge on updatedAt — decks and CardStates. Decks are
 * keyed by content hash: identical hash means identical content, so the
 * local entry wins and only the states merge. Unknown remote decks are
 * added.
 */
export interface MergeResult {
    items: FullSyncItem[];
    added: number;
    merged: number;
}

export function mergeSyncItems(local: FullSyncItem[], remote: FullSyncItem[]): MergeResult {
    const byHash = new Map<DeckHash, FullSyncItem>();
    for (const item of local) byHash.set(item.hash, item);
    let added = 0;
    let merged = 0;
    for (const remoteItem of remote) {
        const existing = byHash.get(remoteItem.hash);
        if (!existing) {
            byHash.set(remoteItem.hash, remoteItem);
            added++;
            continue;
        }
        merged++;
        byHash.set(remoteItem.hash, {
            hash: existing.hash,
            entry: existing.entry,
            state: mergeStates(existing.state, remoteItem.state),
        });
    }
    return { items: [...byHash.values()], added, merged };
}

function mergeStates(local: DeckState | null, remote: DeckState | null): DeckState | null {
    if (!local) return remote;
    if (!remote) return local;
    return mergeDeckStates(local, remote);
}

/**
 * Applies decoded remote decks to the local entry list: parse → entry →
 * merge by hash. Returns the merge counts for the UI report.
 */
export function applyRemoteDecks(
    local: FullSyncItem[],
    remote: { doc: DeckDocument; states: Record<CardId, CardState>; deckHash: DeckHash }[],
    makeEntry: (doc: DeckDocument, hash: DeckHash) => DeckEntry
): MergeResult {
    const remoteItems: FullSyncItem[] = remote.map((r) => {
        const entry = makeEntry(r.doc, r.deckHash);
        const state: DeckState | null = Object.keys(r.states).length
            ? {
                  deckHash: r.deckHash,
                  updatedAt: nowEpochMs(),
                  streak: 0,
                  studyTime: 0,
                  cards: r.states,
              }
            : null;
        return { hash: r.deckHash, entry, state };
    });
    return mergeSyncItems(local, remoteItems);
}

export function localHash(entry: DeckEntry): DeckHash {
    return deckHashFromString(hashDeckContent(entry.doc, serializeCard));
}
