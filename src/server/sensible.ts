/**
 * Pseudonymizes a client IP for the rate-limit buckets (DSGVO Art. 4
 * Nr. 5, Art. 5 Abs. 1 lit. c): only the HMAC-SHA256 of the IP is stored,
 * keyed with the server-side KV token — the raw IP never lands in Redis.
 * Buckets expire after one hour, so the pseudonymized value is deleted
 * with them (Art. 5 Abs. 1 lit. e).
 */
export async function hashSensible(sensible: string, secret: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(sensible));
    return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
