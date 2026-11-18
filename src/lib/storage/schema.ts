import type { DeckHash } from "#lib/core/deck/hash";
import { makeSlug, randomSlugSuffix, type Slug } from "#lib/core/deck/identity";
import type { RawMarkdown } from "#lib/core/deck/parse";
import { base64ToBytes, bytesToBase64, gunzipBytes, gzipBytes } from "#lib/core/share/codec/";

/**
 * The versioned persisted deck record. All database names, store names, prefixes and keys live
 * in the central storage map: ./keys.ts.
 */

/**
 * Record of one deck. Content only — a deck's folders live in its
 * learning-state record (kk-state), never here.
 */
export interface StorageRecord {
    slug: string;
    createdAt: number;
    /** base64url(gzip(markdown)) — L0, handled only inside storage. */
    payload: string;
}

export function isStorageRecord(value: unknown): value is StorageRecord {
    if (typeof value !== "object" || value === null) return false;
    const r = value as Record<string, unknown>;
    return (
        typeof r.slug === "string" &&
        typeof r.createdAt === "number" &&
        typeof r.payload === "string"
    );
}

/** Decodes a record's payload to raw markdown (L0, storage-internal). */
export async function recordToRaw(record: StorageRecord): Promise<RawMarkdown> {
    const bytes = await gunzipBytes(base64ToBytes(record.payload));
    return bytesToRaw(bytes);
}

/** Encodes raw markdown into a record payload (L0, storage-internal). */
export async function rawToPayload(raw: RawMarkdown): Promise<string> {
    return bytesToBase64(await gzipBytes(new TextEncoder().encode(raw)));
}

function bytesToRaw(bytes: Uint8Array): RawMarkdown {
    return new TextDecoder().decode(bytes) as RawMarkdown;
}

/** Builds a fresh slug for a deck: 16-hex content hash + 4-char suffix. */
export function makeDeckSlug(docHash: DeckHash, random: () => number = Math.random): Slug {
    return makeSlug(docHash, randomSlugSuffix(random));
}
