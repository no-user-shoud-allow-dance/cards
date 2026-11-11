/**
 * WebCrypto helpers for encrypted server share links (Concept 7).
 *
 * A server link stores only ciphertext on the server; the 256-bit key
 * lives exclusively in the URL fragment (`#k.…`), which browsers never
 * send in HTTP requests. The ciphertext format (base64url-encoded):
 *
 *   "v1" ‖ nonce(12 bytes) ‖ AES-256-GCM ciphertext ‖ auth tag
 *
 * The leading version bytes let the format evolve without breaking
 * existing links. Everything runs on WebCrypto — no dependency.
 */

/** Version prefix of the ciphertext format (ASCII, 2 bytes). */
const CIPHER_VERSION = "v1";
/** AES-GCM nonce size in bytes (96 bit, as recommended). */
const NONCE_BYTES = 12;
/** Share key size in bytes (256 bit). */
const KEY_BYTES = 32;
/** Server-link id size in bytes (128 bit). */
const ID_BYTES = 16;

/** Encodes bytes as base64url (no padding). */
export function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary)
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replace(/=+$/, "");
}

/** Decodes a base64url string (padding optional) into bytes. */
export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
    const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

/** Generates a fresh 256-bit share key, base64url-encoded (43 chars). */
export function generateShareKey(): string {
    return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(KEY_BYTES)));
}

/** Generates a fresh 128-bit server-link id, base64url-encoded (22 chars). */
export function generateShareId(): string {
    return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(ID_BYTES)));
}

async function importAesKey(keyB64Url: string): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        "raw",
        base64UrlToBytes(keyB64Url),
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"],
    );
}

/**
 * Encrypts a plaintext string (the share payload, e.g. `c.…`) with the
 * given key; returns the base64url ciphertext blob to store server-side.
 */
export async function encryptShare(
    keyB64Url: string,
    plaintext: string,
): Promise<string> {
    const key = await importAesKey(keyB64Url);
    const nonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: nonce },
            key,
            new TextEncoder().encode(plaintext),
        ),
    );
    const version = new TextEncoder().encode(CIPHER_VERSION);
    const payload = new Uint8Array(
        version.length + NONCE_BYTES + ciphertext.length,
    );
    payload.set(version, 0);
    payload.set(nonce, version.length);
    payload.set(ciphertext, version.length + NONCE_BYTES);
    return bytesToBase64Url(payload);
}

/**
 * Decrypts a server-side ciphertext blob with the key from the URL
 * fragment. Throws when the version is unsupported or the GCM auth tag
 * does not verify (wrong key or corrupted data).
 */
export async function decryptShare(
    keyB64Url: string,
    payloadB64Url: string,
): Promise<string> {
    const payload = base64UrlToBytes(payloadB64Url);
    const version = new TextDecoder().decode(
        payload.slice(0, CIPHER_VERSION.length),
    );
    if (version !== CIPHER_VERSION) {
        throw new Error("unsupported share cipher version");
    }
    const nonce = payload.slice(
        CIPHER_VERSION.length,
        CIPHER_VERSION.length + NONCE_BYTES,
    );
    const ciphertext = payload.slice(CIPHER_VERSION.length + NONCE_BYTES);
    const key = await importAesKey(keyB64Url);
    try {
        const plain = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: nonce },
            key,
            ciphertext,
        );
        return new TextDecoder().decode(plain);
    } catch {
        // GCM authentication failed: wrong key or tampered ciphertext.
        throw new Error("decryption failed");
    }
}
