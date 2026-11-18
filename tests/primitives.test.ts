import { describe, expect, test } from "bun:test";
import { ErrorCode, NscError } from "#lib/core/errors";
import { makeEpochMs, makeNonEmptyArray, nowEpochMs } from "#lib/core/primitives";

describe("makeEpochMs", () => {
    test("accepts non-negative integers", () => {
        expect(makeEpochMs(0)).toBe(0);
        expect(makeEpochMs(1718000000000)).toBe(1718000000000);
    });

    test("rejects negatives, floats, NaN", () => {
        for (const bad of [-1, 1.5, NaN, Infinity]) {
            try {
                makeEpochMs(bad);
                throw new Error("should have thrown");
            } catch (e) {
                expect(e instanceof NscError && e.code === ErrorCode.EPOCH_INVALID).toBe(true);
            }
        }
    });

    test("nowEpochMs returns a valid EpochMs", () => {
        const now = nowEpochMs();
        expect(Number.isInteger(now)).toBe(true);
        expect(now >= 0).toBe(true);
    });
});

describe("makeNonEmptyArray", () => {
    test("rejects the empty array", () => {
        try {
            makeNonEmptyArray([]);
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.EMPTY_ARRAY).toBe(true);
        }
    });

    test("accepts non-empty", () => {
        expect(makeNonEmptyArray([1, 2])).toEqual([1, 2]);
    });
});
