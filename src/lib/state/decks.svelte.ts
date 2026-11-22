import type { RawMarkdown } from "#lib/core/deck/parse";
import type { Slug } from "#lib/core/deck/identity";
import { hashDeckContent } from "#lib/core/deck/hash";
import { serializeCard } from "#lib/core/deck/serialize";
import {
    createDeckRepository,
    type DeckEntry,
    type DeckRepository,
} from "#lib/repositories/decksRepository";

/**
 * Deck CRUD on DeckDocument only — this store never sees raw markdown
 * (except through the repository's getRaw/putRaw passthrough for the
 * editor). Thin orchestration over the storage boundary; no
 * computation. Content only: a deck's folders live in its learning
 * state (kk-state), so every folder read/write goes through the
 * learning store, never here.
 */
class DecksStore {
    entries = $state<DeckEntry[]>([]);
    #repo: DeckRepository | null = null;
    #ready: Promise<void> | null = null;

    async init(): Promise<void> {
        this.#ready ??= this.#load();
        return this.#ready;
    }

    async #load(): Promise<void> {
        this.#repo = await createDeckRepository();
        this.entries = await this.#repo.list();
    }

    #repository(): DeckRepository {
        if (!this.#repo) throw new Error("decks store not initialized — call init() first");
        return this.#repo;
    }

    async refresh(): Promise<void> {
        this.entries = await this.#repository().list();
    }

    /** The one write shape: init, run against the repository, refresh. */
    async #run<T>(fn: (repo: DeckRepository) => Promise<T>): Promise<T> {
        await this.init();
        const result = await fn(this.#repository());
        await this.refresh();
        return result;
    }

    byHash(hash: string): DeckEntry | undefined {
        return this.entries.find((e) => hashDeckContent(e.doc, serializeCard) === hash);
    }

    async put(entry: DeckEntry): Promise<void> {
        await this.#run((repo) => repo.put(entry));
    }

    async remove(slug: Slug): Promise<void> {
        await this.#run((repo) => repo.remove(slug));
    }

    /** Editor-only passthrough — the single markdown exception. */
    async getRaw(slug: Slug): Promise<RawMarkdown | null> {
        await this.init();
        return this.#repository().getRaw(slug);
    }

    async putRaw(slug: Slug, raw: RawMarkdown): Promise<void> {
        await this.#run((repo) => repo.putRaw(slug, raw));
    }
}

export const deckStore = new DecksStore();
