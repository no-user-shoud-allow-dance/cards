import { STYLES, type Style } from "#lib/core/deck/document";
import type { FlashCard } from "#components/model/deckView";

// The options object itself is persisted state (one object under
// kk-settings) — the canonical type + defaults live in the state layer.
export type { PrintOptionsRecord as PrintOptionsState } from "#lib/repositories/settingsRepository";
export { defaultPrintOptionsRecord as defaultPrintOptions } from "#lib/repositories/settingsRepository";
import type { PrintOptionsRecord as PrintOptionsState } from "#lib/repositories/settingsRepository";

/**
 * Print view helpers: tag collection, card filtering, style resolution.
 * UI-layer only — operates on the FlashCard view, never on raw markdown.
 */

/** All tags of the deck, deduplicated, sorted. */
export function collectPrintTags(cards: FlashCard[]): string[] {
    return [...new Set(cards.flatMap((c) => c.tags))].sort((a, b) => a.localeCompare(b));
}

/** The cards that survive the print filters, in deck order. */
export function filterPrintCards(cards: FlashCard[], opts: PrintOptionsState): FlashCard[] {
    const hidden = new Set(opts.hiddenTags);
    return cards.filter(
        (c) => !(opts.hideMooned && c.hidden) && !c.tags.some((t) => hidden.has(t))
    );
}

/** German label per inline style — the words from the deck-format docs. */
export const STYLE_LABELS: Record<Style, string> = {
    bold: "fett",
    italic: "kursiv",
    code: "code",
    underline: "unterstrichen",
    strike: "durchgestrichen",
    mark: "markiert",
    sup: "hochgestellt",
    sub: "tiefgestellt",
};

/**
 * The styles to strip before rendering: everything when the master switch
 * is off, otherwise exactly the styles the user unchecked.
 */
export function effectiveDisabledStyles(opts: PrintOptionsState): Style[] {
    if (!opts.renderStyles) return [...STYLES];
    const enabled = new Set(opts.enabledStyles);
    return STYLES.filter((s) => !enabled.has(s));
}
