import { DECK_TYPES } from "../decks/deckTypes";
import { parseDeck } from "../decks/parser";
import type { DeckType, LoadedDeck, UserDeck } from "../utils/types";

const DB_NAME = "nsc-user-decks";
const DB_VERSION = 1;
const STORE_NAME = "decks";

function slugify(value: string): string {
    return value.toLowerCase().replaceAll("/", "-").replaceAll(" ", "-");
}

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE_NAME, { keyPath: "slug" });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function toPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export interface AddUserDeckResult {
    deck: UserDeck;
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
class UserDeckStore {
    decks = $state<Record<string, UserDeck>>({});
    #dbPromise: Promise<IDBDatabase> | null = null;
    #initPromise: Promise<void> | null = null;
    #loadedCache = new WeakMap<UserDeck, LoadedDeck>();

    /** Loads all stored decks; resolves immediately during SSR. Idempotent. */
    init(): Promise<void> {
        if (typeof window === "undefined") return Promise.resolve();
        this.#initPromise ??= this.#load();
        return this.#initPromise;
    }

    async #load(): Promise<void> {
        try {
            const db = await this.#db();
            const tx = db.transaction(STORE_NAME, "readonly");
            const stored = (await toPromise(
                tx.objectStore(STORE_NAME).getAll(),
            )) as UserDeck[];
            const next: Record<string, UserDeck> = {};
            for (const deck of stored) next[deck.slug] = deck;
            this.decks = next;
        } catch {
            this.decks = {};
        }
    }

    #db(): Promise<IDBDatabase> {
        this.#dbPromise ??= openDatabase();
        return this.#dbPromise;
    }

    /** The stored (raw) deck for a slug, if any. */
    get(slug: string): UserDeck | undefined {
        return this.decks[slug];
    }

    /** The parsed deck for a slug, or null when the slug is unknown. */
    load(slug: string): LoadedDeck | null {
        const deck = this.decks[slug];
        if (!deck) return null;
        let loaded = this.#loadedCache.get(deck);
        if (!loaded) {
            const parsed = parseDeck(deck.raw);
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
        name: string,
        folder: string,
        deckType: DeckType,
    ): Promise<AddUserDeckResult> {
        await this.init();
        const slug = `user-${slugify(name)}-${Math.random().toString(36).slice(2, 8)}`;
        const deck: UserDeck = {
            slug,
            name: name.trim() || "Unbenannter Stapel",
            folder: folder.trim() || "Eigene",
            deckType,
            raw,
            createdAt: Date.now(),
        };
        const parsed = parseDeck(raw);
        if (typeof window !== "undefined") {
            const db = await this.#db();
            const tx = db.transaction(STORE_NAME, "readwrite");
            await toPromise(tx.objectStore(STORE_NAME).put(deck));
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
        changes: { name?: string; folder?: string },
    ): Promise<void> {
        await this.init();
        const deck = this.decks[slug];
        if (!deck) return;
        const updated: UserDeck = {
            ...deck,
            name: changes.name?.trim() || deck.name,
            folder: changes.folder?.trim() || deck.folder,
        };
        if (typeof window !== "undefined") {
            const db = await this.#db();
            const tx = db.transaction(STORE_NAME, "readwrite");
            await toPromise(tx.objectStore(STORE_NAME).put(updated));
        }
        this.decks = { ...this.decks, [slug]: updated };
    }

    async remove(slug: string): Promise<void> {
        await this.init();
        if (typeof window !== "undefined") {
            const db = await this.#db();
            const tx = db.transaction(STORE_NAME, "readwrite");
            await toPromise(tx.objectStore(STORE_NAME).delete(slug));
        }
        const next = { ...this.decks };
        delete next[slug];
        this.decks = next;
    }
}

export const userDecks = new UserDeckStore();
