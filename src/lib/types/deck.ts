export type DeckType = "english" | "latin" | "greek";

/**
 * A structured flashcard. The parser produces these from a line of
 * markdown; `id` is assigned by the deck store (`${slug}/${index}`).
 */
export interface FlashCard {
    id: string;
    /** Leading article/gender token, e.g. "the", "m.", "ὁ". */
    article?: string;
    /** The prompt: lemma or vocabulary word. */
    question: string;
    /** Forms after the question (principal parts, case forms). */
    forms: string[];
    /** The translation. */
    answer: string;
    /** Trailing parenthesized info without the parens, e.g. "+ Gen. + Abl.". */
    additional?: string;
}

export interface ParsedDeck {
    title: string | null;
    cards: FlashCard[];
    errors: string[];
}

export interface LoadedDeck {
    slug: string;
    folder: string;
    name: string;
    deckType: DeckType;
    /** Whether this deck offers a pure mode (defined by its deck type). */
    pureMode: boolean;
    title: string | null;
    cards: FlashCard[];
    errors: string[];
}

/** A deck uploaded by the user; persisted in IndexedDB, never on a server. */
export interface Deck {
    slug: string;
    name: string;
    folder: string;
    deckType: DeckType;
    /** Raw markdown source, as uploaded or received via a share link. */
    raw: string;
    /**
     * Content identity of the deck (hashDeckContent over raw + deckType).
     * The slug is derived from this, and progress links reference it.
     */
    contentHash: string;
    createdAt: number;
}
