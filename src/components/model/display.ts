import { BOX_COUNT } from "#lib/core/learning/leitner";
import type { DeckType } from "#lib/core/deck/document";
import {
    asRawCardSide,
    imageTokensToAltText,
    parseInlineSide,
    stripImageTokens,
} from "#lib/core/deck/inline";
import { applyReplacements } from "#components/model/replacements";
import type { FlashCard } from "#components/model/deckView";

// Image tokens never reach an <img src> from here: they are either
// stripped or replaced by their alt text, so no URL validation is
// needed on this display path. The token syntax itself lives only in
// core/deck/inline.ts.

/** Strips allowlisted inline markup via the single core parser; on a parse error the text stays as-is. */
function stripInlineFormat(text: string): string {
    try {
        return parseInlineSide(asRawCardSide(text)).plain;
    } catch {
        return text;
    }
}

/** The card's Leitner box (1..BOX_COUNT); never-touched cards sit in box 1. */
export function boxOfCard(card: FlashCard): number {
    return card.state?.box ?? 1;
}

// Weighted learning progress: each card contributes (box - 1) / (BOX_COUNT - 1),
// so box 1 = 0 % and box BOX_COUNT = 100 %. Averaged across all cards.
export function computeProgressRatio(cards: FlashCard[]): number {
    if (cards.length === 0) return 0;
    let sum = 0;
    for (const card of cards) {
        sum += (boxOfCard(card) - 1) / (BOX_COUNT - 1);
    }
    return sum / cards.length;
}

/** Card count per Leitner box (index 0 = box 1 … BOX_COUNT-1 = learned) — feeds BoxStrip (H5). */
export function boxCountsOf(cards: FlashCard[]): number[] {
    const counts = Array.from({ length: BOX_COUNT }, () => 0);
    for (const card of cards) {
        const box = boxOfCard(card);
        if (box >= 1 && box <= BOX_COUNT) counts[box - 1]!++;
    }
    return counts;
}

// ── Bracket helpers ──────────────────────────────────────────────

/**
 * Normal mode: brackets are hidden, content inside is shown.
 *   ἀγάπη [Liebe]  →  ἀγάπη Liebe
 * Spaces/tabs collapse, real newlines are kept (multi-line sides).
 */
function stripBrackets(text: string): string {
    return text
        .replace(/\[([^\]]*)\]/g, "$1")
        .replace(/[^\S\n]+/g, " ")
        .trim();
}

/**
 * Pure mode: both brackets and their content are removed.
 *   ἀγάπη [Liebe]  →  ἀγάπη
 */
function removeBrackets(text: string): string {
    return text
        .replace(/[^\S\n]*\[[^\]]*\]/g, "")
        .replace(/[^\S\n]+/g, " ")
        .trim();
}

// ── Card display helpers ─────────────────────────────────────────

/**
 * The front side as plain text with image tokens replaced by their alt
 * text and allowlisted inline formatting stripped. Used for search queries and
 * progress diffs — not for card display, where the image is rendered
 * separately and tags render as elements (see displayFront + RichText).
 */
export function cardPrompt(card: FlashCard): string {
    // Single line for search queries: newlines collapse too.
    return stripBrackets(stripInlineFormat(imageTokensToAltText(card.front)))
        .replace(/\s+/g, " ")
        .trim();
}

/** The back side (answer / translation) as plain single-line text. */
export function cardAnswer(card: FlashCard): string {
    return stripInlineFormat(imageTokensToAltText(card.back)).replace(/\s+/g, " ").trim();
}

/**
 * The front side in pure mode: bracketed content removed, image tokens
 * stripped (the image is rendered on the prompt side), and
 * language-specific diacritic replacements applied (e.g. Greek without
 * breathing marks / tonos, Latin without macrons).
 */
export function purePrompt(card: FlashCard, deckType: DeckType): string {
    let s = removeBrackets(stripImageTokens(card.front));
    s = applyReplacements(s, deckType);
    return s;
}

/**
 * Front text for card display: normal or pure mode. Image tokens are
 * stripped — the image itself (with its alt as loading/error fallback)
 * is rendered above the text, so the alt must not repeat as text.
 * Allowlisted markdown formatting stays in the string; RichText renders
 * it as real elements.
 */
export function displayFront(card: FlashCard, pureMode: boolean, deckType: DeckType): string {
    if (!pureMode) return stripBrackets(stripImageTokens(card.front));
    const p = purePrompt(card, deckType);
    return p || stripBrackets(stripImageTokens(card.front));
}

/** Back text for card display: normal shows just the answer; pure shows prompt + answer. */
export function displayBack(card: FlashCard, pureMode: boolean): string {
    if (!pureMode) return stripImageTokens(card.back);
    return `${stripBrackets(stripImageTokens(card.front))}: ${stripImageTokens(card.back)}`;
}
