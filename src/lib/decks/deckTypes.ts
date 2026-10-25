import type { DeckType } from "../utils/types";
import { parseDeck } from "./parser";

export interface DeckTypeConfig {
    /** Display label of the deck type. */
    label: string;
    /** Genitive form of the source language, used in the help-search query. */
    language: string;
    /** Whether decks of this type offer a pure mode. */
    pureMode: boolean;
}

/**
 * Per-type deck configuration. The deck type defines whether a pure mode
 * exists: English decks have none, Latin and Greek decks do.
 */
export const DECK_TYPES: Record<DeckType, DeckTypeConfig> = {
    english: { label: "Englisch", language: "Englischen", pureMode: false },
    latin: { label: "Latein", language: "Lateinischen", pureMode: true },
    greek: { label: "Altgriechisch", language: "Altgriechischen", pureMode: true },
};

/** Maps content folders to deck types; unknown folders default to english. */
const FOLDER_TYPES: Record<string, DeckType> = {
    kairos: "greek",
    latein: "latin",
};

export function deckTypeForFolder(folder: string): DeckType {
    return FOLDER_TYPES[folder.toLowerCase()] ?? "english";
}

const GREEK_CHAR = /[\u0370-\u03ff\u1f00-\u1fff]/;
const LATIN_MACRON = /[āēīōū]/i;
const LATIN_ENDING =
    /\b\w+(?:us|um|is|ae|am|em|or|os|as|es|a|orum|arum|are|ere|ire)\b/i;

/**
 * Guesses the deck type from the card fronts: Greek by script, Latin by
 * macrons or typical endings on most fronts, English as the default (like
 * deckTypeForFolder). The result is a guess — the user can override it.
 */
export function guessDeckType(raw: string): DeckType {
    const { cards } = parseDeck(raw);
    if (cards.length === 0) return "english";

    const fronts = cards.map((card) => card.front);

    const greek = fronts.filter((front) => GREEK_CHAR.test(front)).length;
    if (greek / fronts.length >= 0.25) return "greek";

    const latin = fronts.filter(
        (front) => LATIN_MACRON.test(front) || LATIN_ENDING.test(front),
    ).length;
    if (latin / fronts.length >= 0.5) return "latin";

    return "english";
}
