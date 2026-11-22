import { describe, expect, test } from "bun:test";
import { ErrorCode, NscError } from "#lib/core/errors";
import { extractHints, makeHint, plainWithoutHints, withHintBrackets } from "#lib/core/deck/hints";
import { asRawCardSide, parseInlineSide } from "#lib/core/deck/inline";
import type { Card } from "#lib/core/deck/document";
import { makeCardId } from "#lib/core/deck/ids";

describe("extractHints", () => {
    test("strips brackets, keeps content, range into new plain", () => {
        const { plain, spans, hints } = extractHints("ἀγάπη [Liebe]", [], "front");
        expect(plain).toBe("ἀγάπη Liebe");
        expect(hints).toEqual([{ side: "front", start: 6, end: 11 }]);
        expect(spans).toEqual([]);
    });

    test("no brackets → no hints", () => {
        expect(extractHints("plain", [], "back").hints).toEqual([]);
    });

    test("unclosed bracket → no hint", () => {
        expect(extractHints("a [b", [], "front").hints).toEqual([]);
    });

    test("multiple bracket pairs on one side are all extracted", () => {
        const { plain, hints } = extractHints("[a] und [b]", [], "front");
        expect(plain).toBe("a und b");
        expect(hints).toEqual([
            { side: "front", start: 0, end: 1 },
            { side: "front", start: 6, end: 7 },
        ]);
    });

    test("image tokens are skipped — their brackets are no hints", () => {
        const { plain, hints } = extractHints("![Katze](https://x.de/k.jpg) [Liebe]", [], "front");
        expect(plain).toBe("![Katze](https://x.de/k.jpg) Liebe");
        expect(hints).toEqual([{ side: "front", start: 29, end: 34 }]);
    });

    test("spans after the hint are remapped", () => {
        const text = parseInlineSide(asRawCardSide("[x] **fett**"));
        const { plain, spans, hints } = extractHints(text.plain, text.spans, "front");
        expect(plain).toBe("x fett");
        expect(hints).toEqual([{ side: "front", start: 0, end: 1 }]);
        expect(spans).toEqual([{ style: "bold", start: 2, end: 6 }]);
    });
});

describe("makeHint invariants", () => {
    test("valid range", () => {
        expect(makeHint("back", 0, 2, 5)).toEqual({ side: "back", start: 0, end: 2 });
    });
    test("invalid range throws", () => {
        try {
            makeHint("front", 3, 3, 5);
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.HINT_INVALID).toBe(true);
        }
    });
});

describe("plainWithoutHints", () => {
    test("removes all hint content of the given side", () => {
        const front = parseInlineSide(asRawCardSide("ἀγάπη [Liebe] und [affection]"));
        const stripped = extractHints(front.plain, front.spans, "front");
        const card = {
            id: makeCardId(front, front),
            front: { plain: stripped.plain, spans: stripped.spans, images: [] },
            back: { plain: "love", spans: [], images: [] },
            hints: stripped.hints,
            tags: [],
            hidden: false,
        } as Card;
        expect(plainWithoutHints(card, "front")).toBe("ἀγάπη  und ");
        expect(plainWithoutHints(card, "back")).toBe("love");
    });
});

describe("withHintBrackets", () => {
    test("re-inserts brackets around each range", () => {
        const text = {
            plain: "a und b",
            spans: [],
            images: [],
        };
        const out = withHintBrackets(text, [
            { side: "front", start: 0, end: 1 },
            { side: "front", start: 6, end: 7 },
        ]);
        expect(out.plain).toBe("[a] und [b]");
    });
});
