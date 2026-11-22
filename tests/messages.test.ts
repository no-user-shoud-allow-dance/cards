import { describe, expect, test } from "bun:test";
import type { Messages } from "../src/messages/messages";
import { de } from "../src/messages/languages/de";
import { en } from "../src/messages/languages/en";

/** Collects every leaf path of a (possibly nested) messages object. */
function leafPaths(value: unknown, prefix = ""): string[] {
    if (typeof value === "object" && value !== null) {
        return Object.entries(value as Record<string, unknown>).flatMap(([key, v]) =>
            leafPaths(v, prefix ? `${prefix}.${key}` : key)
        );
    }
    return [prefix];
}

/** Every string leaf, for the empty-string check. */
function stringLeaves(value: unknown, prefix = ""): { path: string; text: string }[] {
    if (typeof value === "string") return [{ path: prefix, text: value }];
    if (typeof value === "object" && value !== null) {
        return Object.entries(value as Record<string, unknown>).flatMap(([key, v]) =>
            stringLeaves(v, prefix ? `${prefix}.${key}` : key)
        );
    }
    return [];
}

describe("messages locale parity", () => {
    test("de and en have identical key sets (type-level + runtime)", () => {
        const dePaths = leafPaths(de).sort();
        const enPaths = leafPaths(en).sort();
        expect(enPaths).toEqual(dePaths);
        // Compile-time guarantee: en must satisfy Messages (checked at
        // the import site); assert both are Messages-shaped here too.
        const typed: Messages = en;
        expect(leafPaths(typed).length).toBeGreaterThan(0);
    });

    test("no empty strings in either locale", () => {
        for (const locale of [de, en]) {
            for (const { path, text } of stringLeaves(locale)) {
                if (text.trim().length === 0) throw new Error(`empty string at ${path}`);
            }
        }
    });

    test("function leaves produce non-empty strings for sample inputs", () => {
        for (const locale of [de, en]) {
            expect(locale.UI.cardsSeen(1, 5).length).toBeGreaterThan(0);
            expect(locale.UI.streak(3).length).toBeGreaterThan(0);
            expect(locale.UI.boxLabel(1).length).toBeGreaterThan(0);
            expect(locale.UI.boxLabel(6).length).toBeGreaterThan(0);
            expect(locale.UI.countCards(0).length).toBeGreaterThan(0);
            expect(locale.UI.countCards(1).length).toBeGreaterThan(0);
            expect(locale.UI.countCards(7).length).toBeGreaterThan(0);
            expect(locale.UI.studyTime(0).length).toBeGreaterThan(0);
            expect(locale.UI.studyTime(65_000).length).toBeGreaterThan(0);
            expect(locale.UI.studyTime(3_700_000).length).toBeGreaterThan(0);
            expect(locale.UI.deckTypeLabel("greek").length).toBeGreaterThan(0);
            expect(locale.UI.deckTypeLanguage("latin").length).toBeGreaterThan(0);
            expect(
                locale.UI.helpSearchQuery("Haus", "Lateinischen", "domus").length
            ).toBeGreaterThan(0);
            expect(locale.UI.mnemonicSearchQuery("domus").length).toBeGreaterThan(0);
            expect(locale.UI.draftName(2).length).toBeGreaterThan(0);
            expect(locale.SYNC.applied(1, 2).length).toBeGreaterThan(0);
            expect(locale.SYNC.doneMany(3).length).toBeGreaterThan(0);
            expect(locale.SHARE.serverError(500).length).toBeGreaterThan(0);
        }
    });

    test("box labels: roman numerals plus the learned label", () => {
        expect(de.UI.boxLabel(1)).toBe("I");
        expect(de.UI.boxLabel(5)).toBe("V");
        expect(de.UI.boxLabel(6)).toBe("Gelernt");
        expect(en.UI.boxLabel(6)).toBe("Learned");
    });

    test("countCards is plural-aware per locale", () => {
        expect(de.UI.countCards(0)).toBe("Keine Karten");
        expect(de.UI.countCards(1)).toBe("1 Karte");
        expect(de.UI.countCards(2)).toBe("2 Karten");
        expect(en.UI.countCards(0)).toBe("No cards");
        expect(en.UI.countCards(1)).toBe("1 card");
        expect(en.UI.countCards(2)).toBe("2 cards");
    });
});
