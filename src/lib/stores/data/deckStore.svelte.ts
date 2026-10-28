import { DECK_TYPES } from "../../utils/deckTypes";
import { parseDeck } from "../../utils/parser";
import { hashDeckContent } from "../../utils/hash";
import type { Deck, DeckType, LoadedDeck } from "../../types";
import { BaseStore } from "./baseStore";

export interface AddDeckResult {
    deck: Deck;
    cardCount: number;
    errors: string[];
}

/**
 * User-uploaded decks, persisted in IndexedDB. Decks live only in the
 * user's browser — they are never sent to a server or committed to a repo.
 * The store is also the single source for parsed decks: `load()` turns a
 * stored deck into a LoadedDeck (cached per deck object, so a renamed or
 * moved entry is parsed again).
 */
class DeckStore extends BaseStore {
    protected readonly dbName = "nsc-user-decks";
    protected readonly dbVersion = 1;
    protected readonly storeName = "decks";
    protected readonly keyPath = "slug";

    decks = $state<Record<string, Deck>>({});
    #loadedCache = new WeakMap<Deck, LoadedDeck>();

    protected async hydrate(): Promise<void> {
        try {
            const stored = await this.getAll<Deck>();
            const next: Record<string, Deck> = {};
            for (const deck of stored) next[deck.slug] = deck;
            this.decks = next;
            await this.#backfillHashes();
        } catch {
            this.decks = {};
        }
    }

    /**
     * Computes and stores the content hash for decks saved before
     * hashing existed, so progress links can find them.
     */
    async #backfillHashes(): Promise<void> {
        const missing = Object.values(this.decks).filter(
            (deck) => !deck.contentHash,
        );
        if (missing.length === 0) return;
        const next = { ...this.decks };
        for (const deck of missing) {
            const updated: Deck = {
                ...deck,
                contentHash: await hashDeckContent(deck.raw, deck.deckType),
            };
            next[updated.slug] = updated;
            await this.put(updated);
        }
        this.decks = next;
    }

    /** The stored (raw) deck for a slug, if any. */
    get(slug: string): Deck | undefined {
        return this.decks[slug];
    }

    /** The stored deck with this content hash, if any. */
    async findByHash(hash: string): Promise<Deck | undefined> {
        await this.init();
        return Object.values(this.decks).find(
            (deck) => deck.contentHash === hash,
        );
    }

    /** The parsed deck for a slug, or null when the slug is unknown. */
    load(slug: string): LoadedDeck | null {
        const deck = this.decks[slug];
        if (!deck) return null;
        let loaded = this.#loadedCache.get(deck);
        if (!loaded) {
            const parsed = parseDeck(deck.raw, deck.deckType);
            loaded = {
                slug: deck.slug,
                folder: deck.folder,
                name: deck.name,
                deckType: deck.deckType,
                pureMode: DECK_TYPES[deck.deckType].pureMode,
                title: parsed.title,
                cards: parsed.cards.map((card, index) => ({
                    ...card,
                    id: `${deck.slug}/${index}`,
                })),
                errors: parsed.errors,
            };
            this.#loadedCache.set(deck, loaded);
        }
        return loaded;
    }

    async add(
        raw: string,
        folder: string,
        name: string,
        deckType: DeckType,
    ): Promise<AddDeckResult> {
        await this.init();
        const contentHash = await hashDeckContent(raw, deckType);
        // The slug is the content hash plus a random suffix. The hash
        // keeps the deck identifiable across devices (import dedup,
        // progress links), while the suffix makes every deck instance
        // unique: editing changes the content — and thus the hash —
        // but never the slug, so progress (keyed by slug) survives.
        const slug = `${contentHash}-${Math.random().toString(36).slice(2, 6)}`;
        const deck: Deck = {
            slug,
            name: name.trim() || "Unbenannter Stapel",
            folder: folder.trim() || "Eigene",
            deckType,
            raw,
            contentHash,
            createdAt: Date.now(),
        };
        const parsed = parseDeck(raw, deckType);
        if (typeof window !== "undefined") {
            await this.put(deck);
        }
        this.decks = { ...this.decks, [deck.slug]: deck };
        return { deck, cardCount: parsed.cards.length, errors: parsed.errors };
    }

    /**
     * Renames a deck and/or moves it to another folder. The slug is kept,
     * so card progress (keyed by slug) survives both operations.
     */
    async update(
        slug: string,
        changes: { folder?: string; name?: string },
    ): Promise<void> {
        await this.init();
        const deck = this.decks[slug];
        if (!deck) return;
        const updated: Deck = {
            ...deck,
            name: changes.name?.trim() || deck.name,
            folder: changes.folder?.trim() || deck.folder,
        };
        if (typeof window !== "undefined") {
            await this.put(updated);
        }
        this.decks = { ...this.decks, [slug]: updated };
    }

    /**
     * Replaces a deck's raw markdown (card editing). The slug stays the
     * same so card progress (keyed by `${slug}/${index}`) survives for
     * cards that keep their position; the content hash is recomputed so
     * import dedup and progress links track the new content.
     */
    async updateRaw(slug: string, raw: string): Promise<void> {
        await this.init();
        const deck = this.decks[slug];
        if (!deck) return;
        const updated: Deck = {
            ...deck,
            raw,
            contentHash: await hashDeckContent(raw, deck.deckType),
        };
        if (typeof window !== "undefined") {
            await this.put(updated);
        }
        this.decks = { ...this.decks, [slug]: updated };
    }

    async remove(slug: string): Promise<void> {
        await this.init();
        if (typeof window !== "undefined") {
            await this.delete(slug);
        }
        const next = { ...this.decks };
        delete next[slug];
        this.decks = next;
    }
}

export const decks = new DeckStore();
