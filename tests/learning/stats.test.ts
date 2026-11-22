import { describe, expect, test } from "bun:test";
import { makeEpochMs } from "#lib/core/primitives";
import { cardIdFromString } from "#lib/core/deck/ids";
import { deckHashFromString } from "#lib/core/deck/hash";
import { makeBox } from "#lib/core/learning/leitner";
import { newDeckState, type CardState } from "#lib/core/learning/state";
import {
    boxDistribution,
    overviewProgress,
    progressRatio,
    tagStats,
} from "#lib/core/learning/stats";
import { makeRawMarkdown, makeTag, parse } from "#lib/core/deck/parse";
import type { Card } from "#lib/core/deck/document";

const c1 = cardIdFromString("0000000000000001");
const c2 = cardIdFromString("0000000000000002");
const c3 = cardIdFromString("0000000000000003");

function mkCard(id: typeof c1): Card {
    return {
        id,
        front: { plain: id, spans: [], images: [] },
        back: { plain: "b", spans: [], images: [] },
        hints: [],
        tags: [],
        hidden: false,
    };
}
const cards = [mkCard(c1), mkCard(c2), mkCard(c3)];
const state = (box: number): CardState => ({
    cardId: c1,
    box: makeBox(box),
    lapses: 0,
    lastReviewed: null,
    overviewDone: false,
});

describe("boxDistribution", () => {
    test("cards without state count as box 1", () => {
        expect(boxDistribution(cards, { [c1]: state(3) })).toEqual([2, 0, 1, 0, 0, 0]);
    });
    test("empty deck", () => {
        expect(boxDistribution([], {})).toEqual([0, 0, 0, 0, 0, 0]);
    });
});

describe("progressRatio", () => {
    test("box 1 = 0%, last box = 100%, averaged", () => {
        expect(progressRatio([], {})).toBe(0);
        expect(progressRatio(cards, {})).toBe(0);
        // c1 in box 3 → (3-1)/5 = 0.4; others 0 → 0.4/3
        expect(progressRatio(cards, { [c1]: state(3) })).toBeCloseTo(0.4 / 3, 10);
        expect(progressRatio(cards, { [c1]: state(6), [c2]: state(6), [c3]: state(6) })).toBe(1);
    });
});

describe("tagStats", () => {
    test("per-tag totals, learned and hidden counts", () => {
        const doc = parse(
            makeRawMarkdown(
                "# T\namo - lieben #verb\nportare - tragen #verb *\nhello - hallo #eng\n"
            )
        );
        const states = {
            [doc.cards[0]!.id]: state(6),
            [doc.cards[1]!.id]: { ...state(1), cardId: doc.cards[1]!.id },
        };
        const stats = tagStats(doc, states);
        expect(stats[makeTag("verb")]).toEqual({ total: 2, learned: 1, hidden: 1 });
        expect(stats[makeTag("eng")]).toEqual({ total: 1, learned: 0, hidden: 0 });
    });
});

describe("overviewProgress", () => {
    test("seen/total pair, capped at cardCount", () => {
        const hash = deckHashFromString("0123456789abcdef");
        let s = newDeckState(hash, makeEpochMs(0));
        s = {
            ...s,
            cards: {
                [c1]: { ...state(1), overviewDone: true },
                [c2]: { ...state(1), cardId: c2, overviewDone: true },
            },
        };
        expect(overviewProgress(s, 5)).toEqual({ seen: 2, total: 5 });
        expect(overviewProgress(s, 1)).toEqual({ seen: 1, total: 1 });
    });
});
