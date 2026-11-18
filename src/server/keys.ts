/**
 * The central server key map: every Redis key the share API uses is
 * defined exactly once here — mirroring the client-side doctrine of
 * src/lib/storage/keys.ts. Nothing above or beside this file may
 * hard-code a key. The builders reproduce the exact historical key
 * strings, so live `share:*` records (2-day TTL) are not orphaned by a
 * rename — this is a relocation, not a migration.
 */

export const SERVER_KEYS = {
    prefix: {
        share: "share:",
        shareMetaSuffix: ":meta",
        rateLimitPost: "ratelimit:share-post:",
        rateLimitGet: "ratelimit:share-get:",
    },
} as const;

/** TTL of every stored share record (ciphertext + meta): 2 days. */
export const SHARE_TTL_SECONDS = 2 * 24 * 60 * 60;

/** KV key of a share ciphertext (`share:{id}`). */
export function shareKey(id: string): string {
    return SERVER_KEYS.prefix.share + id;
}

/** KV key of a share's meta record (`share:{id}:meta`). */
export function shareMetaKey(id: string): string {
    return shareKey(id) + SERVER_KEYS.prefix.shareMetaSuffix;
}

/** KV key of one rate-limit bucket (`ratelimit:share-{purpose}:{ipHash}:{hour}`). */
export function rateLimitKey(purpose: "post" | "get", ipHash: string, hour: string): string {
    const prefix =
        purpose === "post" ? SERVER_KEYS.prefix.rateLimitPost : SERVER_KEYS.prefix.rateLimitGet;
    return prefix + ipHash + ":" + hour;
}
