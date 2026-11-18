import { ErrorCode, NscError } from "#lib/core/errors";
import { makeRawMarkdown, type RawMarkdown } from "#lib/core/deck/parse";
import { base64ToBytes, bytesToBase64, gunzipBytes, gzipBytes } from "#lib/core/share/codec/";
import { makeShareKey, type ShareKey } from "#lib/core/share/links";

/**
 * AES-256-GCM helpers for server links (`k`). The KV record stores
 * `share:{id}` = ciphertext = base64url(`"k1" ‖ nonce(12) ‖ AES-256-GCM(gzip(markdown)) ‖ tag`);
 * the 256-bit key lives only in the URL path (`/k/{id}.{key}`) and never
 * reaches the server. WebCrypto only — no dependency.
 */

const CIPHER_VERSION = "k1";
const NONCE_BYTES = 12;

async function importAesKey(key: ShareKey): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        "raw",
        base64ToBytes(key) as BufferSource,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
}

/** Encrypts gzipped deck markdown for server storage; returns the KV ciphertext. */
export async function encryptServerLink(key: ShareKey, markdown: RawMarkdown): Promise<string> {
    const aesKey = await importAesKey(key);
    const nonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
    const plain = await gzipBytes(new TextEncoder().encode(markdown));
    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, plain as BufferSource)
    );
    const version = new TextEncoder().encode(CIPHER_VERSION);
    const payload = new Uint8Array(version.length + NONCE_BYTES + ciphertext.length);
    payload.set(version, 0);
    payload.set(nonce, version.length);
    payload.set(ciphertext, version.length + NONCE_BYTES);
    return bytesToBase64(payload);
}

/** Decrypts a KV ciphertext back to deck markdown; throws on wrong key/tampering. */
export async function decryptServerLink(
    key: ShareKey,
    ciphertextB64Url: string
): Promise<RawMarkdown> {
    const payload = base64ToBytes(ciphertextB64Url);
    const version = new TextDecoder().decode(payload.slice(0, CIPHER_VERSION.length));
    if (version !== CIPHER_VERSION) {
        throw new NscError(ErrorCode.SHARE_UNSUPPORTED_CIPHER, { version });
    }
    const nonce = payload.slice(CIPHER_VERSION.length, CIPHER_VERSION.length + NONCE_BYTES);
    const ciphertext = payload.slice(CIPHER_VERSION.length + NONCE_BYTES);
    const aesKey = await importAesKey(makeShareKey(key));
    let plain: ArrayBuffer;
    try {
        plain = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: nonce as BufferSource },
            aesKey,
            ciphertext as BufferSource
        );
    } catch {
        throw new NscError(ErrorCode.SHARE_DECRYPT_FAILED);
    }
    return makeRawMarkdown(new TextDecoder().decode(await gunzipBytes(new Uint8Array(plain))));
}
