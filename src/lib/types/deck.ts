export type DeckType = "english" | "latin" | "greek";

/**
 * A remote image referenced from card markdown via the standard
 * `![alt](url)` syntax. The URL is always an absolute https URL —
 * validated at parse time, because decks arrive from other users via
 * share links and the parser must not pass arbitrary schemes through
 * to an `<img src>`.
 */
export interface CardImage {
    /** Alt text; also the fallback shown when the image cannot load. */
    alt: string;
    /** Absolute https URL, validated at parse time. */
    url: string;
}

export interface CardImageRef extends CardImage {
    /** Which side of the card the image belongs to. */
    side: "front" | "back";
}

/**
 * A flashcard with only a front and back side. The parser produces
 * these from a line of markdown; `id` is assigned by the deck store
 * (`${slug}/${index}`).
 *
 * The front side may contain bracketed hints: `ἀγάπη [Liebe]`.
 * In normal mode the brackets are hidden (content shown); in pure
 * mode both brackets and content are removed.
 *
 * Image tokens (`![alt](url)`) stay verbatim in the plain-text fields
 * (so editing round-trips losslessly); the display helpers replace them
 * with their alt text, which keeps the card meaningful offline. The
 * structured `images` list keeps alt + URL + side for rendering.
 */
export interface FlashCard {
    id: string;
    /** Front side text (may contain [bracketed] hints and image tokens). */
    front: string;
    /** Back side text (may contain image tokens). */
    back: string;
    /** Images referenced on either side; empty for decks without images. */
    images: CardImageRef[];
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
