import { describe, expect, test } from "bun:test";
import { normalizeDiacritics } from "#lib/core/deck/normalize";

describe("normalizeDiacritics (pure mode)", () => {
    test("greek strips breathing marks and tonos", () => {
        expect(normalizeDiacritics("ἀγάπη", "greek")).toBe("αγαπη");
        expect(normalizeDiacritics("ὁ ἄνθρωπος", "greek")).toBe("ο ανθρωπος");
    });

    test("latin strips macrons", () => {
        expect(normalizeDiacritics("amāre portō", "latin")).toBe("amare porto");
    });

    test("english has no dictionary — text unchanged", () => {
        expect(normalizeDiacritics("café", "english")).toBe("café");
    });

    test("characters outside the type's range are untouched", () => {
        // é (U+00E9) is not in Latin Extended-A, so latin leaves it alone
        expect(normalizeDiacritics("café", "latin")).toBe("café");
    });
});
