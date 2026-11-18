import { describe, expect, test } from "bun:test";
import { makeRawMarkdown, parse } from "#lib/core/deck/parse";
import { serialize, serializeCard } from "#lib/core/deck/serialize";
import { cardIdFromString } from "#lib/core/deck/ids";
import type { Card } from "#lib/core/deck/document";

// Canonical output: frontmatter order type, author, then extra keys.
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

describe("serialize(parse(x)) === x on the canonical form", () => {
    test("full document round-trip is byte-identical", () => {
        const raw = makeRawMarkdown(CANONICAL);
        expect(serialize(parse(raw))).toBe(CANONICAL);
    });

    test("hint brackets survive the round-trip", () => {
        const raw = makeRawMarkdown("---\ntype: greek\n---\n# Griechisch\nἀγάπη [Liebe] - love\n");
        expect(serialize(parse(raw))).toBe(raw);
    });

    test("the card image round-trips as the trailing field, before the moon", () => {
        const raw = makeRawMarkdown(
            "---\ntype: english\n---\n# T\nKatze - die Katze #tier ![Katze](https://x.de/katze.jpg) *\n"
        );
        expect(serialize(parse(raw))).toBe(raw);
    });

    test("an inline image token in a side round-trips verbatim (not promoted to the trailing field)", () => {
        const raw = makeRawMarkdown(
            "---\ntype: english\n---\n# T\n![Katze](https://x.de/k.jpg) Katze - die Katze\n"
        );
        expect(serialize(parse(raw))).toBe(raw);
    });

    test("input without frontmatter serializes to the full canonical form", () => {
        const out = serialize(parse(makeRawMarkdown("# Vokabeln\nhello - hallo\n")));
        expect(out.startsWith("---\ntype: english\n---\n# Vokabeln\nhello - hallo\n")).toBe(true);
    });
});

describe("serializeCard", () => {
    test("newlines in a side are escaped", () => {
        const card: Card = {
            id: cardIdFromString("0000000000000001"),
            front: { plain: "a\nb", spans: [], images: [] },
            back: { plain: "c", spans: [], images: [] },
            hints: [],
            tags: [],
            hidden: false,
        };
        expect(serializeCard(card)).toBe("a\\nb - c");
    });

    test("all trailing markers in canonical order", () => {
        const card: Card = {
            id: cardIdFromString("0000000000000002"),
            front: { plain: "a", spans: [], images: [] },
            back: { plain: "b", spans: [], images: [] },
            context: { plain: "ctx", spans: [], images: [] },
            hints: [],
            tags: ["x", "y"] as Card["tags"],
            hidden: true,
        };
        expect(serializeCard(card)).toBe("a - b :: ctx #x #y *");
    });
});
