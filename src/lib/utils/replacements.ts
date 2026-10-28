import type { DeckType } from "../types";

/**
 * Per-language character replacement dictionaries. In pure mode these
 * are applied to the front side so the learner must recall the exact
 * spelling — e.g. Greek with diacritics, Latin with macrons.
 *
 * Each dictionary maps a precomposed character (with diacritics) to
 * its base letter (without diacritics). Dictionaries are built at
 * module load time by NFD-decomposing every code point in the relevant
 * Unicode range and stripping combining diacritical marks.
 */

// Combining Diacritical Marks block (U+0300–U+036F): tonos, breathing
// marks, dialytika, iota subscript, macron, etc.
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/**
 * Builds a replacement dictionary by decomposing each code point in
 * [start, end] via NFD and mapping it to its base letter (combining
 * marks stripped). Only single-code-point bases are included.
 */
function buildDictionary(start: number, end: number): Record<string, string> {
    const dict: Record<string, string> = {};
    for (let code = start; code <= end; code++) {
        const ch = String.fromCodePoint(code);
        const decomposed = ch.normalize("NFD");
        // Multi-code-point decomposition means the character has diacritics.
        if (decomposed.length > 1) {
            const base = decomposed.replace(COMBINING_MARKS, "");
            if (base !== ch && [...base].length === 1) {
                dict[ch] = base;
            }
        }
    }
    return dict;
}

// Greek and Coptic (U+0370–U+03FF) + Greek Extended / polytonic (U+1F00–U+1FFF)
const GREEK_DICT: Record<string, string> = {
    ...buildDictionary(0x0370, 0x03ff),
    ...buildDictionary(0x1f00, 0x1fff),
};

// Latin Extended-A (U+0100–U+017F) — covers macron vowels (ā, ē, ī, ō, ū)
const LATIN_DICT: Record<string, string> = buildDictionary(0x0100, 0x017f);

const DICTIONARIES: Record<DeckType, Record<string, string>> = {
    english: {},
    latin: LATIN_DICT,
    greek: GREEK_DICT,
};

/**
 * Applies the language-specific replacement dictionary to the text,
 * replacing each character that has a diacritic with its base letter.
 */
export function applyReplacements(text: string, deckType: DeckType): string {
    const dict = DICTIONARIES[deckType];
    if (!dict || Object.keys(dict).length === 0) return text;
    return [...text].map((ch) => dict[ch] ?? ch).join("");
}
