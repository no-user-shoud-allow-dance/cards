import { describe, expect, test } from "bun:test";
import { normalizeFolderStates } from "#lib/repositories/foldersRepository";

describe("normalizeFolderStates", () => {
    test("valid entries survive with order kept", () => {
        const out = normalizeFolderStates([
            { name: "Latein", opened: true },
            { name: "Eigene", opened: false },
        ]);
        expect(out).toEqual([
            { name: "Latein", opened: true },
            { name: "Eigene", opened: false },
        ]);
    });

    test("invalid, malformed and duplicate entries are dropped", () => {
        const out = normalizeFolderStates([
            null,
            "folder",
            { name: "Latein" },
            { opened: true },
            { name: 42, opened: true },
            { name: "Latein", opened: true },
            { name: "Latein", opened: false },
            { name: "#pinned", opened: true },
            { name: "Fach/Name", opened: true },
        ]);
        expect(out).toEqual([{ name: "Latein", opened: true }]);
    });

    test("non-array input yields the empty list (everything closed)", () => {
        expect(normalizeFolderStates(undefined)).toEqual([]);
        expect(normalizeFolderStates(null)).toEqual([]);
        expect(normalizeFolderStates({ name: "Latein" })).toEqual([]);
        expect(normalizeFolderStates("kk-folders")).toEqual([]);
    });
});
