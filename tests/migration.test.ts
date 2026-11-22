import { beforeEach, describe, expect, test } from "bun:test";
// Relative on purpose: the dotted module id does not resolve through
// the #lib/* alias mapping in bun's resolver.
import {
    buildV1Source,
    groupV1States,
    hasV1Data,
    migrateV1ToV2,
} from "../src/lib/migration-v1.0.0-v2.0.0";
import { parse, validate } from "#lib/core/deck/parse";

// bun tests run without the Web Storage API — a minimal in-memory
// sessionStorage-shaped polyfill drives the localStorage-backed paths.
class MemoryStorage {
    #map = new Map<string, string>();
    get length(): number {
        return this.#map.size;
    }
    key(index: number): string | null {
        return [...this.#map.keys()][index] ?? null;
    }
    getItem(key: string): string | null {
        return this.#map.get(key) ?? null;
    }
    setItem(key: string, value: string): void {
        this.#map.set(key, String(value));
    }
    removeItem(key: string): void {
        this.#map.delete(key);
    }
    clear(): void {
        this.#map.clear();
    }
}
(globalThis as Record<string, unknown>).localStorage = new MemoryStorage();
// The storage engines' browser guard keys off `window` — provide the
// minimal global so their get/set paths run instead of SSR-no-op'ing.
(globalThis as Record<string, unknown>).window = globalThis;

const V1_RAW_WITHOUT_TITLE = "amo - lieben\namo [Ich liebe] - lieben\n";
const V1_RAW_WITH_TITLE = "# Latein Vokabeln\namo - lieben\n";

describe("buildV1Source", () => {
    test("adds frontmatter type and a title from the v1 deck name", () => {
        const source = buildV1Source(V1_RAW_WITHOUT_TITLE, "Latein Lektion 1", "latin");
        expect(validate(source)).toEqual([]);
        const doc = parse(source);
        expect(doc.title).toBe("Latein Lektion 1");
        expect(doc.type).toBe("latin");
        expect(doc.cards).toHaveLength(2);
    });

    test("keeps an existing markdown heading as the title", () => {
        const source = buildV1Source(V1_RAW_WITH_TITLE, "Anderer Name", "greek");
        expect(validate(source)).toEqual([]);
        expect(parse(source).title).toBe("Latein Vokabeln");
        expect(parse(source).type).toBe("greek");
    });

    test("falls back to the default title for an empty name", () => {
        const source = buildV1Source(V1_RAW_WITHOUT_TITLE, "   ", "english");
        expect(parse(source).title).toBe("Unbenannter Stapel");
    });

    test("reports the parse error of a deck the 2.0.0 parser rejects", () => {
        const source = buildV1Source("kein trenner hier", "Kaputt", "latin");
        const errors = validate(source);
        expect(errors).toHaveLength(1);
        expect(errors[0]!.code).toBe("PARSE_MISSING_SEPARATOR");
    });
});

describe("groupV1States", () => {
    test("groups `<slug>/<index>` entries per slug and drops malformed ones", () => {
        const grouped = groupV1States({
            "aaaa1111bbbb2222-ab12/0": { box: 2, lastSeen: 100 },
            "aaaa1111bbbb2222-ab12/1": { box: 6, lastSeen: 200 },
            "aaaa1111bbbb2222-ab12/abc": { box: 1, lastSeen: 1 },
            "aaaa1111bbbb2222-ab12/-1": { box: 1, lastSeen: 1 },
            "ffff9999eeee8888-cd34/0": { box: 1, lastSeen: 50 },
            "not-a-card-key": { box: 1, lastSeen: 1 },
            "aaaa1111bbbb2222-ab12/3": { box: "three", lastSeen: 1 },
        });
        expect(grouped.size).toBe(2);
        expect(grouped.get("aaaa1111bbbb2222-ab12")!.get(0)).toEqual({ box: 2, lastSeen: 100 });
        expect(grouped.get("aaaa1111bbbb2222-ab12")!.get(1)).toEqual({ box: 6, lastSeen: 200 });
        expect(grouped.get("aaaa1111bbbb2222-ab12")!.has(3)).toBe(false);
        expect(grouped.get("ffff9999eeee8888-cd34")!.size).toBe(1);
    });
});

describe("migrateV1ToV2 (localStorage-backed)", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test("seeds nothing when the browser has no 1.0.0 data", async () => {
        expect(hasV1Data()).toBe(false);
        const report = await migrateV1ToV2();
        expect(report.settings).toBe("none");
        expect(report.decks).toEqual([]);
    });

    test("merges the v1 settings into kk-settings exactly once", async () => {
        localStorage.setItem("kk_pure", "true");
        localStorage.setItem("kk_mistral_api_key", JSON.stringify("sk-test-123"));
        localStorage.setItem("kk_privacy_toast_dismissed", "true");
        expect(hasV1Data()).toBe(true);

        const first = await migrateV1ToV2();
        expect(first.settings).toBe("migrated");
        const stored = JSON.parse(localStorage.getItem("kk-settings")!);
        expect(stored.pureMode).toBe(true);
        expect(stored.mistralApiKey).toBe("sk-test-123");
        expect(stored.privacyToastDismissed).toBe(true);
        // Defaults of 2.0.0-only fields stay intact.
        expect(stored.theme).toBe("system");
        expect(stored.locale).toBe("de");

        // Second run: the existing 2.0.0 record wins — idempotence.
        const second = await migrateV1ToV2();
        expect(second.settings).toBe("kept");
    });

    test("counts dropped v1 timers and never touches them", async () => {
        localStorage.setItem(
            "kk_timer_state",
            JSON.stringify({ "aaaa1111bbbb2222-ab12": { durationMs: 300000 } })
        );
        localStorage.setItem("kk_pure", "false");
        const report = await migrateV1ToV2();
        expect(report.droppedTimers).toBe(1);
        expect(localStorage.getItem("kk_timer_state")).not.toBeNull();
        expect(report.orphanedCardStates).toBe(0);
    });
});
