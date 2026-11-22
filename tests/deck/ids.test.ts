import { describe, expect, test } from "bun:test";
import { ErrorCode, NscError } from "#lib/core/errors";
import { cardIdFromString, isCardId, makeCardId } from "#lib/core/deck/ids";
import type { StyledText } from "#lib/core/deck/document";

const front: StyledText = {
    plain: "amo",
    spans: [{ style: "bold", start: 0, end: 3 }],
    images: [],
};
const back: StyledText = { plain: "lieben", spans: [], images: [] };

describe("makeCardId", () => {
    test("deterministic content hash, 16 hex chars", () => {
        const id = makeCardId(front, back);
        expect(id).toBe(makeCardId(front, back));
        expect(isCardId(id)).toBe(true);
    });

    test("depends on front and back content, including spans", () => {
        const plain = makeCardId({ plain: "amo", spans: [], images: [] }, back);
        expect(plain).not.toBe(makeCardId(front, back));
        expect(makeCardId(front, { plain: "liebt", spans: [], images: [] })).not.toBe(
            makeCardId(front, back)
        );
    });

    test("inserting/deleting other cards cannot shift it (pure function of its own sides)", () => {
        // same sides in two different decks → same id
        expect(makeCardId(front, back)).toBe(makeCardId({ ...front }, { ...back }));
    });
});

describe("cardIdFromString", () => {
    test("valid 16-hex brands", () => {
        expect(cardIdFromString("0123456789abcdef")).toBe("0123456789abcdef");
    });
    test("invalid throws LINK_BAD_SHAPE", () => {
        for (const bad of ["", "zz", "0123456789abcde", "0123456789abcdefg"]) {
            try {
                cardIdFromString(bad);
                throw new Error("should have thrown");
            } catch (e) {
                expect(e instanceof NscError && e.code === ErrorCode.LINK_BAD_SHAPE).toBe(true);
            }
        }
    });
});
