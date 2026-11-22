import { describe, expect, test } from "bun:test";
import { ErrorCode, NscError } from "#lib/core/errors";
import { deckHashFromString, fnv1aHex64, hashDeckContent, isDeckHash } from "#lib/core/deck/hash";
import { makeRawMarkdown, parse } from "#lib/core/deck/parse";
import { serializeCard } from "#lib/core/deck/serialize";

describe("fnv1aHex64", () => {
    test("known FNV-1a 64-bit vectors", () => {
        expect(fnv1aHex64("")).toBe("cbf29ce484222325");
        expect(fnv1aHex64("a")).toBe("af63dc4c8601ec8c");
    });
    test("always 16 lowercase hex chars", () => {
        expect(/^[0-9a-f]{16}$/.test(fnv1aHex64("irgendein Text äöü 😀"))).toBe(true);
    });
});

describe("hashDeckContent", () => {
    const base = parse(makeRawMarkdown("---\ntype: latin\n---\n# Verben\namo - lieben\n"));

    test("meta changes do not change deck identity", () => {
        const edited = { ...base, meta: { ...base.meta, author: "Jemand anders" } };
        expect(hashDeckContent(edited, serializeCard)).toBe(hashDeckContent(base, serializeCard));
    });

    test("title, type, or card changes do change it", () => {
        const h0 = hashDeckContent(base, serializeCard);
        expect(
            hashDeckContent({ ...base, title: "Andere" as typeof base.title }, serializeCard)
        ).not.toBe(h0);
        expect(hashDeckContent({ ...base, type: "english" }, serializeCard)).not.toBe(h0);
        const other = parse(makeRawMarkdown("---\ntype: latin\n---\n# Verben\namo - liebt\n"));
        expect(hashDeckContent(other, serializeCard)).not.toBe(h0);
    });

    test("deterministic across calls (sync key)", () => {
        expect(hashDeckContent(base, serializeCard)).toBe(hashDeckContent(base, serializeCard));
        expect(isDeckHash(hashDeckContent(base, serializeCard))).toBe(true);
    });
});

describe("deckHashFromString", () => {
    test("invalid throws LINK_BAD_SHAPE", () => {
        try {
            deckHashFromString("nope");
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.LINK_BAD_SHAPE).toBe(true);
        }
    });
});
