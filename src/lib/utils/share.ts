import { BOX_COUNT, type DeckType } from "./types";

/**
 * Share links carry data in the URL hash: a gzip-compressed payload,
 * base64url-encoded. The hash is never sent to the server, so no storage
 * backend is involved — the link IS the transfer, and everything stays
 * stateless.
 *
 * ── Link kinds ──────────────────────────────────────────────────────
 *
 *   #c.{payload}        "cards" — deck only (raw markdown + deck type).
 *                       Emitted by the "Teilen" button.
 *   #deck=v1.{payload}  Legacy alias of #c.… — still decoded, never emitted.
 *   #p.{payload}        "progress" — learning progress for a deck, keyed
 *                       by the deck's content hash (see hash.ts).
 *                       Emitted by the "Synchronisieren" button.
 *
 * ── Deck link protocol (plain JSON, before gzip) ────────────────────
 *
 *   {"t": deckType, "r": rawMarkdown}
 *
 * ── Progress link protocol (plain text, BEFORE gzip+base64url) ──────
 *
 *   {hash};{s1};{s2};...;{sN};o{0|1};t{ms}
 *
 *   - hash  : 16 hex chars — content hash of the deck this progress
 *             belongs to (hashDeckContent over raw + deckType). The hash
 *             pins the exact deck content, so card positions can never
 *             drift between devices: different content ⇒ different hash
 *             ⇒ the progress is rejected, not misapplied.
 *   - s1..sN : one char per card index, in deck order. "0" = untouched,
 *             "1".."6" = Leitner box. Trailing "0" states are trimmed.
 *   - o     : "o0" | "o1" — the overview was completed ("Übersicht").
 *   - t     : "t{milliseconds}" — total study time for the deck.
 *
 *   Example (plain): 3f9a1c4b7d2e5f60;0;1;3;o1;t45000
 *   means: deck 3f9a1c4b7d2e5f60, card 0 untouched, card 1 in box 1,
 *   card 2 in box 3, overview done, 45 s of study time.
 *
 * The progress payload is gzipped like the deck payload: for realistic
 * deck sizes (30+ cards) the repetitive single-digit states compress to
 * a fraction of the plain form and base64url wins overall. Below ~30
 * cards the plain form would be a few chars shorter, but one encoding
 * pipeline keeps the code — and the protocol — simple.
 */

/** Soft size limit for a share-link hash; above this the user is warned. */
export const SHARE_HASH_LIMIT = 1_000_000;

/** Prefix of a deck ("cards") share link. */
export const DECK_PREFIX = "c.";
/** Legacy deck-link prefix; still decoded, never emitted. */
export const LEGACY_DECK_PREFIX = "deck=v1.";
/** Prefix of a progress share link. */
export const PROGRESS_PREFIX = "p.";

export interface SharePayload {
    raw: string;
    deckType: DeckType;
}

export interface ProgressSharePayload {
    /** Content hash of the deck this progress belongs to. */
    hash: string;
    /** Leitner box per card index (index = position); 0 = untouched. */
    boxes: number[];
    /** The overview was completed on the sharing device. */
    overviewDone: boolean;
    /** Total study time on the sharing device, in milliseconds. */
    studyTimeMs: number;
}

const DECK_TYPES_LIST: readonly DeckType[] = ["english", "latin", "greek"];

const STATE_PATTERN = new RegExp(`^[0-${BOX_COUNT}]$`);

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

/** Encodes a deck as a "cards" link payload (`#c.…`). */
export async function encodeDeckShare(
    raw: string,
    deckType: DeckType,
): Promise<string> {
    const json = JSON.stringify({ t: deckType, r: raw });
    const compressed = await gzip(new TextEncoder().encode(json));
    return `${DECK_PREFIX}${bytesToBase64Url(compressed)}`;
}

/**
 * Decodes a deck link payload back into the deck source; null if invalid.
 * Accepts both the current `#c.…` prefix and the legacy `#deck=v1.` alias.
 */
export async function decodeDeckShare(
    hash: string,
): Promise<SharePayload | null> {
    const payload = hash.startsWith("#") ? hash.slice(1) : hash;
    let body: string;
    if (payload.startsWith(DECK_PREFIX)) {
        body = payload.slice(DECK_PREFIX.length);
    } else if (payload.startsWith(LEGACY_DECK_PREFIX)) {
        body = payload.slice(LEGACY_DECK_PREFIX.length);
    } else {
        return null;
    }
    try {
        const json = new TextDecoder().decode(await gunzip(base64UrlToBytes(body)));
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

/**
 * Encodes learning progress as a "progress" link payload (`#p.…`).
 * `boxes` holds one Leitner box per card index; 0 means untouched.
 */
export async function encodeProgressShare(
    hash: string,
    boxes: number[],
    extras: { overviewDone: boolean; studyTimeMs: number },
): Promise<string> {
    // Trim trailing untouched cards; the decoder treats missing states as 0.
    let end = boxes.length;
    while (end > 0 && boxes[end - 1] === 0) end--;
    const parts = [hash];
    for (let i = 0; i < end; i++) parts.push(String(boxes[i]));
    parts.push(`o${extras.overviewDone ? 1 : 0}`);
    parts.push(`t${Math.max(0, Math.round(extras.studyTimeMs))}`);
    const compressed = await gzip(new TextEncoder().encode(parts.join(";")));
    return `${PROGRESS_PREFIX}${bytesToBase64Url(compressed)}`;
}

/**
 * Decodes a progress link payload; null if invalid. See the protocol
 * description at the top of this file for the plain-text format.
 */
export async function decodeProgressShare(
    hash: string,
): Promise<ProgressSharePayload | null> {
    const payload = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!payload.startsWith(PROGRESS_PREFIX)) return null;
    try {
        const plain = new TextDecoder().decode(
            await gunzip(
                base64UrlToBytes(payload.slice(PROGRESS_PREFIX.length)),
            ),
        );
        // {hash};{s1};...;{sN};o{0|1};t{ms} — the overview and study-time
        // fields are always the last two segments.
        const parts = plain.split(";");
        if (parts.length < 3) return null;
        const deckHash = parts[0];
        if (!/^[0-9a-f]{16}$/.test(deckHash)) return null;
        const overviewPart = parts[parts.length - 2];
        if (!/^o[01]$/.test(overviewPart)) return null;
        const timeMatch = /^t(\d+)$/.exec(parts[parts.length - 1]);
        if (!timeMatch) return null;
        const boxes: number[] = [];
        for (const state of parts.slice(1, -2)) {
            if (!STATE_PATTERN.test(state)) return null;
            boxes.push(Number(state));
        }
        return {
            hash: deckHash,
            boxes,
            overviewDone: overviewPart === "o1",
            studyTimeMs: Number(timeMatch[1]),
        };
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

/** Whether the Web Share API (native share sheet) is available. */
export function canNativeShare(): boolean {
    return (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
    );
}

/**
 * Opens the native share sheet (Android/iOS). Resolves true when the
 * sheet was shown — a user dismissal (AbortError) counts as shown — and
 * false when sharing is unsupported or failed.
 */
export async function nativeShare(data: {
    title: string;
    url?: string;
    text?: string;
}): Promise<boolean> {
    if (!canNativeShare()) return false;
    try {
        await navigator.share(data);
        return true;
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            return true;
        }
        return false;
    }
}
