import type { DeckType } from "#lib/core/deck/document";
import { makeRawMarkdown, parseCollect } from "#lib/core/deck/parse";

export interface DeckTypeConfig {
    /** Whether decks of this type offer a pure mode. */
    pureMode: boolean;
}

/**
 * Per-type deck configuration. The deck type defines whether a pure mode
 * exists: English decks have none, Latin and Greek decks do. Display
 * labels are UI wording and live in the messages layer
 * (`UI.deckTypeLabel` / `UI.deckTypeLanguage`).
 */
export const DECK_TYPES: Record<DeckType, DeckTypeConfig> = {
    english: { pureMode: false },
    latin: { pureMode: true },
    greek: { pureMode: true },
};

/** Deck types as [value, config] pairs, for select dropdowns. */
export const DECK_TYPE_OPTIONS = Object.entries(DECK_TYPES) as [DeckType, DeckTypeConfig][];

/**
 * Guesses the deck type from the card questions via the single core
 * parser (frontmatter `type:` wins; otherwise auto-detection on the
 * hint-free fronts — Greek by script, Latin by macrons/endings, else
 * English). The result is a guess — the user can override it.
 */
export function guessDeckType(raw: string): DeckType {
    const { doc } = parseCollect(makeRawMarkdown(raw));
    return doc?.type ?? "english";
}
