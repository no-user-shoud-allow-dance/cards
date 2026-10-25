import { BOX_COUNT, type DeckType } from "./types";

/**
 * Share links carry data in the URL hash: a gzip-compressed payload,
 * encoded in a custom base-128 alphabet (exactly 7 bits per character).
 * The hash is never sent to the server, so no storage backend is
 * involved — the link IS the transfer, and everything stays stateless.
 *
 * ── The alphabet ────────────────────────────────────────────────────
 *
 *   128 symbols = 2^7, so each character carries exactly 7 bits:
 *
 *   1. the 64 URL-safe base64 symbols   A–Z a–z 0–9 - _
 *   2. a 64-symbol Unicode addition:
 *        ¡ ¢ £ § © ® ¿          (U+00A1, A2, A3, A7, A9, AE, BF)
 *        À–Ö  (U+00C0–U+00D6)   Ø–Þ  (U+00D8–U+00DE)
 *        ß–ö  (U+00DF–U+00F6)   ø ù ú (U+00F8–U+00FA)
 *
 *   The Unicode addition was proposed as 69 code points (…ø–ÿ) and
 *   trimmed to 64 so the full alphabet stays a power of two — a
 *   non-power-of-two alphabet would need fractional bits per character.
 *
 *   The printable form is more compact than the URL suggests: browsers
 *   percent-encode non-ASCII fragment characters (e.g. "§" shows up as
 *   "%C2%A7" — its two UTF-8 bytes), so a link copied from the address
 *   bar may arrive percent-encoded. Decoders percent-decode before
 *   mapping symbols to bits, so both forms work.
 *
 *   Links shared before this codec used plain base64url. Those payloads
 *   contain only base64url symbols, while base-128 payloads virtually
 *   always contain Unicode symbols (gzip output is high-entropy), so the
 *   decoder detects the codec from the alphabet — no version tag in the
 *   link, and old links keep working.
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
 * ── Progress link protocol (plain text, BEFORE gzip + base-128) ─────
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
 * a fraction of the plain form, and the base-128 codec packs 7 bits per
 * character (vs 6 for base64url). Below ~30 cards the plain form would
 * be a few chars shorter, but one encoding pipeline keeps the code —
 * and the protocol — simple.
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

// ── Base-128 codec (7 bits per character) ────────────────────────────

const BASE64URL_ALPHABET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function codePointRange(from: number, to: number): number[] {
    const points: number[] = [];
    for (let cp = from; cp <= to; cp++) points.push(cp);
    return points;
}

/**
 * The Unicode addition to the alphabet, trimmed from the proposed 69
 * code points to 64 (the last five — û ü ý þ ÿ — are dropped) so the
 * full alphabet is exactly 128 symbols = 7 bits per character.
 */
const UNICODE_ADDITION = [
    0x00a1, 0x00a2, 0x00a3, 0x00a7, 0x00a9, 0x00ae, 0x00bf,
    ...codePointRange(0x00c0, 0x00d6),
    ...codePointRange(0x00d8, 0x00de),
    ...codePointRange(0x00df, 0x00f6),
    0x00f8, 0x00f9, 0x00fa,
];

/** The 128-symbol share alphabet: base64url + the Unicode addition. */
export const SHARE_ALPHABET =
    BASE64URL_ALPHABET +
    UNICODE_ADDITION.map((cp) => String.fromCodePoint(cp)).join("");

const ALPHABET_VALUE = new Map(
    [...SHARE_ALPHABET].map((char, value) => [char, value] as const),
);

/** Encodes bytes as base-128 text: 7 bits per character. */
function bytesToBase128(bytes: Uint8Array): string {
    let out = "";
    let buffer = 0;
    let bits = 0;
    for (const byte of bytes) {
        buffer = ((buffer << 8) | byte) & 0xffff;
        bits += 8;
        while (bits >= 7) {
            bits -= 7;
            out += SHARE_ALPHABET[(buffer >>> bits) & 0x7f];
        }
        buffer &= (1 << bits) - 1;
    }
    // Trailing bits, zero-padded to a full 7-bit character. The decoder
    // recovers the byte count as floor(chars * 7 / 8), so no explicit
    // padding marker is needed.
    if (bits > 0) {
        out += SHARE_ALPHABET[(buffer << (7 - bits)) & 0x7f];
    }
    return out;
}

/** Decodes base-128 text back to bytes; throws on invalid characters. */
function base128ToBytes(text: string): Uint8Array<ArrayBuffer> {
    let buffer = 0;
    let bits = 0;
    const bytes: number[] = [];
    for (const char of text) {
        const value = ALPHABET_VALUE.get(char);
        if (value === undefined) {
            throw new Error(`invalid share character: ${char}`);
        }
        buffer = ((buffer << 7) | value) & 0xffff;
        bits += 7;
        while (bits >= 8) {
            bits -= 8;
            bytes.push((buffer >>> bits) & 0xff);
        }
        buffer &= (1 << bits) - 1;
    }
    return new Uint8Array(bytes);
}

// ── Legacy base64url codec (links shared before the base-128 codec) ──

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
    const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

/**
 * Decodes a payload body with the codec it was encoded in, detected
 * from the alphabet: legacy base64url payloads contain only base64url
 * symbols, base-128 payloads virtually always contain Unicode symbols.
 */
function decodePayloadBytes(body: string): Uint8Array<ArrayBuffer> {
    if (/^[A-Za-z0-9\-_]*$/.test(body)) return base64UrlToBytes(body);
    return base128ToBytes(body);
}

/**
 * Extracts the share payload from user input: accepts a full URL
 * ("https://…/#c.…"), a bare hash ("#c.…"), or the payload alone
 * ("c.…"). Percent-decoding is applied because browsers percent-encode
 * non-ASCII characters in the fragment (e.g. "§" arrives as "%C2%A7").
 */
export function extractShareHash(input: string): string {
    let text = input.trim();
    const hashIndex = text.indexOf("#");
    if (hashIndex !== -1) text = text.slice(hashIndex + 1);
    if (text.startsWith("#")) text = text.slice(1);
    try {
        return decodeURIComponent(text);
    } catch {
        // Malformed percent sequences: use the text as-is; the codec
        // decode will reject it if it is not a valid payload.
        return text;
    }
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
    return `${DECK_PREFIX}${bytesToBase128(compressed)}`;
}

/**
 * Decodes a deck link payload back into the deck source; null if invalid.
 * Accepts both the current `#c.…` prefix and the legacy `#deck=v1.` alias,
 * and both the base-128 and the legacy base64url codec. The input may be
 * a full URL, a bare hash, or the payload alone (see extractShareHash).
 */
export async function decodeDeckShare(
    hash: string,
): Promise<SharePayload | null> {
    const payload = extractShareHash(hash);
    let body: string;
    if (payload.startsWith(DECK_PREFIX)) {
        body = payload.slice(DECK_PREFIX.length);
    } else if (payload.startsWith(LEGACY_DECK_PREFIX)) {
        body = payload.slice(LEGACY_DECK_PREFIX.length);
    } else {
        return null;
    }
    try {
        const json = new TextDecoder().decode(
            await gunzip(decodePayloadBytes(body)),
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
    return `${PROGRESS_PREFIX}${bytesToBase128(compressed)}`;
}

/**
 * Decodes a progress link payload; null if invalid. See the protocol
 * description at the top of this file for the plain-text format. The
 * input may be a full URL, a bare hash, or the payload alone.
 */
export async function decodeProgressShare(
    hash: string,
): Promise<ProgressSharePayload | null> {
    const payload = extractShareHash(hash);
    if (!payload.startsWith(PROGRESS_PREFIX)) return null;
    const body = payload.slice(PROGRESS_PREFIX.length);
    try {
        const plain = new TextDecoder().decode(
            await gunzip(decodePayloadBytes(body)),
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
