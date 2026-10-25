import { BOX_COUNT, type Card, type CardStates, type RawCard } from "./types";

// Weighted learning progress: each card contributes (box - 1) / (BOX_COUNT - 1),
// so box 1 = 0 % and box BOX_COUNT = 100 %. Averaged across all cards.
export function computeProgressRatio(cards: Card[], states: CardStates): number {
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

// Combining diacritics (deliberately without U+0308 - umlaut is retained)
const DIACRITICS = /[\u0300\u0301\u0304\u0306\u0313\u0314\u0342\u0345]/g;

export function pureFront(front: string): string {
    let s = front;

    s = s.replace(/\s*\([^)]*\)/g, "");
    s = s.replace(/\s*\bmit\s+\S+/gi, "");
    s = s.replace(/\s*\bm\.\s*\S+/gi, "");
    s = s.replace(/\s*\+\s*\S+/g, "");
    s = s.replace(/,.*$/s, "");

    s = s.normalize("NFD").replace(DIACRITICS, "").normalize("NFC");
    return s.trim().replace(/\s+/g, " ");
}

export function displayFront(card: RawCard, pureMode: boolean): string {
    if (!pureMode) return card.front;
    const p = pureFront(card.front);
    return p || card.front;
}

export function displayBack(card: RawCard, pureMode: boolean): string {
    if (!pureMode) return card.back;
    return `${card.front}: ${card.back}`;
}
