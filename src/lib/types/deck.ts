export type DeckType = "english" | "latin" | "greek";

/**
 * A flashcard with only a front and back side. The parser produces
 * these from a line of markdown; `id` is assigned by the deck store
 * (`${slug}/${index}`).
 *
 * The front side may contain bracketed hints: `ἀγάπη [Liebe]`.
 * In normal mode the brackets are hidden (content shown); in pure
 * mode both brackets and content are removed.
 */
export interface FlashCard {
    id: string;
    /** Front side text (may contain [bracketed] hints). */
    front: string;
    /** Back side text. */
    back: string;
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
     * The slug carries this hash plus a random suffix, and progress links
     * reference the hash — so the same content is recognised across devices
     * even though every deck instance has a unique slug.
     */
    contentHash: string;
    createdAt: number;
}
