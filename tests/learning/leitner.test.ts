import { describe, expect, test } from "bun:test";
import { ErrorCode, NscError } from "#lib/core/errors";
import {
    BOX_COUNT,
    BOX_ROMANS,
    demote,
    initialBox,
    makeBox,
    promote,
} from "#lib/core/learning/leitner";

describe("makeBox", () => {
    test("accepts 0..BOX_COUNT", () => {
        expect(makeBox(0)).toBe(0);
        expect(makeBox(BOX_COUNT)).toBe(BOX_COUNT);
    });
    test("rejects out-of-range and non-integers", () => {
        for (const bad of [-1, BOX_COUNT + 1, 1.5, NaN]) {
            try {
                makeBox(bad);
                throw new Error("should have thrown");
            } catch (e) {
                expect(e instanceof NscError && e.code === ErrorCode.BOX_OUT_OF_RANGE).toBe(true);
            }
        }
    });
});

describe("transitions", () => {
    test("a new card starts in box 1", () => {
        expect(initialBox()).toBe(1);
    });
    test("correct promotes one box, capped at BOX_COUNT", () => {
        expect(promote(makeBox(1))).toBe(2);
        expect(promote(makeBox(BOX_COUNT))).toBe(BOX_COUNT);
    });
    test("wrong demotes to box 1", () => {
        expect(demote(makeBox(5))).toBe(1);
    });
    test("roman numerals cover boxes 1..BOX_COUNT-1 (learned label is UI wording)", () => {
        expect(BOX_ROMANS).toHaveLength(BOX_COUNT - 1);
        expect(BOX_ROMANS[0]).toBe("I");
        expect(BOX_ROMANS[BOX_COUNT - 2]).toBe("V");
    });
});
