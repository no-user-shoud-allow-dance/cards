import { describe, expect, test } from "bun:test";
import { setDeckTitleSource, formatDeckSource } from "#lib/core/deck/format";
import { makeRawMarkdown, parseCollect } from "#lib/core/deck/parse";

describe("format: blank lines around the title", () => {
    test("one blank line after the title (no frontmatter)", () => {
        expect(formatDeckSource("# T\namo - lieben\n")).toBe("# T\n\namo - lieben\n");
    });

    test("one blank line before and after the title (with frontmatter)", () => {
        const src = "---\ntype: latin\n---\n# T\namo - lieben\n";
        expect(formatDeckSource(src)).toBe("---\ntype: latin\n---\n\n# T\n\namo - lieben\n");
    });

    test("multiple blank lines around the title collapse to one", () => {
        const src = "---\ntype: latin\n---\n\n\n\n# T\n\n\n\namo - lieben\n";
        expect(formatDeckSource(src)).toBe("---\ntype: latin\n---\n\n# T\n\namo - lieben\n");
    });

    test("no blank line added before the title at the start of the file", () => {
        expect(formatDeckSource("# T\namo - lieben\n")).toBe("# T\n\namo - lieben\n");
        // leading blanks are dropped: the title is the first line
        expect(formatDeckSource("\n\n# T\namo - lieben\n")).toBe("# T\n\namo - lieben\n");
    });

    test("no blank line added after the title when it is the last line", () => {
        expect(formatDeckSource("# T")).toBe("# T");
        expect(formatDeckSource("# T\n")).toBe("# T\n");
        expect(formatDeckSource("---\n---\n# T\n")).toBe("---\n---\n\n# T\n");
    });

    test("blank line between a leading comment and the title", () => {
        expect(formatDeckSource("// c\n# T\namo - lieben\n")).toBe("// c\n\n# T\n\namo - lieben\n");
    });

    test("already formatted input is unchanged (idempotent)", () => {
        const src = "---\ntype: latin\n---\n\n# T\n\namo - lieben #verb *\n";
        expect(formatDeckSource(src)).toBe(src);
        expect(formatDeckSource(formatDeckSource(src))).toBe(src);
    });
});

describe("format: per-line space trim", () => {
    test("trailing spaces and tabs are trimmed on every line", () => {
        expect(formatDeckSource("# T  \namo - lieben\t\n// c   \n")).toBe(
            "# T\n\namo - lieben\n// c\n"
        );
    });

    test("a line that is only spaces becomes empty", () => {
        expect(formatDeckSource("# T\n   \namo - lieben\n")).toBe("# T\n\namo - lieben\n");
    });

    test("interior spaces are kept", () => {
        expect(formatDeckSource("# T\namo  -  lieben x\n")).toBe("# T\n\namo  -  lieben x\n");
    });

    test("CRLF: spaces before the \\r are trimmed, line ending kept", () => {
        expect(formatDeckSource("# T\r\namo - lieben  \r\n")).toBe("# T\r\n\r\namo - lieben\r\n");
    });

    test("space trim applies even without a title", () => {
        expect(formatDeckSource("amo - lieben  \n")).toBe("amo - lieben\n");
        expect(formatDeckSource("")).toBe("");
    });

    test("idempotent", () => {
        const src = "# T \n\n\namo - lieben\t\n";
        expect(formatDeckSource(formatDeckSource(src))).toBe(formatDeckSource(src));
    });
});

describe("format: conservative on invalid input", () => {
    test("no title (card first) → unchanged", () => {
        const src = "amo - lieben\n";
        expect(formatDeckSource(src)).toBe(src);
    });

    test("unterminated frontmatter → unchanged", () => {
        const src = "---\ntype: latin\n# T\n";
        expect(formatDeckSource(src)).toBe(src);
    });

    test("empty source → unchanged", () => {
        expect(formatDeckSource("")).toBe("");
    });

    test("internal blank lines elsewhere are preserved", () => {
        const src = "# T\n\namo - lieben\n\n\namas - du liebst\n";
        // only the title boundary is normalized; the gap between cards stays
        expect(formatDeckSource(src)).toBe("# T\n\namo - lieben\n\n\namas - du liebst\n");
    });

    test("trailing newline is preserved, CRLF content is preserved byte-for-byte outside the title boundary", () => {
        expect(formatDeckSource("# T\r\namo - lieben\r\n")).toBe("# T\r\n\r\namo - lieben\r\n");
        expect(formatDeckSource("# T\namo - lieben")).toBe("# T\n\namo - lieben");
    });
});

describe("setDeckTitleSource", () => {
    test("replaces an existing H1", () => {
        expect(setDeckTitleSource("# Alt\namo - lieben\n", "Draft-1")).toBe(
            "# Draft-1\namo - lieben\n"
        );
    });

    test("replaces the H1 after a frontmatter block, cards stay verbatim", () => {
        const src = "---\ntype: latin\nauthor: x\n---\n\n# Alt\n\namo - lieben #verb *\n";
        expect(setDeckTitleSource(src, "Draft-2")).toBe(
            "---\ntype: latin\nauthor: x\n---\n\n# Draft-2\n\namo - lieben #verb *\n"
        );
    });

    test("inserts the H1 when the source has none (card first)", () => {
        expect(setDeckTitleSource("amo - lieben\n", "Draft-1")).toBe("# Draft-1\namo - lieben\n");
    });

    test("inserts the H1 after the frontmatter when the body has none", () => {
        const src = "---\ntype: english\n---\namo - lieben\n";
        expect(setDeckTitleSource(src, "Draft-3")).toBe(
            "---\ntype: english\n---\n# Draft-3\namo - lieben\n"
        );
    });

    test("result parses with the new title", () => {
        const out = setDeckTitleSource("---\ntype: greek\n---\n# Alt\nα - a\n", "Draft-7");
        const { doc, errors } = parseCollect(makeRawMarkdown(out));
        expect(errors).toHaveLength(0);
        expect(String(doc?.title)).toBe("Draft-7");
        expect(doc?.type).toBe("greek");
    });
});
