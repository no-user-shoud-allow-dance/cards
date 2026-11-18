import { describe, expect, test } from "bun:test";
import { ErrorCode, NscError } from "#lib/core/errors";
import { makeRawMarkdown, parse, validate, makeTag } from "#lib/core/deck/parse";
import { isCardId } from "#lib/core/deck/ids";

const CANONICAL =
    [
        "---",
        "type: latin",
        "author: Ada",
        "custom: xyz",
        "---",
        "# Verben",
        "amo - lieben :: ich liebe dich #verb *",
        "**amo** - lieben",
    ].join("\n") + "\n";

describe("parse: canonical deck", () => {
    const doc = parse(makeRawMarkdown(CANONICAL));

    test("frontmatter: type is structural, known keys into meta, rest into extra", () => {
        expect(doc.type).toBe("latin");
        expect(doc.title).toBe("Verben");
        expect(doc.meta.author).toBe("Ada");
        expect(doc.meta.extra).toEqual({ custom: "xyz" });
    });

    test("card line: separator, context, trailing tag and moon", () => {
        const c = doc.cards[0]!;
        expect(isCardId(c.id)).toBe(true);
        expect(c.front.plain).toBe("amo");
        expect(c.back.plain).toBe("lieben");
        expect(c.context?.plain).toBe("ich liebe dich");
        expect(c.tags).toEqual(["verb"]);
        expect(c.hidden).toBe(true);
    });

    test("inline style in front becomes a span", () => {
        expect(doc.cards[1]!.front).toEqual({
            plain: "amo",
            spans: [{ style: "bold", start: 0, end: 3 }],
            images: [],
        });
    });
});

describe("parse: no frontmatter (auto-detect type)", () => {
    test("no frontmatter, no tags — type is auto-detected", () => {
        const doc = parse(makeRawMarkdown("# Vokabeln\nhello - hallo\n"));
        expect(doc.type).toBe("english");
        expect(doc.meta.extra).toEqual({});
        expect(doc.cards).toHaveLength(1);
        expect(doc.cards[0]!.tags).toEqual([]);
        expect(doc.cards[0]!.hidden).toBe(false);
    });

    test("greek fronts are detected", () => {
        const doc = parse(makeRawMarkdown("# Griechisch\nἀγάπη - Liebe\n"));
        expect(doc.type).toBe("greek");
    });

    test("full-line comments are skipped", () => {
        const doc = parse(makeRawMarkdown("# T\n// ein Kommentar\namo - lieben\n"));
        expect(doc.cards).toHaveLength(1);
    });
});

describe("parse: errors", () => {
    const codes = (raw: string) => validate(makeRawMarkdown(raw)).map((e) => e.code);

    test("missing title", () => {
        expect(codes("amo - lieben\n")).toEqual([ErrorCode.PARSE_MISSING_TITLE]);
    });
    test("missing separator", () => {
        expect(codes("# T\namo lieben\n")).toEqual([ErrorCode.PARSE_MISSING_SEPARATOR]);
    });
    test("empty side", () => {
        expect(codes("# T\n - back\n")).toEqual([ErrorCode.PARSE_EMPTY_SIDE]);
    });
    test("unterminated frontmatter", () => {
        expect(codes("---\ntype: latin\n# T\n")).toEqual([
            ErrorCode.PARSE_UNTERMINATED_FRONTMATTER,
        ]);
    });
    test("unknown deck type", () => {
        expect(codes("---\ntype: klingon\n---\n# T\namo - lieben\n")).toEqual([
            ErrorCode.PARSE_UNKNOWN_DECK_TYPE,
        ]);
    });
    test("tag too long", () => {
        expect(codes(`# T\namo - lieben #${"x".repeat(25)}\n`)).toEqual([
            ErrorCode.PARSE_TAG_TOO_LONG,
        ]);
    });
    test("multiple hints on one side are allowed", () => {
        expect(codes("# T\n[a] x [b] - back\n")).toEqual([]);
        const doc = parse(makeRawMarkdown("# T\n[a] x [b] - back\n"));
        expect(doc.cards[0]!.hints).toEqual([
            { side: "front", start: 0, end: 1 },
            { side: "front", start: 4, end: 5 },
        ]);
    });
    test("trailing image field becomes the card image (shown on both sides)", () => {
        const raw = "# T\nKatze - die Katze ![Katze](https://x.de/katze.jpg)\n";
        expect(codes(raw)).toEqual([]);
        const card = parse(makeRawMarkdown(raw)).cards[0]!;
        expect(card.hints).toEqual([]);
        expect(card.front.plain).toBe("Katze");
        expect(card.image).toEqual({ alt: "Katze", url: "https://x.de/katze.jpg" });
    });
    test("an inline image token in a side stays literal text; only the trailing field is the card image", () => {
        const raw = "# T\n![Katze](https://x.de/katze.jpg) Katze - die Katze\n";
        expect(codes(raw)).toEqual([]);
        const card = parse(makeRawMarkdown(raw)).cards[0]!;
        expect(card.front.plain).toBe("![Katze](https://x.de/katze.jpg) Katze");
        expect(card.image).toBeUndefined();
    });
    test("more than one image per card is an error", () => {
        expect(codes("# T\na - b ![x](https://x.de/1.png) ![y](https://x.de/2.png)\n")).toEqual([
            ErrorCode.PARSE_TOO_MANY_IMAGES,
        ]);
    });
    test("an image-only front side is literal text, not an empty side", () => {
        expect(codes("# T\n![Katze](https://x.de/katze.jpg) - die Katze\n")).toEqual([]);
    });
    test("multiple errors are collected", () => {
        const errs = codes("# T\namo lieben\nfoo\n");
        expect(errs).toEqual([
            ErrorCode.PARSE_MISSING_SEPARATOR,
            ErrorCode.PARSE_MISSING_SEPARATOR,
        ]);
    });
    test("parse() throws the first NscError", () => {
        try {
            parse(makeRawMarkdown("# T\namo lieben\n"));
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.PARSE_MISSING_SEPARATOR).toBe(
                true
            );
        }
    });
});

describe("makeTag", () => {
    test("trims and lowercases", () => {
        expect(makeTag("  Verb ")).toBe("verb");
    });
    test("empty or too long throws PARSE_TAG_TOO_LONG", () => {
        for (const raw of ["", "   ", "x".repeat(25)]) {
            try {
                makeTag(raw);
                throw new Error("should have thrown");
            } catch (e) {
                expect(e instanceof NscError && e.code === ErrorCode.PARSE_TAG_TOO_LONG).toBe(true);
            }
        }
    });
});
