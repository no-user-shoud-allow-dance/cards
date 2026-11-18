import { hashDeckContent, type DeckHash } from "#lib/core/deck/hash";
import type { FolderName, Slug } from "#lib/core/deck/identity";
import type { CardId } from "#lib/core/deck/ids";
import { serializeCard } from "#lib/core/deck/serialize";
import {
    answerCard,
    isOverviewComplete,
    markOverviewDone,
    mergeDeckStates,
    newDeckState,
    recordStudyTime,
    type CardState,
    type DeckState,
} from "#lib/core/learning/state";
import { initialBox, type Box } from "#lib/core/learning/leitner";
import { nowEpochMs } from "#lib/core/primitives";
import { createStateRepository, type StateRepository } from "#lib/repositories/stateRepository";
import { deckStore } from "#lib/state/decks.svelte";

/**
 * Writes single CardState entries via the state repository — never
 * rewrites arrays. Thin orchestration over core/learning + storage.
 *
 * Records are keyed by deck slug (kk-state:<slug>): progress survives
 * deck edits and renames, and no re-keying is needed. Writers key by
 * slug alone too — the content hash a fresh record needs is resolved
 * from the deck store (state/decks), so no write path carries hashes.
 */
class LearningStore {
    states = $state<Record<string, DeckState>>({});
    #repo: StateRepository | null = null;
    #ready: Promise<void> | null = null;
    #timeQueue: Promise<void> = Promise.resolve();

    async init(): Promise<void> {
        this.#ready ??= this.#load();
        return this.#ready;
    }

    async #load(): Promise<void> {
        this.#repo = await createStateRepository();
        const next: Record<string, DeckState> = {};
        for (const slug of await this.#repo.list()) {
            const state = await this.#repo.get(slug);
            if (state) next[slug as string] = state;
        }
        this.states = next;
    }

    #repository(): StateRepository {
        if (!this.#repo) throw new Error("learning store not initialized — call init() first");
        return this.#repo;
    }

    /**
     * The deck's state record: its loaded kk-state record, the stored
     * one, or a fresh one seeded with the deck's current content hash.
     * null when the deck store holds no such deck — every write path
     * then silently no-ops.
     */
    async #stateFor(slug: string): Promise<DeckState | null> {
        await this.init();
        const existing = this.states[slug] ?? (await this.#repository().get(slug as Slug));
        if (existing) return existing;
        const hash = await this.#deckHashOf(slug);
        return hash ? newDeckState(hash, nowEpochMs()) : null;
    }

    /** The deck's current content hash, resolved via the deck store. */
    async #deckHashOf(slug: string): Promise<DeckHash | null> {
        await deckStore.init();
        const entry = deckStore.entries.find((e) => (e.slug as string) === slug);
        return entry ? hashDeckContent(entry.doc, serializeCard) : null;
    }

    async #save(slug: string, state: DeckState): Promise<void> {
        await this.#repository().put(slug as Slug, state);
        this.states = { ...this.states, [slug]: state };
    }

    async answer(slug: string, cardId: CardId, correct: boolean): Promise<DeckState | null> {
        const state = await this.#stateFor(slug);
        if (!state) return null;
        const next = answerCard(state, cardId, correct, nowEpochMs());
        await this.#save(slug, next);
        return next;
    }

    async markOverview(slug: string, cardId: CardId): Promise<DeckState | null> {
        const state = await this.#stateFor(slug);
        if (!state) return null;
        const next = markOverviewDone(state, cardId, nowEpochMs());
        await this.#save(slug, next);
        return next;
    }

    /** The deck's folders from kk-state; undefined when not seeded yet. */
    foldersFor(slug: string): FolderName[] | undefined {
        return this.states[slug]?.folders;
    }

    /**
     * Writes the deck's folders into its kk-state record — folders are
     * part of the learning state record, not the deck record. Keeps
     * `updatedAt` untouched: a folder move is no progress change and
     * must not win remote state merges by timestamp. A never-learned
     * deck gets a fresh record here (its only content will be folders).
     */
    async setFolders(slug: string, folders: FolderName[]): Promise<void> {
        const state = await this.#stateFor(slug);
        if (!state) return;
        if (sameFolders(state.folders, folders)) return;
        await this.#save(slug, { ...state, folders });
    }

    /**
     * Writes or removes the deck's pure-mode override in its kk-state
     * record (part of the learning state, like folders). `true` sets
     * the override, `false` removes it so the global default applies
     * again. Keeps `updatedAt` untouched: a toggle is no progress
     * change and must not win remote state merges by timestamp.
     */
    async setPureMode(slug: string, value: boolean): Promise<void> {
        const state = await this.#stateFor(slug);
        if (!state) return;
        if (state.pureMode === (value || undefined)) return;
        const next: DeckState = { ...state };
        if (value) next.pureMode = true;
        else delete next.pureMode;
        await this.#save(slug, next);
    }

    isOverviewComplete(slug: string, cardCount: number): boolean {
        const state = this.states[slug];
        return state ? isOverviewComplete(state, cardCount) : false;
    }

    /** Sync merge: per-field newer-wins; persists and updates the store. */
    async mergeRemote(slug: string, remote: DeckState): Promise<DeckState> {
        await this.init();
        const existing = this.states[slug] ?? (await this.#repository().get(slug as Slug));
        // A fresh local state needs a deckHash — the wire payload carries
        // the deck's content hash, which the caller matched this deck by.
        const local = existing ?? newDeckState(remote.deckHash, nowEpochMs());
        const merged = mergeDeckStates(local, remote);
        await this.#save(slug, merged);
        return merged;
    }

    /** Synchronous read of one card's state from the loaded map. */
    cardStateFor(slug: string, cardId: CardId): CardState | undefined {
        return this.states[slug]?.cards[cardId];
    }

    /** The card's current box; unseen cards start in box 1. */
    boxOf(slug: string, cardId: CardId): Box {
        return this.states[slug]?.cards[cardId]?.box ?? initialBox();
    }

    /** Undo support: restores a card's previous state (or removes it). */
    async restoreCard(slug: string, cardId: CardId, prev: CardState | null): Promise<void> {
        const state = await this.#stateFor(slug);
        if (!state) return;
        const cards = { ...state.cards };
        if (prev) cards[cardId] = prev;
        else delete cards[cardId];
        await this.#save(slug, { ...state, cards, updatedAt: nowEpochMs() });
    }

    /** Removes the learning state of the given cards (progress reset). */
    async resetCards(slug: string, cardIds: CardId[]): Promise<void> {
        const state = await this.#stateFor(slug);
        if (!state) return;
        const cards = { ...state.cards };
        for (const id of cardIds) delete cards[id];
        await this.#save(slug, { ...state, cards, updatedAt: nowEpochMs() });
    }

    /** Marks every given card as seen in overview mode. */
    async markOverviewDoneAll(slug: string, cardIds: CardId[]): Promise<void> {
        const state = await this.#stateFor(slug);
        if (!state) return;
        let next = state;
        const now = nowEpochMs();
        for (const id of cardIds) next = markOverviewDone(next, id, now);
        await this.#save(slug, next);
    }

    /** Clears only the overview-done flags (boxes and progress survive). */
    async clearOverview(slug: string, cardIds: CardId[]): Promise<void> {
        const state = await this.#stateFor(slug);
        if (!state) return;
        const cards = { ...state.cards };
        let changed = false;
        for (const id of cardIds) {
            const prev = cards[id];
            if (prev && prev.overviewDone) {
                cards[id] = { ...prev, overviewDone: false };
                changed = true;
            }
        }
        if (changed) await this.#save(slug, { ...state, cards, updatedAt: nowEpochMs() });
    }

    /** Drops one deck's state (deck deleted), keyed by slug. */
    async removeDeck(slug: string): Promise<void> {
        await this.init();
        await this.#repository().remove(slug as Slug);
        const next = { ...this.states };
        delete next[slug];
        this.states = next;
    }

    async clearAll(): Promise<void> {
        await this.init();
        for (const slug of await this.#repository().list()) {
            await this.#repository().remove(slug);
        }
        // Legacy records of deleted/abandoned decks are gone with the reset.
        for (const hash of await this.#repository().listLegacy()) {
            await this.#repository().removeLegacy(hash);
        }
        this.states = {};
    }

    /**
     * One-off migration to the slug keying: moves the deck's legacy
     * kk-state:<hash> record (current content hash, resolved via the
     * deck store) under its slug key. Called per deck by the decks
     * facade after both stores loaded.
     */
    async adoptLegacyState(slug: string): Promise<void> {
        await this.init();
        if (this.states[slug]) return;
        const hash = await this.#deckHashOf(slug);
        if (!hash) return;
        const state = await this.#repository().adoptLegacy(hash, slug as Slug);
        if (state) {
            this.states = { ...this.states, [slug]: state };
        }
    }

    /** Total active study time of one deck (ms); lives on the DeckState. */
    studyTimeFor(slug: string | null): number {
        return slug ? (this.states[slug]?.studyTime ?? 0) : 0;
    }

    /** Adds active learning time to a deck; writes are serialized via a queue. */
    addStudyTime(slug: string, ms: number): void {
        if (ms <= 0) return;
        this.#timeQueue = this.#timeQueue.then(async () => {
            const state = await this.#stateFor(slug);
            if (!state) return;
            await this.#save(slug, recordStudyTime(state, ms, nowEpochMs()));
        });
    }

    resetStudyTime(slug: string): void {
        this.#timeQueue = this.#timeQueue.then(async () => {
            const state = await this.#stateFor(slug);
            if (!state) return;
            await this.#save(slug, { ...state, studyTime: 0, updatedAt: nowEpochMs() });
        });
    }
}

export const learningStore = new LearningStore();

/** Element-wise folder-list comparison (order matters, folders never repeat). */
function sameFolders(a: FolderName[] | undefined, b: FolderName[]): boolean {
    if (!a || a.length !== b.length) return false;
    return a.every((folder, i) => folder === b[i]);
}
