/**
 * The L1 domain model: the canonical JSON the whole application works
 * with. Raw deck markdown (L0) never reaches this layer's consumers —
 * storage converts at the boundary via parse()/serialize().
 */

import type { Hint } from "#lib/core/deck/hints";
import type { CardId } from "#lib/core/deck/ids";
import type { DeckMeta, DeckTitle } from "#lib/core/deck/identity";

/** The closed set of inline styles. One span carries exactly one style. */
export type Style = "bold" | "italic" | "code" | "underline" | "strike" | "mark" | "sup" | "sub";

export const STYLES: readonly Style[] = [
    "bold",
    "italic",
    "code",
    "underline",
    "strike",
    "mark",
    "sup",
    "sub",
];

/**
 * Additive styling annotation: offsets into `plain`.
 * Invariants (enforced by the constructor in inline.ts): sorted by
 * `start`, `0 ≤ start < end ≤ plain.length`, one style each. Overlapping
 * spans express nesting (`**fett *kursiv***` → two spans).
 */
export interface Span {
    style: Style;
    /** 0-based, inclusive. */
    start: number;
    /** Exclusive. */
    end: number;
}

/** A remote image referenced from card markdown via `![alt](url)`. */
export interface CardImage {
    alt: string;
    /** Absolute https URL, validated at parse time. */
    url: string;
}

/**
 * One side's text as described data: a single unstyled `plain` string
 * (the source for search, pure mode, stats) plus offset annotations.
 * Image tokens stay verbatim in `plain` (lossless round-trip); a card's
 * only image is the trailing line field (`Card.image`).
 */
export interface StyledText {
    plain: string;
    spans: Span[];
    images: CardImage[];
}

export type CardSide = "front" | "back";

/** A lowercased, trimmed tag (≤ 24 chars, deduplicated per card). */
export type Tag = string & { readonly __brand: "Tag" };

/**
 * One line of the deck file (`front - back :: context #tags *`).
 * `id` is the content hash of front+back — unaffected by inserting or
 * deleting other cards, and unchanged by toggling `hidden`.
 */
export interface Card {
    id: CardId;
    front: StyledText;
    back: StyledText;
    /** Example/usage line shown under the answer. */
    context?: StyledText;
    /** `[hint]` ranges — sibling annotation to spans (any number per side). */
    hints: Hint[];
    tags: Tag[];
    /** Anti-star (moon): skipped by every review/cram queue. */
    hidden: boolean;
    /**
     * The card's image — the trailing `![alt](https://url)` field of the
     * line. At most one per card; rendered on both sides.
     */
    image?: CardImage;
}

export type DeckType = "english" | "latin" | "greek";

export const DECK_TYPE_VALUES: readonly DeckType[] = ["english", "latin", "greek"];

/** The canonical deck document. */
export interface DeckDocument {
    title: DeckTitle;
    type: DeckType;
    /** Optional frontmatter; `{ extra: {} }` when absent. */
    meta: DeckMeta;
    cards: Card[];
}
