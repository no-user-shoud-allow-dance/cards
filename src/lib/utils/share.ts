import type { DeckType } from "./types";

/**
 * Share links carry the deck in the URL hash: a gzip-compressed JSON
 * payload, base64url-encoded. The hash is never sent to the server, so
 * no storage backend is involved.
 */

/** Soft size limit for a share-link hash; above this the user is warned. */
export const SHARE_HASH_LIMIT = 1_000_000;

export const SHARE_PREFIX = "deck=v1.";

export interface SharePayload {
    raw: string;
    deckType: DeckType;
}

const DECK_TYPES_LIST: readonly DeckType[] = ["english", "latin", "greek"];

function bytesToBase64Url(bytes: Uint8Array): string {
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

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
    const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

async function gzip(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
    const stream = new Blob([data])
        .stream()
        .pipeThrough(new CompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
    const stream = new Blob([data])
        .stream()
        .pipeThrough(new DecompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Encodes a deck as a URL-hash payload. */
export async function encodeDeckShare(
    raw: string,
    deckType: DeckType,
): Promise<string> {
    const json = JSON.stringify({ t: deckType, r: raw });
    const compressed = await gzip(new TextEncoder().encode(json));
    return `${SHARE_PREFIX}${bytesToBase64Url(compressed)}`;
}

/** Decodes a URL-hash payload back into the deck source; null if invalid. */
export async function decodeDeckShare(
    hash: string,
): Promise<SharePayload | null> {
    const payload = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!payload.startsWith(SHARE_PREFIX)) return null;
    try {
        const json = new TextDecoder().decode(
            await gunzip(base64UrlToBytes(payload.slice(SHARE_PREFIX.length))),
        );
        const data: unknown = JSON.parse(json);
        if (
            typeof data !== "object" ||
            data === null ||
            typeof (data as { r?: unknown }).r !== "string"
        ) {
            return null;
        }
        const t = (data as { t?: unknown }).t;
        const deckType = DECK_TYPES_LIST.includes(t as DeckType)
            ? (t as DeckType)
            : "latin";
        return { raw: (data as { r: string }).r, deckType };
    } catch {
        return null;
    }
}

/** Human-readable hash size for the share warning (German UI). */
export function formatShareLength(chars: number): string {
    if (chars >= 1_000_000)
        return `${(chars / 1_000_000).toFixed(1)} Mio. Zeichen`;
    return `${Math.max(1, Math.round(chars / 1000))} Tsd. Zeichen`;
}
