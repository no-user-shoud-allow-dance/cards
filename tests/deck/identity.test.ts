import { describe, expect, test } from "bun:test";
import { ErrorCode, NscError } from "#lib/core/errors";
import {
    DRAFT_FOLDER,
    FOLDER_DEFAULT,
    SPECIAL_FOLDER_PATTERN,
    SPECIAL_FOLDERS,
    detectDeckType,
    draftNumberOf,
    firstSimpleFolder,
    folderKindOf,
    isSlug,
    isSpecialFolder,
    makeSlug,
    parseDeckMetaValue,
    parseDeckTitle,
    parseDeckTypeValue,
    parseFolderName,
    randomSlugSuffix,
    toggleSpecialFolder,
    withSimpleFolder,
} from "#lib/core/deck/identity";

function expectCode(fn: () => unknown, code: ErrorCode): void {
    try {
        fn();
    } catch (e) {
        expect(e instanceof NscError && e.code === code).toBe(true);
        return;
    }
    throw new Error(`expected NscError ${code}`);
}

describe("parseDeckTitle", () => {
    test("trims and collapses whitespace", () => {
        expect(parseDeckTitle("  Hallo   Welt  ")).toBe("Hallo Welt");
    });
    test("rejects empty and over-long", () => {
        expectCode(() => parseDeckTitle("   "), ErrorCode.TITLE_EMPTY);
        expectCode(() => parseDeckTitle("x".repeat(101)), ErrorCode.TITLE_TOO_LONG);
    });
});

describe("parseFolderName", () => {
    test("defaults to Eigene", () => {
        expect(parseFolderName("")).toBe(FOLDER_DEFAULT);
        expect(parseFolderName("   ")).toBe(FOLDER_DEFAULT);
    });
    test("rejects slashes and over-long", () => {
        expectCode(() => parseFolderName("a/b"), ErrorCode.FOLDER_INVALID);
        expectCode(() => parseFolderName("a\\b"), ErrorCode.FOLDER_INVALID);
        expectCode(() => parseFolderName("x".repeat(61)), ErrorCode.FOLDER_TOO_LONG);
    });
});

describe("parseDeckMetaValue", () => {
    test("caps known keys", () => {
        expectCode(
            () => parseDeckMetaValue("author", "x".repeat(81)),
            ErrorCode.META_VALUE_TOO_LONG
        );
        expectCode(
            () => parseDeckMetaValue("description", "x".repeat(301)),
            ErrorCode.META_VALUE_TOO_LONG
        );
        expectCode(
            () => parseDeckMetaValue("source", "x".repeat(121)),
            ErrorCode.META_VALUE_TOO_LONG
        );
        expect(parseDeckMetaValue("author", "  Ada  ")).toBe("Ada");
        // unknown keys have no cap
        expect(parseDeckMetaValue("custom", "x".repeat(500)).length).toBe(500);
    });
});

describe("parseDeckTypeValue", () => {
    test("accepts known values case-insensitively", () => {
        expect(parseDeckTypeValue(" latin ")).toBe("latin");
        expect(parseDeckTypeValue("GREEK")).toBe("greek");
    });
    test("unknown value is a hard error", () => {
        expectCode(() => parseDeckTypeValue("klingon"), ErrorCode.PARSE_UNKNOWN_DECK_TYPE);
    });
});

describe("slug", () => {
    test("isSlug matches hash-suffix", () => {
        expect(isSlug("0123456789abcdef-ab12")).toBe(true);
        expect(isSlug("0123456789abcdef-ab1")).toBe(false);
        expect(isSlug("xyz")).toBe(false);
    });
    test("makeSlug validates", () => {
        expect(makeSlug("0123456789abcdef", "ab12")).toBe("0123456789abcdef-ab12");
        expectCode(() => makeSlug("nope", "ab12"), ErrorCode.SLUG_INVALID);
    });
    test("randomSlugSuffix is 4 base36 chars", () => {
        expect(randomSlugSuffix(() => 0.5)).toHaveLength(4);
        expect(/^[a-z0-9]{4}$/.test(randomSlugSuffix())).toBe(true);
    });
});

describe("detectDeckType", () => {
    test("greek by script", () => {
        expect(detectDeckType(["ἀγάπη", "λόγος", "ἄνθρωπος", "theos"])).toBe("greek");
    });
    test("latin by macrons/endings", () => {
        expect(detectDeckType(["amāre", "portō", "via", "bonus"])).toBe("latin");
    });
    test("english default", () => {
        expect(detectDeckType(["hello", "world"])).toBe("english");
        expect(detectDeckType([])).toBe("english");
    });
});

describe("draft names", () => {
    test("draftNumberOf parses the draft name pattern", () => {
        expect(draftNumberOf("Draft-1")).toBe(1);
        expect(draftNumberOf("Draft-42")).toBe(42);
    });

    test("draftNumberOf rejects other titles", () => {
        expect(draftNumberOf("Draft")).toBeNull();
        expect(draftNumberOf("Draft-x")).toBeNull();
        expect(draftNumberOf("Lektion 1")).toBeNull();
        expect(draftNumberOf(" Draft-2")).toBe(2);
    });

    test("DRAFT_FOLDER is a valid special folder name", () => {
        expect(parseFolderName(DRAFT_FOLDER, { allowSpecial: true })).toBe(DRAFT_FOLDER);
    });
});

describe("folder kinds", () => {
    test("parseFolderName rejects a leading # (reserved for special folders)", () => {
        expectCode(() => parseFolderName("#drafts"), ErrorCode.FOLDER_RESERVED_PREFIX);
        expectCode(() => parseFolderName("#"), ErrorCode.FOLDER_RESERVED_PREFIX);
    });

    test("allowSpecial accepts only lower-kebab-case #names", () => {
        expect(parseFolderName("#drafts", { allowSpecial: true })).toBe("#drafts");
        expect(parseFolderName("#exclude-from-continue-learning", { allowSpecial: true })).toBe(
            "#exclude-from-continue-learning"
        );
        expectCode(
            () => parseFolderName("#Drafts", { allowSpecial: true }),
            ErrorCode.FOLDER_INVALID
        );
        expectCode(() => parseFolderName("#a b", { allowSpecial: true }), ErrorCode.FOLDER_INVALID);
        expectCode(() => parseFolderName("#", { allowSpecial: true }), ErrorCode.FOLDER_INVALID);
    });

    test("special folder classification", () => {
        expect(folderKindOf("#drafts")).toBe("special");
        expect(folderKindOf("Lektion 1")).toBe("simple");
        expect(isSpecialFolder("#pinned")).toBe(true);
        expect(isSpecialFolder("Eigene")).toBe(false);
    });

    test("SPECIAL_FOLDERS are valid special names and DRAFT_FOLDER is #drafts", () => {
        for (const value of Object.values(SPECIAL_FOLDERS)) {
            expect(isSpecialFolder(value)).toBe(true);
            expect(SPECIAL_FOLDER_PATTERN.test(value)).toBe(true);
        }
        expect(DRAFT_FOLDER).toBe("#drafts");
    });

    test("withSimpleFolder replaces simple folders, keeps special, drops on request", () => {
        const drafts = parseFolderName("#drafts", { allowSpecial: true });
        const pinned = parseFolderName("#pinned", { allowSpecial: true });
        const alt = parseFolderName("Alt");
        expect(withSimpleFolder([drafts, alt], "Neu")).toEqual([drafts, parseFolderName("Neu")]);
        expect(withSimpleFolder([drafts, pinned, alt], "Neu", [drafts])).toEqual([
            pinned,
            parseFolderName("Neu"),
        ]);
        expect(withSimpleFolder([], "")).toEqual([FOLDER_DEFAULT]);
        expectCode(() => withSimpleFolder([], "#neu"), ErrorCode.FOLDER_RESERVED_PREFIX);
    });

    test("firstSimpleFolder", () => {
        const drafts = parseFolderName("#drafts", { allowSpecial: true });
        expect(firstSimpleFolder([drafts, "Lektion 1"])).toBe("Lektion 1");
        expect(firstSimpleFolder([drafts])).toBeNull();
        expect(firstSimpleFolder([])).toBeNull();
    });
});

describe("toggleSpecialFolder", () => {
    const pinned = parseFolderName("#pinned", { allowSpecial: true });
    const drafts = parseFolderName("#drafts", { allowSpecial: true });

    test("adds an absent special folder, keeping simple folders first", () => {
        expect(toggleSpecialFolder([parseFolderName("Alt")], pinned)).toEqual([
            parseFolderName("Alt"),
            pinned,
        ]);
    });

    test("removes a present special folder", () => {
        expect(toggleSpecialFolder([parseFolderName("Alt"), pinned], pinned)).toEqual([
            parseFolderName("Alt"),
        ]);
    });

    test("is idempotent and preserves order of the remaining folders", () => {
        const folders = [parseFolderName("B"), parseFolderName("A"), pinned, drafts];
        const once = toggleSpecialFolder(folders, parseFolderName("#x", { allowSpecial: true }));
        expect(once).toEqual([
            parseFolderName("B"),
            parseFolderName("A"),
            pinned,
            drafts,
            parseFolderName("#x", { allowSpecial: true }),
        ]);
        expect(toggleSpecialFolder(once, parseFolderName("#x", { allowSpecial: true }))).toEqual(
            folders
        );
    });

    test("rejects non-special folder names", () => {
        expectCode(
            () => toggleSpecialFolder([], parseFolderName("Alt")),
            ErrorCode.FOLDER_RESERVED_PREFIX
        );
    });
});
