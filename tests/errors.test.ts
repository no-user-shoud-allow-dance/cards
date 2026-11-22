import { describe, expect, test } from "bun:test";
import { ErrorCode, isNscError, NscError } from "#lib/core/errors";

describe("NscError", () => {
    test("carries code and details", () => {
        const err = new NscError(ErrorCode.PARSE_MISSING_SEPARATOR, { line: 3 });
        expect(err.code).toBe("PARSE_MISSING_SEPARATOR");
        expect(err.details.line).toBe(3);
        expect(err.name).toBe("NscError");
        expect(err instanceof Error).toBe(true);
    });

    test("isNscError narrows", () => {
        expect(isNscError(new NscError(ErrorCode.TITLE_EMPTY))).toBe(true);
        expect(isNscError(new Error("x"))).toBe(false);
        expect(isNscError("x")).toBe(false);
    });
});
