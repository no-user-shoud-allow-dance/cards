import { describe, expect, test } from "bun:test";
import { ErrorCode, NscError } from "#lib/core/errors";
import { errorLinesOf, highlightDeckSource, type HighlightToken } from "#lib/core/deck/highlight";

const SAMPLE = [
    "---",
    "type: latin",
    "author: NSC Beispiel",
    "---",
    "",
    "# Beispiel: Lateinische Vokabeln",
    "",
    "// alte Karten, erst mal parken",
    "amo [amare] - ich liebe :: amo, amas, amat #verb *",
    "**vocare** - rufen",
    "sum, es, est - ich bin, du bist, er ist #unregelmäßig",
    "H~2~O - Wasser *",
    "![Katze](https://hosting.example/katze.jpg) - die Katze",
    "",
].join("\n");

const text = (tokens: HighlightToken[]): string => tokens.map((t) => t.text).join("");
const types = (tokens: HighlightToken[]): string[] => tokens.map((t) => t.type);
const ofType = (tokens: HighlightToken[], type: HighlightToken["type"]): HighlightToken[] =>
    tokens.filter((t) => t.type === type);

describe("highlight: round-trip invariant", () => {
    test("concatenated token texts reproduce the source exactly", () => {
        expect(text(highlightDeckSource(SAMPLE))).toBe(SAMPLE);
    });

    test("empty source yields no tokens", () => {
        expect(highlightDeckSource("")).toEqual([]);
    });

    test("trailing newline and trailing spaces survive", () => {
        const src = "# T\namo - lieben #verb *   \n";
        expect(text(highlightDeckSource(src))).toBe(src);
    });
});

describe("highlight: structural lines", () => {
    test("frontmatter: delimiters, keys, values", () => {
        const tokens = highlightDeckSource("---\ntype: latin\nauthor: Ada\n---\n");
        expect(types(tokens)).toEqual([
            "frontmatter-delimiter",
            "frontmatter-key",
            "frontmatter-value",
            "frontmatter-key",
            "frontmatter-value",
            "frontmatter-delimiter",
        ]);
        expect(ofType(tokens, "frontmatter-key").map((t) => t.text)).toEqual(["type:", "author:"]);
        expect(ofType(tokens, "frontmatter-value").map((t) => t.text)).toEqual([
            " latin\n",
            " Ada\n",
        ]);
    });

    test("leading blank lines before the frontmatter stay text", () => {
        const tokens = highlightDeckSource("\n\n---\ntype: greek\n---\n# T\n");
        expect(tokens[0]).toEqual({ type: "text", text: "\n" });
        expect(tokens[1]).toEqual({ type: "text", text: "\n" });
        expect(tokens[2]!.type).toBe("frontmatter-delimiter");
    });

    test("unterminated frontmatter: the whole rest is frontmatter", () => {
        const tokens = highlightDeckSource("---\ntype: latin\namo - lieben\n");
        expect(ofType(tokens, "frontmatter-key").map((t) => t.text)).toEqual([
            "type:",
            // "amo - lieben" has no colon → whole-line key with an empty
            // value (same as the parser), not a card separator.
            "amo - lieben\n",
        ]);
        expect(ofType(tokens, "separator")).toHaveLength(0);
    });

    test("title line: marker + text", () => {
        const tokens = highlightDeckSource("# Lektion 22\n");
        expect(types(tokens)).toEqual(["title-marker", "title-text"]);
        expect(tokens[1]!.text).toBe(" Lektion 22\n");
    });

    test("comment line", () => {
        const tokens = highlightDeckSource("// ein Kommentar\n");
        expect(types(tokens)).toEqual(["comment"]);
    });
});

describe("highlight: card lines", () => {
    test("separators: first ' - ' and the ' :: ' split the line", () => {
        const tokens = highlightDeckSource("amo - ich liebe :: ich liebe dich\n");
        expect(ofType(tokens, "separator").map((t) => t.text)).toEqual([" - ", " :: "]);
        expect(text(tokens)).toBe("amo - ich liebe :: ich liebe dich\n");
    });

    test("a ' - ' inside the back side is not a separator", () => {
        const tokens = highlightDeckSource("sum, es, est - ich bin, du bist\n");
        expect(ofType(tokens, "separator")).toHaveLength(1);
    });

    test("trailing tag and moon, with their gaps preserved", () => {
        const src = "amo - lieben #verb *\n";
        const tokens = highlightDeckSource(src);
        expect(text(tokens)).toBe(src);
        expect(ofType(tokens, "tag").map((t) => t.text)).toEqual(["#verb"]);
        expect(ofType(tokens, "moon").map((t) => t.text)).toEqual(["*"]);
    });

    test("a '#' not at the line end is no tag", () => {
        const tokens = highlightDeckSource("C# - Musik\n");
        expect(ofType(tokens, "tag")).toHaveLength(0);
        expect(text(tokens)).toBe("C# - Musik\n");
    });

    test("inline delimiters carry their style", () => {
        // Trailing " x" keeps the closing * off the line end, where it
        // would be a moon marker (same rule as the parser).
        const tokens = highlightDeckSource("**amo** - *lieben* x\n");
        const delims = ofType(tokens, "delim");
        expect(delims.map((t) => t.text)).toEqual(["**", "**", "*", "*"]);
        expect(delims.map((t) => t.style)).toEqual(["bold", "bold", "italic", "italic"]);
    });

    test("hint brackets are hint tokens", () => {
        const tokens = highlightDeckSource("amo [amare] - ich liebe\n");
        expect(ofType(tokens, "hint").map((t) => t.text)).toEqual(["[", "]"]);
    });

    test("image token is one leaf token", () => {
        const src = "![Katze](https://hosting.example/katze.jpg) - die Katze\n";
        const tokens = highlightDeckSource(src);
        expect(ofType(tokens, "image").map((t) => t.text)).toEqual([
            "![Katze](https://hosting.example/katze.jpg)",
        ]);
        expect(text(tokens)).toBe(src);
    });

    test("a trailing image is a line-end marker, not part of the back side", () => {
        const src = "amo - lieben #verb ![Katze](https://x.de/k.jpg) *\n";
        const tokens = highlightDeckSource(src);
        expect(text(tokens)).toBe(src);
        expect(ofType(tokens, "image").map((t) => t.text)).toEqual([
            "![Katze](https://x.de/k.jpg)",
        ]);
        expect(ofType(tokens, "tag")).toHaveLength(1);
        expect(ofType(tokens, "moon")).toHaveLength(1);
    });
});

describe("highlight: sample deck end to end", () => {
    test("every line kind appears and the round-trip holds", () => {
        const tokens = highlightDeckSource(SAMPLE);
        const kinds = new Set(types(tokens));
        for (const expected of [
            "frontmatter-delimiter",
            "frontmatter-key",
            "frontmatter-value",
            "title-marker",
            "comment",
            "separator",
            "tag",
            "moon",
            "delim",
            "hint",
            "image",
        ]) {
            expect(kinds.has(expected as HighlightToken["type"])).toBe(true);
        }
        expect(text(tokens)).toBe(SAMPLE);
    });
});

describe("highlight: error lines (squiggles)", () => {
    test("errorLinesOf maps 1-based details.line to 0-based lines, skips locationless errors", () => {
        const errors = [
            new NscError(ErrorCode.PARSE_MISSING_SEPARATOR, { line: 3 }),
            new NscError(ErrorCode.PARSE_MISSING_TITLE),
        ];
        expect([...errorLinesOf(errors)]).toEqual([2]);
    });

    test("tokens on error lines are flagged, round-trip still holds", () => {
        const src = "# T\namo lieben\nok - ok\n";
        const errors = [new NscError(ErrorCode.PARSE_MISSING_SEPARATOR, { line: 2 })];
        const tokens = highlightDeckSource(src, errorLinesOf(errors));
        expect(text(tokens)).toBe(src);
        const flagged = tokens
            .filter((t) => t.error === true)
            .map((t) => t.text)
            .join("");
        expect(flagged).toBe("amo lieben\n");
        const clean = tokens
            .filter((t) => t.error !== true)
            .map((t) => t.text)
            .join("");
        expect(clean).toBe("# T\nok - ok\n");
    });

    test("without error lines no token is flagged", () => {
        const tokens = highlightDeckSource("# T\namo lieben\n");
        expect(tokens.some((t) => t.error === true)).toBe(false);
    });
});
