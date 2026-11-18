import { describe, expect, test } from "bun:test";
import { ErrorCode, NscError } from "#lib/core/errors";
import {
    asRawCardSide,
    escapeCardSide,
    imageTokensToAltText,
    isValidImageUrl,
    makeSpan,
    parseInlineSide,
    serializeInlineSide,
    stripImageTokens,
    unescapeCardSide,
} from "#lib/core/deck/inline";

describe("parseInlineSide", () => {
    test("plain text passes through", () => {
        const t = parseInlineSide(asRawCardSide("amo"));
        expect(t.plain).toBe("amo");
        expect(t.spans).toEqual([]);
        expect(t.images).toEqual([]);
    });

    test("bold span offsets", () => {
        const t = parseInlineSide(asRawCardSide("ich **liebe** dich"));
        expect(t.plain).toBe("ich liebe dich");
        expect(t.spans).toEqual([{ style: "bold", start: 4, end: 9 }]);
    });

    test("nested styles become overlapping spans", () => {
        const t = parseInlineSide(asRawCardSide("**fett *kursiv* rest**"));
        expect(t.plain).toBe("fett kursiv rest");
        expect(t.spans).toEqual([
            { style: "bold", start: 0, end: 16 },
            { style: "italic", start: 5, end: 11 },
        ]);
    });

    test("unknown markup stays literal", () => {
        const t = parseInlineSide(asRawCardSide("a ~~b~~ c"));
        // ~~ IS a known delimiter (strike) — use a truly unknown one:
        const t2 = parseInlineSide(asRawCardSide("a @@b@@ c"));
        expect(t2.plain).toBe("a @@b@@ c");
        expect(t.plain).toBe("a b c");
        expect(t.spans).toEqual([{ style: "strike", start: 2, end: 3 }]);
    });

    test("unmatched delimiter stays literal", () => {
        const t = parseInlineSide(asRawCardSide("a **b"));
        expect(t.plain).toBe("a **b");
        expect(t.spans).toEqual([]);
    });

    test("https image is collected, token stays in plain", () => {
        const t = parseInlineSide(asRawCardSide("sieh ![Bild](https://x.de/a.png) an"));
        expect(t.plain).toContain("![Bild](https://x.de/a.png)");
        expect(t.images).toEqual([{ alt: "Bild", url: "https://x.de/a.png" }]);
    });

    test("non-https image URL throws", () => {
        try {
            parseInlineSide(asRawCardSide("![x](javascript:alert(1))"));
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.PARSE_INVALID_IMAGE_URL).toBe(
                true
            );
        }
    });

    test("more than one image throws", () => {
        try {
            parseInlineSide(asRawCardSide("![a](https://x.de/1.png) ![b](https://x.de/2.png)"));
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.PARSE_TOO_MANY_IMAGES).toBe(true);
        }
    });

    test("image token is atomic: delimiters inside alt/URL stay verbatim", () => {
        const t = parseInlineSide(asRawCardSide("![my *cat*](https://x.de/a_(1).png)"));
        expect(t.plain).toBe("![my *cat*](https://x.de/a_(1).png)");
        expect(t.spans).toEqual([]);
        expect(t.images).toEqual([{ alt: "my *cat*", url: "https://x.de/a_(1).png" }]);
    });
});

describe("makeSpan invariants", () => {
    test("rejects start >= end and out-of-range", () => {
        expect(makeSpan("bold", 0, 1, 1)).toEqual({ style: "bold", start: 0, end: 1 });
        for (const [s, e, len] of [
            [1, 1, 5],
            [-1, 2, 5],
            [0, 6, 5],
        ] as const) {
            try {
                makeSpan("bold", s, e, len);
                throw new Error("should have thrown");
            } catch (err) {
                expect(err instanceof NscError && err.code === ErrorCode.SPAN_INVALID).toBe(true);
            }
        }
    });
});

describe("escape/unescape round-trip", () => {
    test("newline and backslash", () => {
        const raw = "a\nb\\c";
        expect(unescapeCardSide(escapeCardSide(raw))).toBe(raw);
    });
    test("unknown escape stays", () => {
        expect(unescapeCardSide("a\\zb")).toBe("a\\zb");
    });
});

describe("serializeInlineSide round-trip", () => {
    test("styles re-serialize and re-parse to the same spans", () => {
        const t = parseInlineSide(asRawCardSide("ich **liebe** dich"));
        const back = serializeInlineSide(t);
        expect(back).toBe("ich **liebe** dich");
        expect(parseInlineSide(back).spans).toEqual(t.spans);
    });
});

describe("isValidImageUrl", () => {
    test("https only, any pathname", () => {
        expect(isValidImageUrl("https://x.de/a.png")).toBe(true);
        expect(isValidImageUrl("https://x.de/no-extension")).toBe(true);
        expect(isValidImageUrl("https://x.de/a_(1).png")).toBe(true);
        expect(isValidImageUrl("http://x.de/a.png")).toBe(false);
        expect(isValidImageUrl("data:image/png;base64,x")).toBe(false);
        expect(isValidImageUrl("not a url")).toBe(false);
    });
});

describe("stripImageTokens / imageTokensToAltText", () => {
    test("strip removes all image tokens", () => {
        expect(stripImageTokens("a ![Bild](https://x.de/a.png) b")).toBe("a  b");
        expect(stripImageTokens("![a](https://x.de/1.png)![b](https://x.de/2.png)")).toBe("");
        expect(stripImageTokens("kein Bild hier")).toBe("kein Bild hier");
    });
    test("alt text replaces the token, url is dropped", () => {
        expect(imageTokensToAltText("a ![Bild](https://x.de/a.png) b")).toBe("a Bild b");
        expect(imageTokensToAltText("![](https://x.de/a.png)")).toBe("");
    });
});
