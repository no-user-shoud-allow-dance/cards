import type { DeckType } from "../types";
import { parseDeck } from "./parser";

export interface DeckTypeConfig {
    /** Display label of the deck type. */
    label: string;
    /** Genitive form of the source language, used in the help-search query. */
    language: string;
    /** Whether decks of this type offer a pure mode. */
    pureMode: boolean;
    /** Known article/gender markers that prefix the question. */
    articles: readonly string[];
}

/**
 * Per-type deck configuration. The deck type defines whether a pure mode
 * exists: English decks have none, Latin and Greek decks do.
 */
export const DECK_TYPES: Record<DeckType, DeckTypeConfig> = {
    english: {
        label: "Englisch",
        language: "Englischen",
        pureMode: false,
        articles: ["the", "a", "an"],
    },
    latin: {
        label: "Latein",
        language: "Lateinischen",
        pureMode: true,
        articles: ["m.", "f.", "n."],
    },
    greek: {
        label: "Altgriechisch",
        language: "Altgriechischen",
        pureMode: true,
        articles: ["ὁ", "ἡ", "τό", "τοῦ", "τῆς", "τῷ", "τόν", "τήν", "τοί", "ταί", "τά"],
    },
};

/** Deck types as [value, config] pairs, for select dropdowns. */
export const DECK_TYPE_OPTIONS = Object.entries(DECK_TYPES) as [
    DeckType,
    DeckTypeConfig,
][];

const GREEK_CHAR = /[\u0370-\u03ff\u1f00-\u1fff]/;
const LATIN_MACRON = /[āēīōū]/i;
const LATIN_ENDING =
    /\b\w+(?:us|um|is|ae|am|em|or|os|as|es|a|orum|arum|are|ere|ire)\b/i;

/**
 * Guesses the deck type from the card questions: Greek by script, Latin
 * by macrons or typical endings on most questions, English as the default.
 * The result is a guess — the user can override it.
 */
export function guessDeckType(raw: string): DeckType {
    // Parse without article stripping — use "latin" as a neutral default
    // so the parser doesn't strip English articles before we inspect.
    const { cards } = parseDeck(raw, "latin");
    if (cards.length === 0) return "english";

    // Strip bracketed hints from the front for analysis — the bracket
    // content is in the target language, not the source language.
    const prompts = cards.map((card) =>
        card.front.replace(/\s*\[[^\]]*\]/g, "").trim(),
    );

    const greek = prompts.filter((p) => GREEK_CHAR.test(p)).length;
    if (greek / prompts.length >= 0.25) return "greek";

    const latin = prompts.filter(
        (p) => LATIN_MACRON.test(p) || LATIN_ENDING.test(p),
    ).length;
    if (latin / prompts.length >= 0.5) return "latin";

    return "english";
}
