import { BOX_COUNT, type CardStates, type FlashCard } from "../types";

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

// Combining diacritics (deliberately without U+0308 - umlaut is retained)
const DIACRITICS = /[\u0300\u0301\u0304\u0306\u0313\u0314\u0342\u0345]/g;

/** The full prompt side: article + question (without forms). */
export function cardPrompt(card: FlashCard): string {
    return [card.article, card.question].filter(Boolean).join(" ");
}

/** The full answer side: answer + additional in parens. */
export function cardAnswer(card: FlashCard): string {
    return card.additional
        ? `${card.answer} (${card.additional})`
        : card.answer;
}

export function purePrompt(card: FlashCard): string {
    let s = cardPrompt(card);

    s = s.replace(/\s*\([^)]*\)/g, "");
    s = s.replace(/\s*\bmit\s+\S+/gi, "");
    s = s.replace(/\s*\bm\.\s*\S+/gi, "");
    s = s.replace(/\s*\+\s*\S+/g, "");
    s = s.replace(/,.*$/s, "");

    s = s.normalize("NFD").replace(DIACRITICS, "").normalize("NFC");
    return s.trim().replace(/\s+/g, " ");
}

export function displayFront(card: FlashCard, pureMode: boolean): string {
    if (!pureMode) return cardPrompt(card);
    const p = purePrompt(card);
    return p || cardPrompt(card);
}

export function displayBack(card: FlashCard, pureMode: boolean): string {
    if (!pureMode) return cardAnswer(card);
    return `${cardPrompt(card)}: ${cardAnswer(card)}`;
}
