import type { DeckType } from "../utils/types";

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

/** Maps content folders to deck types; unknown folders default to latin. */
const FOLDER_TYPES: Record<string, DeckType> = {
    english: "english",
    kairos: "greek",
};

export function deckTypeForFolder(folder: string): DeckType {
    return FOLDER_TYPES[folder.toLowerCase()] ?? "latin";
}
