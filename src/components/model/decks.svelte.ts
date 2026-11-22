import { hashDeckContent, type DeckHash } from "#lib/core/deck/hash";
import { serializeCard } from "#lib/core/deck/serialize";
import type { CardId } from "#lib/core/deck/ids";
import { makeRawMarkdown, parse, parseCollect, validate } from "#lib/core/deck/parse";
import {
    DRAFT_FOLDER,
    draftNumberOf,
    FOLDER_DEFAULT,
    parseDeckTitle,
    parseFolderName,
    SPECIAL_FOLDERS,
    toggleSpecialFolder,
    withSimpleFolder,
    type FolderName,
    type Slug,
} from "#lib/core/deck/identity";
import { makeBox } from "#lib/core/learning/leitner";
import type { DeckState } from "#lib/core/learning/state";
import { makeEpochMs } from "#lib/core/primitives";
import type { DeckType } from "#lib/core/deck/document";
import { makeDeckEntry, type DeckEntry } from "#lib/repositories/decksRepository";
import { deckStore } from "#lib/state/decks.svelte";
import { learningStore } from "#lib/state/learning.svelte";
import { settingsStore } from "#lib/state/settings.svelte";
import { errorMessage, UI } from "#messages/locale.svelte";
import {
    entryToDeck,
    entryToLoadedDeck,
    type CardProgress,
    type Deck,
    type LoadedDeck,
} from "#components/model/deckView";

export interface AddDeckResult {
    deck: Deck | null;
    cardCount: number;
    errors: string[];
}

/**
 * The UI-facing deck facade — the app's only deck surface. The
 * frontend sees fully compiled decks (content + folders + progress +
 * study time, see deckView's LoadedDeck): it never touches stores,
 * records, slugs' internals, content hashes or card-id mappings —
 * every folder read/write and every learning operation resolves those
 * here. Thin orchestration over state/decks + state/learning; no
 * markdown handling beyond the single core validate/parse calls at
 * the add edge. Convention: stores expose raw $state fields, facades
 * expose getters.
 *
 * Read paths are derive-once maps: `entries` is $state, so one edit
 * invalidates all caches in a single pass and readers pay only a Map
 * lookup (previously every load()/get()/hashOf() re-hashed and
 * re-serialized the whole deck).
 */
class DecksFacade {
    /** Validation errors per slug (German sentences), surfaced by the deck page. */
    errors = $state<Record<string, string[]>>({});

    #bySlug = $derived(new Map(deckStore.entries.map((e): [Slug, DeckEntry] => [e.slug, e])));
    #hashes = $derived(
        new Map(deckStore.entries.map((e): [Slug, DeckHash] => [e.slug, this.hashOfEntry(e)]))
    );
    #loaded = $derived(
        new Map(
            deckStore.entries.map((e): [Slug, LoadedDeck] => [
                e.slug,
                entryToLoadedDeck(e, {
                    errors: this.errors[e.slug] ?? [],
                    folders: this.foldersOf(e.slug),
                    state: learningStore.states[e.slug as string],
                    pureModeDefault: settingsStore.pureMode,
                }),
            ])
        )
    );

    async init(): Promise<void> {
        // Both stores load here: compiled views join deck content with
        // learning state, so the facade owns both inits — callers never
        // initialize stores themselves.
        await deckStore.init();
        await learningStore.init();
        // One-off migration to the slug-keyed learning state: every deck
        // adopts its legacy kk-state:<hash> record (current content hash,
        // i.e. the one reachable before the migration). Runs once per
        // store lifetime; the repository deletes the legacy keys as it
        // goes, so this is a no-op after the first visit.
        for (const entry of deckStore.entries) {
            await learningStore.adoptLegacyState(entry.slug);
        }
    }

    /** Record view (slug → deck list item) for listings. */
    get decks(): Record<string, Deck> {
        const out: Record<string, Deck> = {};
        for (const [slug, entry] of this.#bySlug) {
            const hash = this.#hashes.get(slug);
            if (hash) out[slug] = entryToDeck(entry, hash, this.foldersOf(slug));
        }
        return out;
    }

    /**
     * The fully compiled deck (content + folders + progress); null for
     * unknown slugs. Reactive: any deck edit, folder change or answered
     * card invalidates the derived map.
     */
    load(slug: string): LoadedDeck | null {
        return this.#loaded.get(slug as Slug) ?? null;
    }

    /** The stored deck list item for a slug, if any. */
    get(slug: string): Deck | undefined {
        const entry = this.#bySlug.get(slug as Slug);
        const hash = this.#hashes.get(slug as Slug);
        return entry && hash ? entryToDeck(entry, hash, this.foldersOf(slug)) : undefined;
    }

    /** The list item of the deck with this content hash (e.g. from a progress link); null when none. */
    findByHash(contentHash: string): Deck | null {
        for (const deck of Object.values(this.decks)) {
            if (deck.contentHash === contentHash) return deck;
        }
        return null;
    }

    hashOfEntry(entry: DeckEntry): DeckHash {
        return hashDeckContent(entry.doc, serializeCard);
    }

    /**
     * The deck's folders from its kk-state record — the default folder
     * for decks that never had any assigned. Folders are learning
     * state, not deck content: they are read and written via the
     * learning store.
     */
    foldersOf(slug: string): FolderName[] {
        return learningStore.foldersFor(slug) ?? [FOLDER_DEFAULT];
    }

    /** Editor-only markdown passthrough — the single L0 exception. */
    async getRaw(slug: string): Promise<string | null> {
        const raw = await deckStore.getRaw(slug as Slug);
        return raw === null ? null : (raw as string);
    }

    /**
     * Parses raw markdown and stores it as a new deck. Dedup by content
     * hash: identical content returns the existing deck. The explicit
     * deck type overrides the frontmatter/auto-detected one. Parse
     * problems are returned as German error sentences, not thrown.
     */
    async add(
        raw: string,
        folder: string,
        name: string,
        deckType: DeckType
    ): Promise<AddDeckResult> {
        // `folder` is user input: a single simple folder (no "#" allowed).
        return this.addWithFolders(raw, [parseFolderName(folder)], name, deckType);
    }

    /** add() with already-validated folders (special ones allowed, e.g. `#drafts`). */
    async addWithFolders(
        raw: string,
        folders: FolderName[],
        name: string,
        deckType: DeckType
    ): Promise<AddDeckResult> {
        await this.init();
        const rawMd = makeRawMarkdown(raw);
        const nscErrors = validate(rawMd);
        const errors = nscErrors.map((e) => errorMessage(e.code));
        if (nscErrors.length > 0 || !name.trim()) {
            return { deck: null, cardCount: 0, errors };
        }
        const parsed = parse(rawMd);
        const doc = { ...parsed, type: deckType };
        const hash = hashDeckContent(doc, serializeCard);
        const existing = deckStore.byHash(hash as string);
        if (existing) {
            return {
                deck: entryToDeck(existing, hash as string, this.foldersOf(existing.slug)),
                cardCount: existing.doc.cards.length,
                errors: [],
            };
        }
        const entry = makeDeckEntry(doc);
        await deckStore.put(entry);
        // Folders persist in the deck's kk-state record, not the deck.
        await learningStore.setFolders(entry.slug as string, folders);
        return {
            deck: entryToDeck(entry, hash as string, folders),
            cardCount: doc.cards.length,
            errors: [],
        };
    }

    /**
     * The next draft name: `Draft-{n}` with n = highest existing draft
     * number + 1 (titles are matched across all folders).
     */
    nextDraftName(): string {
        let max = 0;
        for (const entry of deckStore.entries) {
            const n = draftNumberOf(entry.doc.title);
            if (n !== null) max = Math.max(max, n);
        }
        return UI.draftName(max + 1);
    }

    /**
     * The entry workflow's create step: stores the raw source as a new
     * deck tagged with the special `#drafts` folder. The source must
     * carry the draft name as its H1 (see core.setDeckTitleSource) — the
     * stored deck is then named `Draft-{n}`. The deck type comes from
     * the content (frontmatter `type:` wins, auto-detection otherwise).
     */
    async createDraft(raw: string): Promise<AddDeckResult> {
        const { doc } = parseCollect(makeRawMarkdown(raw));
        return this.addWithFolders(
            raw,
            [DRAFT_FOLDER],
            doc ? String(doc.title) : "Draft",
            doc?.type ?? "english"
        );
    }

    /**
     * Renames a deck and/or moves it to another folder. The slug is kept
     * — and with slug-keyed learning state the progress (and, being
     * kk-state, the folders) stays put on a rename or content edit, no
     * re-keying needed.
     */
    async update(
        slug: string,
        changes: { folder?: string; name?: string; dropFolders?: string[] }
    ): Promise<void> {
        await this.init();
        const entry = this.#bySlug.get(slug as Slug);
        if (!entry) return;
        const name = changes.name?.trim();
        if (name && name !== entry.doc.title) {
            await deckStore.put({ ...entry, doc: { ...entry.doc, title: parseDeckTitle(name) } });
        }
        if (changes.folder === undefined) return;
        const drop = (changes.dropFolders ?? []).map((f) =>
            parseFolderName(f, { allowSpecial: true })
        );
        await learningStore.setFolders(
            slug,
            withSimpleFolder(this.foldersOf(slug), changes.folder, drop)
        );
    }

    /**
     * Replaces a deck's raw markdown (card editing). Invalid markdown is
     * never persisted — the previous content stays, the German error
     * sentences are returned and remembered for the deck page.
     */
    async updateRaw(slug: string, raw: string): Promise<string[]> {
        await this.init();
        const nscErrors = validate(makeRawMarkdown(raw));
        const errors = nscErrors.map((e) => errorMessage(e.code));
        this.errors = { ...this.errors, [slug]: errors };
        if (nscErrors.length > 0) return errors;
        await deckStore.putRaw(slug as Slug, makeRawMarkdown(raw));
        return [];
    }

    /** Toggles the moon (anti-star `*`) of one card; progress survives. */
    async toggleCardHidden(slug: string, cardId: string): Promise<void> {
        await this.init();
        const entry = this.#bySlug.get(slug as Slug);
        if (!entry) return;
        const index = Number(cardId.split("/").pop());
        if (!Number.isInteger(index) || index < 0 || index >= entry.doc.cards.length) return;
        const cards = entry.doc.cards.map((c, i) =>
            i === index ? { ...c, hidden: !c.hidden } : c
        );
        await deckStore.put({ ...entry, doc: { ...entry.doc, cards } });
    }

    /** Toggles the `#pinned` tag of a deck (pin survives folder moves). */
    async togglePinned(slug: string): Promise<void> {
        await this.#toggleSpecial(slug, SPECIAL_FOLDERS.pinned);
    }

    /** Toggles `#exclude-from-continue-learning` (hides the deck from »Weiter lernen«). */
    async toggleHiddenFromContinue(slug: string): Promise<void> {
        await this.#toggleSpecial(slug, SPECIAL_FOLDERS.excludeFromContinue);
    }

    async #toggleSpecial(slug: string, special: FolderName): Promise<void> {
        await this.init();
        await learningStore.setFolders(slug, toggleSpecialFolder(this.foldersOf(slug), special));
    }

    /**
     * Sets or removes the deck's pure-mode override in its kk-state
     * record (`true` overrides, `false` falls back to the global
     * settings default). The compiled deck flips `pureModeEnabled`
     * reactively.
     */
    async setPureMode(slug: string, value: boolean): Promise<void> {
        await learningStore.setPureMode(slug, value);
    }

    // ── Learning operations ─────────────────────────────────────────

    async answer(slug: string, cardId: CardId, correct: boolean): Promise<void> {
        await learningStore.answer(slug, cardId, correct);
    }

    /** Restores one card's previous progress (`null` = the card had none). */
    async restoreCard(slug: string, cardId: CardId, prev: CardProgress | null): Promise<void> {
        await learningStore.restoreCard(
            slug,
            cardId,
            prev
                ? {
                      cardId,
                      box: makeBox(prev.box),
                      lapses: prev.lapses,
                      lastReviewed:
                          prev.lastReviewed === null ? null : makeEpochMs(prev.lastReviewed),
                      overviewDone: prev.overviewDone,
                  }
                : null
        );
    }

    /** Marks the given cards as seen in overview mode. */
    async markOverviewDoneAll(slug: string, cardIds: CardId[]): Promise<void> {
        await learningStore.markOverviewDoneAll(slug, cardIds);
    }

    /** Clears only the overview-done flags (boxes and progress survive). */
    async clearOverview(slug: string, cardIds: CardId[]): Promise<void> {
        await learningStore.clearOverview(slug, cardIds);
    }

    /** Removes the learning progress of the given cards (progress reset). */
    async resetCards(slug: string, cardIds: CardId[]): Promise<void> {
        await learningStore.resetCards(slug, cardIds);
    }

    /** Clears the deck's study time (boxes and progress survive). */
    async resetStudyTime(slug: string): Promise<void> {
        await learningStore.resetStudyTime(slug);
    }

    /** Adds active learning time (ms) to the deck; writes are serialized internally. */
    addStudyTime(slug: string, ms: number): void {
        if (ms <= 0) return;
        learningStore.addStudyTime(slug, ms);
    }

    // ── Import ──────────────────────────────────────────────────────

    /** Merges a decoded progress record (progress link) into the deck. */
    async importProgress(slug: string, state: DeckState): Promise<void> {
        await learningStore.mergeRemote(slug, state);
    }

    async remove(slug: string): Promise<void> {
        await this.init();
        await deckStore.remove(slug as Slug);
        void learningStore.removeDeck(slug);
        const next = { ...this.errors };
        delete next[slug];
        this.errors = next;
    }

    /** Drops every deck and all learning state (study times included). */
    async clearAll(): Promise<void> {
        await this.init();
        for (const entry of [...deckStore.entries]) {
            await deckStore.remove(entry.slug);
        }
        await learningStore.clearAll();
        this.errors = {};
    }
}

export const decks = new DecksFacade();
