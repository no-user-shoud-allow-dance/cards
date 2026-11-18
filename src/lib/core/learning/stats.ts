import type { Card, DeckDocument, Tag } from "#lib/core/deck/document";
import { BOX_COUNT } from "#lib/core/learning/leitner";
import type { CardState, DeckState } from "#lib/core/learning/state";

/**
 * Box distribution: how many of the deck's cards sit in each box
 * 1..BOX_COUNT. Cards without state count as box 1.
 */
export function boxDistribution(cards: Card[], states: Record<string, CardState>): number[] {
    const dist = new Array<number>(BOX_COUNT).fill(0);
    for (const card of cards) {
        const box = states[card.id]?.box ?? 1;
        dist[Math.min(Math.max(box, 1), BOX_COUNT) - 1]!++;
    }
    return dist;
}

/** Weighted learning progress: box 1 = 0 %, box BOX_COUNT = 100 %. */
export function progressRatio(cards: Card[], states: Record<string, CardState>): number {
    if (cards.length === 0) return 0;
    let sum = 0;
    for (const card of cards) {
        const box = states[card.id]?.box ?? 1;
        sum += (box - 1) / (BOX_COUNT - 1);
    }
    return sum / cards.length;
}

export interface TagStats {
    total: number;
    /** Cards in the last box (learned). */
    learned: number;
    /** Cards currently hidden (moon). */
    hidden: number;
}

/** Per-tag aggregates over the deck's cards. */
export function tagStats(doc: DeckDocument, states: DeckState["cards"]): Record<Tag, TagStats> {
    const out: Record<string, TagStats> = {};
    for (const card of doc.cards) {
        for (const tag of card.tags) {
            const entry = (out[tag] ??= { total: 0, learned: 0, hidden: 0 });
            entry.total++;
            if (card.hidden) entry.hidden++;
            if ((states[card.id]?.box ?? 1) >= BOX_COUNT) entry.learned++;
        }
    }
    return out as Record<Tag, TagStats>;
}

/** "18/42 Karten gesehen" — overview progress as a count pair. */
export function overviewProgress(
    state: DeckState,
    cardCount: number
): { seen: number; total: number } {
    let seen = 0;
    for (const card of Object.values(state.cards)) if (card.overviewDone) seen++;
    return { seen: Math.min(seen, cardCount), total: cardCount };
}
