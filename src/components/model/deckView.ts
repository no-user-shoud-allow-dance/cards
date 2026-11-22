import { isOverviewComplete, type CardState, type DeckState } from "#lib/core/learning/state";
import { serializeInlineSide } from "#lib/core/deck/inline";
import type { Card, CardImage, DeckDocument, DeckType } from "#lib/core/deck/document";
import type { CardId } from "#lib/core/deck/ids";
import type { DeckEntry } from "#lib/repositories/decksRepository";
import { DECK_TYPES } from "#components/model/deckTypes";

/**
 * View model for the UI layer. Routes and components never touch
 * DeckDocument/Card directly — they work with these plain string-based
 * views. The conversion runs here, at the ui edge, on top of the L1
 * domain model (side strings are re-serialized from StyledText + hints,
 * never parsed from deck markdown).
 *
 * `LoadedDeck` is the fully compiled deck: content (flashcards, meta)
 * joined with learning state (progress, study time, overview) and the
 * device-local folders — the frontend never assembles or stores
 * anything itself, it renders and writes through the facade.
 */

/**
 * One card's learning progress (view of exactly one CardState). Plain
 * numbers/strings — the Leitner branding stays in core.
 */
export interface CardProgress {
    /** Leitner box 1..BOX_COUNT; 1 is the initial box. */
    box: number;
    /** Wrong answers total. */
    lapses: number;
    lastReviewed: number | null;
    /** Card was seen in overview mode. */
    overviewDone: boolean;
}

/**
 * A flashcard with only a front and back side. The front side may contain
 * bracketed hints: `ἀγάπη [Liebe]`.
 */
export interface FlashCard {
    /**
     * Positional id `${slug}/${index}` — the card's position inside its
     * deck. Used as the UI key (lists, moon toggle, reset).
     */
    id: string;
    /**
     * Content-hash CardId of the card — stable across edits of other cards
     * and across devices. Used for learning state and share/sync payloads.
     */
    cardId: CardId;
    /** Front side text (may contain [bracketed] hints and inline markup). */
    front: string;
    /** Back side text (may contain [bracketed] hints and inline markup). */
    back: string;
    /** Example/usage line shown under the answer (`::` field). */
    context?: string;
    /** Trailing `#tag` markers of the card line. */
    tags: string[];
    /** Anti-star (moon): the card is skipped by every review/cram queue. */
    hidden: boolean;
    /** The card's trailing `![alt](url)` image; rendered on both sides. */
    image?: CardImage;
    /** Compiled learning progress; null when the card was never answered or overviewed. */
    state: CardProgress | null;
}

/** Frontmatter meta of a deck, shown on the deck page. */
export interface DeckMetaInfo {
    author?: string;
    description?: string;
    source?: string;
}

/**
 * Display label for a deck's folder list: the first simple folder, else
 * the first folder at all (a `#special` tag), else "".
 */
export function folderLabel(folders: readonly string[]): string {
    return folders.find((f) => !f.startsWith("#")) ?? folders[0] ?? "";
}

export interface LoadedDeck {
    slug: string;
    folders: string[];
    name: string;
    deckType: DeckType;
    /**
     * Whether this deck's type offers a pure mode (defined by the deck
     * type) — UI gates (toggles, notes) key off this, not the effective
     * value.
     */
    pureMode: boolean;
    /**
     * Compiled effective pure mode: the deck's type offers one and the
     * per-deck kk-state override or the global settings default is on.
     * Routes and sessions display card sides through this and never
     * consult settings themselves.
     */
    pureModeEnabled: boolean;
    title: string | null;
    meta: DeckMetaInfo;
    cards: FlashCard[];
    errors: string[];

    // ── Compiled learning state (kk-state join) ──────────────────────

    /** Deck-level count of correct answers in a row. */
    streak: number;
    /** Total active learning time of the deck in ms. */
    studyTimeMs: number;
    /** Every card was seen in overview mode (derived, never stored). */
    overviewComplete: boolean;
    /** Any card of the deck was ever answered or overviewed. */
    hasProgress: boolean;
}

/** A stored deck as listed on the home page (no raw markdown — that is editor-only). */
export interface Deck {
    slug: string;
    name: string;
    folders: string[];
    deckType: DeckType;
    /** Content identity of the deck (hash over title + type + cards). */
    contentHash: string;
    createdAt: number;
    /** Total card count (learned + unlearned). */
    count: number;
}

function sideToString(card: Card, side: "front" | "back"): string {
    const text = side === "front" ? card.front : card.back;
    const hints = card.hints.filter((h) => h.side === side);
    return serializeInlineSide(text, hints);
}

/** Map of one stored CardState to its plain view (records exist only for touched cards). */
function cardProgressOf(state: CardState): CardProgress {
    return {
        box: state.box,
        lapses: state.lapses,
        lastReviewed: state.lastReviewed,
        overviewDone: state.overviewDone,
    };
}

export function cardToFlashCard(card: Card, state: CardState | null = null): FlashCard {
    return {
        id: card.id,
        cardId: card.id,
        front: sideToString(card, "front"),
        back: sideToString(card, "back"),
        context: card.context ? serializeInlineSide(card.context) : undefined,
        tags: [...card.tags],
        hidden: card.hidden,
        image: card.image,
        state: state ? cardProgressOf(state) : null,
    };
}

export function docMeta(doc: DeckDocument): DeckMetaInfo {
    return {
        author: doc.meta.author,
        description: doc.meta.description,
        source: doc.meta.source,
    };
}

/** Everything a listed deck needs to be compiled into a LoadedDeck. */
export interface DeckViewInput {
    /** Validation errors of the last editor save (German sentences). */
    errors: string[];
    /** Device-local folders (simple + `#special`), from the deck's kk-state. */
    folders: string[];
    /** The deck's learning state (kk-state record); undefined when none exists yet. */
    state: DeckState | undefined;
    /** Global settings default; applies when the deck's kk-state has no override. */
    pureModeDefault: boolean;
}

export function entryToLoadedDeck(entry: DeckEntry, view: DeckViewInput): LoadedDeck {
    const cards = entry.doc.cards.map((card, index) => {
        const cardState = view.state?.cards[card.id] ?? null;
        return {
            ...cardToFlashCard(card, cardState),
            // UI identity is positional: `${slug}/${index}`.
            id: `${entry.slug}/${index}`,
        };
    });
    const offersPureMode = DECK_TYPES[entry.doc.type].pureMode;
    return {
        slug: entry.slug,
        folders: [...view.folders],
        name: entry.doc.title,
        deckType: entry.doc.type,
        pureMode: offersPureMode,
        pureModeEnabled: offersPureMode && (view.state?.pureMode ?? view.pureModeDefault),
        title: entry.doc.title,
        meta: docMeta(entry.doc),
        cards,
        errors: view.errors,
        streak: view.state?.streak ?? 0,
        studyTimeMs: view.state?.studyTime ?? 0,
        // No state record → no card was ever overviewed.
        overviewComplete: view.state !== undefined && isOverviewComplete(view.state, cards.length),
        hasProgress: cards.some((card) => card.state !== null),
    };
}

export function entryToDeck(entry: DeckEntry, contentHash: string, folders: string[] = []): Deck {
    return {
        slug: entry.slug,
        name: entry.doc.title,
        folders: [...folders],
        deckType: entry.doc.type,
        contentHash,
        createdAt: entry.createdAt,
        count: entry.doc.cards.length,
    };
}
