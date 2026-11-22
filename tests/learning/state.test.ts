import { describe, expect, test } from "bun:test";
import { makeEpochMs } from "#lib/core/primitives";
import { cardIdFromString } from "#lib/core/deck/ids";
import { deckHashFromString } from "#lib/core/deck/hash";
import { SPECIAL_FOLDERS, parseFolderName } from "#lib/core/deck/identity";
import {
    answerCard,
    isOverviewComplete,
    markOverviewDone,
    mergeDeckStates,
    newCardState,
    newDeckState,
    recordStudyTime,
    type CardState,
    type DeckState,
} from "#lib/core/learning/state";

const hash = deckHashFromString("0123456789abcdef");
const c1 = cardIdFromString("0000000000000001");
const c2 = cardIdFromString("0000000000000002");
const t0 = makeEpochMs(1000);
const t1 = makeEpochMs(2000);

describe("answerCard", () => {
    test("correct: box up, streak up, timestamp set", () => {
        const s = answerCard(newDeckState(hash, t0), c1, true, t1);
        expect(s.cards[c1]!.box).toBe(2);
        expect(s.cards[c1]!.lastReviewed).toBe(t1);
        expect(s.streak).toBe(1);
        expect(s.updatedAt).toBe(t1);
        expect(s.cards[c1]!.lapses).toBe(0);
    });
    test("wrong: back to box 1, lapse counted, streak reset", () => {
        let s = answerCard(newDeckState(hash, t0), c1, true, t1);
        s = answerCard(s, c1, true, t1);
        expect(s.cards[c1]!.box).toBe(3);
        s = answerCard(s, c1, false, t1);
        expect(s.cards[c1]!.box).toBe(1);
        expect(s.cards[c1]!.lapses).toBe(1);
        expect(s.streak).toBe(0);
    });
    test("original state is not mutated", () => {
        const base = newDeckState(hash, t0);
        answerCard(base, c1, true, t1);
        expect(base.cards[c1]).toBeUndefined();
        expect(base.streak).toBe(0);
    });
});

describe("overview", () => {
    test("markOverviewDone sets the flag", () => {
        const s = markOverviewDone(newDeckState(hash, t0), c1, t1);
        expect(s.cards[c1]!.overviewDone).toBe(true);
    });
    test("isOverviewComplete is derived, never stored", () => {
        let s = newDeckState(hash, t0);
        expect(isOverviewComplete(s, 0)).toBe(false);
        s = markOverviewDone(s, c1, t1);
        expect(isOverviewComplete(s, 1)).toBe(true);
        // adding a card to a "complete" deck makes it incomplete again
        expect(isOverviewComplete(s, 2)).toBe(false);
        s = markOverviewDone(s, c2, t1);
        expect(isOverviewComplete(s, 2)).toBe(true);
    });
});

describe("recordStudyTime", () => {
    test("new deck starts at 0", () => {
        expect(newDeckState(hash, t0).studyTime).toBe(0);
    });
    test("accumulates ms and bumps updatedAt", () => {
        let s = recordStudyTime(newDeckState(hash, t0), 1500, t1);
        s = recordStudyTime(s, 500, t1);
        expect(s.studyTime).toBe(2000);
        expect(s.updatedAt).toBe(t1);
    });
});

describe("mergeDeckStates", () => {
    const cardState = (box: number, lastReviewed: number | null, overviewDone = false) => ({
        ...newCardState(c1, t0),
        box: box as CardState["box"],
        lastReviewed: lastReviewed === null ? null : makeEpochMs(lastReviewed),
        overviewDone,
    });

    test("deck-level fields follow the newer updatedAt", () => {
        const a: DeckState = {
            ...newDeckState(hash, t0),
            streak: 5,
            updatedAt: makeEpochMs(100),
            cards: { [c1]: cardState(3, 90) },
        };
        const b: DeckState = {
            ...newDeckState(hash, t0),
            streak: 1,
            updatedAt: makeEpochMs(200),
            cards: { [c1]: cardState(2, 50) },
        };
        const m = mergeDeckStates(a, b);
        expect(m.streak).toBe(1); // b is newer
        expect(m.updatedAt).toBe(200);
        // per-card: a's review (90) is newer than b's (50) → a's card wins
        expect(m.cards[c1]!.box).toBe(3);
    });

    test("tie on lastReviewed: higher box wins, flags OR-merge", () => {
        const a: DeckState = {
            ...newDeckState(hash, t0),
            updatedAt: makeEpochMs(100),
            cards: { [c1]: cardState(2, null, false) },
        };
        const b: DeckState = {
            ...newDeckState(hash, t0),
            updatedAt: makeEpochMs(100),
            cards: { [c1]: cardState(4, null, true) },
        };
        const m = mergeDeckStates(a, b);
        expect(m.cards[c1]!.box).toBe(4);
        expect(m.cards[c1]!.overviewDone).toBe(true);
    });

    test("studyTime merges by max (monotonic counter)", () => {
        const a: DeckState = { ...newDeckState(hash, t0), studyTime: 5000 };
        const b: DeckState = { ...newDeckState(hash, t0), studyTime: 3000 };
        expect(mergeDeckStates(a, b).studyTime).toBe(5000);
        expect(mergeDeckStates(b, a).studyTime).toBe(5000);
    });

    test("cards present on only one side survive", () => {
        const a: DeckState = {
            ...newDeckState(hash, t0),
            updatedAt: makeEpochMs(100),
            cards: { [c1]: cardState(2, 10) },
        };
        const b: DeckState = {
            ...newDeckState(hash, t0),
            updatedAt: makeEpochMs(100),
            cards: { [c2]: cardState(5, 10) },
        };
        const m = mergeDeckStates(a, b);
        expect(Object.keys(m.cards).sort()).toEqual([c1, c2]);
    });

    test("folders are device-local: the first (local) argument's folders win", () => {
        const a: DeckState = { ...newDeckState(hash, t0), folders: [parseFolderName("Latein")] };
        const b: DeckState = { ...newDeckState(hash, makeEpochMs(9999)) };
        // b is newer — folders still must not be taken from it
        const m = mergeDeckStates(a, b);
        expect(m.folders).toEqual([parseFolderName("Latein")]);
    });

    test("folders survive a merge when only the remote side carries newer cards", () => {
        const a: DeckState = {
            ...newDeckState(hash, t0),
            folders: [SPECIAL_FOLDERS.pinned, parseFolderName("Latein")],
            updatedAt: makeEpochMs(100),
            cards: {},
        };
        const b: DeckState = {
            ...newDeckState(hash, t0),
            updatedAt: makeEpochMs(200),
            cards: { [c1]: cardState(2, 150) },
        };
        const m = mergeDeckStates(a, b);
        expect(m.folders).toEqual([SPECIAL_FOLDERS.pinned, parseFolderName("Latein")]);
        expect(m.cards[c1]).toBeDefined();
    });

    test("folders absent on the local side stay absent (readers fall back)", () => {
        const a: DeckState = { ...newDeckState(hash, t0) };
        const b: DeckState = { ...newDeckState(hash, t0), folders: [parseFolderName("Latein")] };
        expect(mergeDeckStates(a, b).folders).toBeUndefined();
    });

    test("pure-mode override is device-local and survives merges both ways", () => {
        const on: DeckState = { ...newDeckState(hash, t0), pureMode: true };
        const plain: DeckState = { ...newDeckState(hash, makeEpochMs(9999)) };
        // local override wins even against a newer remote record
        expect(mergeDeckStates(on, plain).pureMode).toBe(true);
        // no local override → none is invented from the remote side
        expect(mergeDeckStates(plain, { ...plain, pureMode: true }).pureMode).toBeUndefined();
    });
});
