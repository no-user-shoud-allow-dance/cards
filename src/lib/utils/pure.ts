import { BOX_COUNT, type CardStates, type DeckType, type FlashCard } from "../types";
import { applyReplacements } from "./replacements";

// Weighted learning progress: each card contributes (box - 1) / (BOX_COUNT - 1),
// so box 1 = 0 % and box BOX_COUNT = 100 %. Averaged across all cards.
export function computeProgressRatio(
    cards: FlashCard[],
    states: CardStates,
): number {
    if (cards.length === 0) return 0;
    let sum = 0;
    for (const card of cards) {
        const box = states[card.id]?.box ?? 1;
        sum += (box - 1) / (BOX_COUNT - 1);
    }
    return sum / cards.length;
}

// German plural: "1 Karte", "n Karten".
export function countCards(n: number): string {
    return n === 1 ? "1 Karte" : `${n} Karten`;
}

/** A single card's box change when synced progress is applied. */
export interface ProgressDiffEntry {
    index: number;
    prompt: string;
    /** Box before the sync; null when the card was untouched. */
    from: number | null;
    /** Box after the sync (always higher than the effective current box). */
    to: number;
}

/**
 * Previews which cards a synced progress payload would change. Mirrors
 * cardStore.mergeProgress exactly: per card the higher box wins, and a
 * synced box of 1 on an untouched card is skipped (box 1 is the default).
 */
export function progressDiff(
    cards: FlashCard[],
    states: CardStates,
    boxes: number[],
): ProgressDiffEntry[] {
    const diff: ProgressDiffEntry[] = [];
    const count = Math.min(boxes.length, cards.length);
    for (let i = 0; i < count; i++) {
        const incoming = boxes[i];
        if (incoming <= 0) continue;
        const prev = states[cards[i].id];
        const current = prev?.box ?? 1;
        if (incoming <= current) continue;
        diff.push({
            index: i,
            prompt: cardPrompt(cards[i]),
            from: prev ? prev.box : null,
            to: incoming,
        });
    }
    return diff;
}

// ── Bracket helpers ──────────────────────────────────────────────

/**
 * Normal mode: brackets are hidden, content inside is shown.
 *   ἀγάπη [Liebe]  →  ἀγάπη Liebe
 */
function stripBrackets(text: string): string {
    return text.replace(/\[([^\]]*)\]/g, "$1").replace(/\s+/g, " ").trim();
}

/**
 * Pure mode: both brackets and their content are removed.
 *   ἀγάπη [Liebe]  →  ἀγάπη
 */
function removeBrackets(text: string): string {
    return text.replace(/\s*\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
}

// ── Card display helpers ─────────────────────────────────────────

/**
 * The front side as shown in normal mode (brackets hidden, content
 * visible). Used for search queries and overview display.
 */
export function cardPrompt(card: FlashCard): string {
    return stripBrackets(card.front);
}

/** The back side (answer / translation). */
export function cardAnswer(card: FlashCard): string {
    return card.back;
}

/**
 * The front side in pure mode: bracketed content removed and
 * language-specific diacritic replacements applied (e.g. Greek
 * without breathing marks / tonos, Latin without macrons).
 */
export function purePrompt(card: FlashCard, deckType: DeckType): string {
    let s = removeBrackets(card.front);
    s = applyReplacements(s, deckType);
    return s;
}

/** Front text for display: normal or pure mode. */
export function displayFront(
    card: FlashCard,
    pureMode: boolean,
    deckType: DeckType,
): string {
    if (!pureMode) return cardPrompt(card);
    const p = purePrompt(card, deckType);
    return p || cardPrompt(card);
}

/** Back text for display: normal shows just the answer; pure shows prompt + answer. */
export function displayBack(
    card: FlashCard,
    pureMode: boolean,
    _deckType: DeckType,
): string {
    if (!pureMode) return cardAnswer(card);
    return `${cardPrompt(card)}: ${cardAnswer(card)}`;
}
