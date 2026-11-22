import { describe, expect, test } from "bun:test";
import { ErrorCode, NscError } from "#lib/core/errors";
import { deckHashFromString } from "#lib/core/deck/hash";
import { cardIdFromString } from "#lib/core/deck/ids";
import {
    buildLinkUrl,
    generateShareId,
    generateShareKey,
    makeShareId,
    makeShareKey,
    parseLink,
    validateBody,
    type ShareLink,
} from "#lib/core/share/links";

const ORIGIN = "https://nsc.example";

describe("share id/key brands", () => {
    test("makeShareId/makeShareKey enforce shape", () => {
        expect(makeShareId("A".repeat(22))).toBe("A".repeat(22));
        expect(makeShareKey("A".repeat(43))).toBe("A".repeat(43));
        for (const bad of ["", "A".repeat(21), "A".repeat(23), "A".repeat(22) + "!"]) {
            try {
                makeShareId(bad);
                throw new Error("should have thrown");
            } catch (e) {
                expect(e instanceof NscError && e.code === ErrorCode.SHARE_ID_INVALID).toBe(true);
            }
        }
        try {
            makeShareKey("A".repeat(42));
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.SHARE_KEY_INVALID).toBe(true);
        }
    });
    test("generators produce 22/43-char base64url", () => {
        expect(generateShareId(() => new Uint8Array(16))).toBe("A".repeat(22));
        expect(generateShareKey(() => new Uint8Array(32))).toBe("A".repeat(43));
    });
});

describe("buildLinkUrl/parseLink round-trip", () => {
    const cases: { name: string; link: ShareLink }[] = [
        { name: "c", link: { kind: "c", body: { c: "# T\namo - lieben\n" } } },
        {
            name: "p",
            link: {
                kind: "p",
                body: {
                    h: deckHashFromString("0123456789abcdef"),
                    s: 3,
                    c: [[cardIdFromString("0000000000000001"), 2, 1, 123, 1]],
                },
            },
        },
        {
            name: "t",
            link: {
                kind: "t",
                body: {
                    h: deckHashFromString("0123456789abcdef"),
                    s: 0,
                    head: "---\ntype: english\n---\n# T",
                    c: [["a - b", 1, 0, null, 0]],
                },
            },
        },
        { name: "s", link: { kind: "s", peerId: "nsc-testpeer" } },
        { name: "k", link: { kind: "k", id: generateShareId(), key: generateShareKey() } },
    ];

    for (const { name, link } of cases) {
        test(name, async () => {
            const url = await buildLinkUrl(ORIGIN, link);
            expect(url.startsWith(`${ORIGIN}/${link.kind}/`)).toBe(true);
            expect(await parseLink(url)).toEqual(link);
            // path-only form parses too
            expect(await parseLink(url.slice(ORIGIN.length))).toEqual(link);
        });
    }

    test("anchor-form URLs are rejected (LINK_UNKNOWN_KIND)", async () => {
        const url = await buildLinkUrl(ORIGIN, { kind: "c", body: { c: "# T\na - b\n" } });
        const payload = url.slice(`${ORIGIN}/c/`.length);
        for (const legacy of [
            `https://other.host/#c.${payload}`,
            `https://other.host/#deck=old.${payload}`,
            `#c.${payload}`,
            `https://other.host/#k.${payload}`,
        ]) {
            try {
                await parseLink(legacy);
                throw new Error("should have thrown");
            } catch (e) {
                expect(e instanceof NscError && e.code === ErrorCode.LINK_UNKNOWN_KIND).toBe(true);
            }
        }
    });

    test("unknown kind throws LINK_UNKNOWN_KIND", async () => {
        try {
            await parseLink("https://x.de/foo/bar");
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.LINK_UNKNOWN_KIND).toBe(true);
        }
    });

    test("oversized payload throws LINK_PAYLOAD_TOO_LARGE", async () => {
        // Random bytes, not an LCG: gzip shrinks the LCG output below the
        // cap, incompressible input cannot get under it.
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
        const bytes = crypto.getRandomValues(new Uint8Array(30000));
        let big = "";
        for (const b of bytes) big += alphabet[b % 64]!;
        try {
            await buildLinkUrl(ORIGIN, { kind: "c", body: { c: big } });
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.LINK_PAYLOAD_TOO_LARGE).toBe(true);
        }
    });
});

describe("validateBody", () => {
    test("non-record bodies throw LINK_BAD_SHAPE", () => {
        for (const bad of [null, 42, "x", []]) {
            try {
                validateBody("c", bad);
                throw new Error("should have thrown");
            } catch (e) {
                expect(e instanceof NscError && e.code === ErrorCode.LINK_BAD_SHAPE).toBe(true);
            }
        }
    });
    test("bad shapes throw LINK_BAD_SHAPE", () => {
        const cases: { kind: "c" | "p" | "t"; body: unknown }[] = [
            { kind: "c", body: {} },
            { kind: "c", body: { c: 5 } },
            { kind: "p", body: { h: "zz", s: 0, c: [] } },
            { kind: "p", body: { h: "0123456789abcdef", s: 0, c: [["x", 1, 0, null, 0]] } },
            {
                kind: "t",
                body: { h: "0123456789abcdef", s: 0, head: "h", c: [["a - b", 1, 0, -5, 0]] },
            },
        ];
        for (const { kind, body } of cases) {
            try {
                validateBody(kind, body);
                throw new Error("should have thrown");
            } catch (e) {
                expect(e instanceof NscError && e.code === ErrorCode.LINK_BAD_SHAPE).toBe(true);
            }
        }
    });
    test("valid bodies pass", () => {
        expect(validateBody("c", { c: "x" })).toEqual({ c: "x" });
    });
});
