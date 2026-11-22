import { describe, expect, test } from "bun:test";
import {
    removeDelimiterPair,
    structureSignature,
    tokenizeEditorSource,
    wrapRange,
} from "#lib/core/deck/editor";

describe("tokenizeEditorSource", () => {
    test("plain text is a single text token", () => {
        const tokens = tokenizeEditorSource("amo");
        expect(tokens).toEqual([{ type: "text", raw: "amo", start: 0, end: 3 }]);
    });

    test("delimiter pairs open and close", () => {
        const tokens = tokenizeEditorSource("a **b** c");
        expect(tokens.map((t) => [t.type, t.raw])).toEqual([
            ["text", "a "],
            ["open", "**"],
            ["text", "b"],
            ["close", "**"],
            ["text", " c"],
        ]);
        expect(tokens[1]).toMatchObject({ style: "bold" });
    });

    test("longest delimiter wins at the same position", () => {
        const tokens = tokenizeEditorSource("**b**");
        expect(tokens.filter((t) => t.type !== "text").map((t) => t.raw)).toEqual(["**", "**"]);
    });

    test("unmatched delimiter opens and stays open", () => {
        const tokens = tokenizeEditorSource("a **b");
        expect(tokens.map((t) => t.type)).toEqual(["text", "open", "text"]);
    });

    test("hint brackets become hint tokens, content stays text", () => {
        const tokens = tokenizeEditorSource("ἀγάπη [Liebe]");
        expect(tokens.map((t) => t.type)).toEqual(["text", "hint-open", "text", "hint-close"]);
    });

    test("image token is one leaf, its brackets are not hints", () => {
        const tokens = tokenizeEditorSource("a ![alt](https://x.test/i.png) b");
        const image = tokens.find((t) => t.type === "image");
        expect(image).toMatchObject({ raw: "![alt](https://x.test/i.png)" });
        expect(tokens.some((t) => t.type === "hint-open")).toBe(false);
    });

    test("offsets address the original source", () => {
        const source = "a **b** [c]";
        for (const token of tokenizeEditorSource(source)) {
            expect(source.slice(token.start, token.end)).toBe(token.raw);
        }
    });
});

describe("structureSignature", () => {
    test("plain text has an empty signature", () => {
        expect(structureSignature("amo")).toBe("");
    });

    test("paired delimiter contributes chip + live entries", () => {
        expect(structureSignature("a **b**")).toBe("C**|Lbold|C**");
    });

    test("hint and image contribute live entries", () => {
        expect(structureSignature("[x] ![a](https://x.test/i.png)")).toBe("Lhint|Limage");
    });

    test("delimiter left open at the end still contributes entries", () => {
        expect(structureSignature("a ** b** c **")).toBe("C**|Lbold|C**|C**|Lbold");
    });
});

describe("wrapRange", () => {
    test("wraps the range in the style delimiters", () => {
        expect(wrapRange("ich liebe dich", 4, 9, "bold")).toBe("ich **liebe** dich");
    });

    test("clamps and swaps out-of-order ranges", () => {
        expect(wrapRange("abc", 2, 1, "italic")).toBe("a*b*c");
        expect(wrapRange("abc", -5, 99, "code")).toBe("`abc`");
    });
});

describe("removeDelimiterPair", () => {
    test("removes the pair around the content", () => {
        expect(removeDelimiterPair("ich **liebe** dich", 4)).toEqual({
            text: "ich liebe dich",
            caret: 4,
        });
    });

    test("clicking the closing delimiter removes both", () => {
        const source = "ich **liebe** dich";
        const closePos = source.indexOf("**", 5);
        expect(removeDelimiterPair(source, closePos)).toEqual({
            text: "ich liebe dich",
            caret: closePos,
        });
    });

    test("nesting-aware: removes the matching counterpart only", () => {
        // Stack pairing (same as the inline parser): (0..2, 4..6) and
        // (7..9, 11..13) — clicking the open at 7 removes its pair, so
        // only the outer pair (0..2, 4..6) survives as text.
        const source = "**a **b** c**";
        expect(removeDelimiterPair(source, 7)).toEqual({ text: "**a **b c", caret: 7 });
    });

    test("unclosed opening delimiter loses only itself", () => {
        expect(removeDelimiterPair("a **b", 2)).toEqual({ text: "a b", caret: 2 });
    });

    test("returns null when no delimiter starts at pos", () => {
        expect(removeDelimiterPair("plain text", 0)).toBeNull();
        expect(removeDelimiterPair("a **b**", 1)).toBeNull();
    });
});
