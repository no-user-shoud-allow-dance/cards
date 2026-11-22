import { describe, expect, test } from "bun:test";
import { ErrorCode, NscError } from "#lib/core/errors";
import { makeRawMarkdown } from "#lib/core/deck/parse";
import { bytesToBase64 } from "#lib/core/share/codec/index";
import { decryptServerLink, encryptServerLink } from "#lib/core/share/crypto";
import { generateShareKey } from "#lib/core/share/links";

describe("server-link crypto (k links)", () => {
    const markdown = makeRawMarkdown("---\ntype: latin\n---\n# Verben\namo - lieben\n");

    test("encrypt/decrypt round-trip", async () => {
        const key = generateShareKey();
        const ciphertext = await encryptServerLink(key, markdown);
        expect(ciphertext).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(await decryptServerLink(key, ciphertext)).toBe(markdown);
    });

    test("wrong key throws SHARE_DECRYPT_FAILED", async () => {
        const ciphertext = await encryptServerLink(generateShareKey(), markdown);
        try {
            await decryptServerLink(generateShareKey(), ciphertext);
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.SHARE_DECRYPT_FAILED).toBe(true);
        }
    });

    test("tampered ciphertext throws SHARE_DECRYPT_FAILED", async () => {
        const key = generateShareKey();
        const ciphertext = await encryptServerLink(key, markdown);
        const tampered =
            ciphertext.slice(0, 10) + (ciphertext[10] === "A" ? "B" : "A") + ciphertext.slice(11);
        try {
            await decryptServerLink(key, tampered);
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.SHARE_DECRYPT_FAILED).toBe(true);
        }
    });

    test("unknown cipher version throws SHARE_UNSUPPORTED_CIPHER", async () => {
        const key = generateShareKey();
        const forged = bytesToBase64(new TextEncoder().encode("k9" + "x".repeat(40)));
        try {
            await decryptServerLink(key, forged);
            throw new Error("should have thrown");
        } catch (e) {
            expect(e instanceof NscError && e.code === ErrorCode.SHARE_UNSUPPORTED_CIPHER).toBe(
                true
            );
        }
    });
});
