import { describe, expect, test } from "bun:test";
import { ErrorCode, NscError } from "#lib/core/errors";
import {
    base64ToBytes,
    bytesToBase64,
    decodePayload,
    encodePayload,
    gunzipBytes,
    gzipBytes,
} from "#lib/core/share/codec/index";

describe("base64url", () => {
    test("round-trips all length classes (mod 3 = 0,1,2)", () => {
        for (let len = 0; len <= 8; len++) {
            const bytes = Uint8Array.from({ length: len }, (_, i) => (i * 37 + len) % 256);
            const encoded = bytesToBase64(bytes);
            expect(encoded).toMatch(/^[A-Za-z0-9_-]*$/);
            expect([...base64ToBytes(encoded)]).toEqual([...bytes]);
        }
    });
    test("known vector: 3 bytes 0xfb 0xff 0xfe → '-__-'", () => {
        expect(bytesToBase64(Uint8Array.from([0xfb, 0xff, 0xfe]))).toBe("-__-");
    });
    test("invalid char or length throws LINK_INVALID_ENCODING", () => {
        for (const bad of ["!!!", "A", "AB CD"]) {
            try {
                base64ToBytes(bad);
                throw new Error("should have thrown");
            } catch (e) {
                expect(e instanceof NscError && e.code === ErrorCode.LINK_INVALID_ENCODING).toBe(
                    true
                );
            }
        }
    });
});

describe("gzip payload codec", () => {
    test("encodePayload/decodePayload round-trip", async () => {
        const body = { c: "# T\namo - lieben\n".repeat(50), nested: { list: [1, 2, 3] } };
        const payload = await encodePayload(body);
        expect(payload).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(await decodePayload(payload)).toEqual(body);
    });
    test("decodePayload rejects invalid encoding", async () => {
        try {
            await decodePayload("###");
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.LINK_INVALID_ENCODING).toBe(true);
        }
    });
    test("gzip/gunzip round-trip", async () => {
        const data = new TextEncoder().encode("Wiederholung ".repeat(200));
        expect([...(await gunzipBytes(await gzipBytes(data)))]).toEqual([...data]);
    });
});
