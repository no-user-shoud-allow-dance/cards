import { describe, expect, test } from "bun:test";
import { DECK_TYPE_VALUES, STYLES, type DeckDocument } from "#lib/core/deck/document";
import { emptyDeckMeta, parseDeckTitle } from "#lib/core/deck/identity";

describe("document model", () => {
    test("Style enum is closed with 8 styles", () => {
        expect(STYLES).toEqual([
            "bold",
            "italic",
            "code",
            "underline",
            "strike",
            "mark",
            "sup",
            "sub",
        ]);
    });

    test("deck types are latin/greek/english", () => {
        expect(DECK_TYPE_VALUES).toEqual(["english", "latin", "greek"]);
    });

    test("a minimal DeckDocument is well-formed", () => {
        const doc: DeckDocument = {
            title: parseDeckTitle("Vokabeln"),
            type: "latin",
            meta: emptyDeckMeta(),
            cards: [],
        };
        expect(doc.meta.extra).toEqual({});
    });
});
