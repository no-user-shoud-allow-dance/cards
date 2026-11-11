import { BOX_COUNT, type DeckType } from "../types";

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
 *   #t.{payload}        "together" — cards AND progress in one link
 *                       (`#c.…` + `#p.…` combined). Emitted by the export
 *                       page's "Beides" mode.
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
 *
 * ── Combined link protocol (plain JSON, before gzip) ────────────────
 *
 *   {"t": deckType, "r": rawMarkdown, "h": contentHash,
 *    "s": [boxPerCardIndex], "o": 0|1, "m": studyTimeMs}
 *
 *   The combined ("together") link carries the full deck payload plus
 *   the progress fields of the progress protocol, so one link transfers
 *   cards and learning progress at once.
 */

/** Soft size limit for a share-link hash; above this the user is warned. */
export const SHARE_HASH_LIMIT = 1_000_000;

/**
 * Approximate URL length above which a QR code can no longer hold the
 * link: byte-mode capacity at error-correction level M is ~2331 bytes
 * (version 40), and the URL adds the origin plus "/#". Above this the
 * QR rendering fails with "code length overflow" — warn beforehand.
 */
export const SHARE_QR_LIMIT = 2_200;

/**
 * Below this link length (half of the max QR capacity) a deck is "too
 * small" for a server link: the QR code holds it comfortably, so the
 * server-link option is disabled on the export page. Above it the user
 * may freely choose between QR and server link.
 */
export const SERVER_LINK_MIN_LENGTH = SHARE_QR_LIMIT / 2;

/** Prefix of a deck ("cards") share link. */
export const DECK_PREFIX = "c.";
/** Legacy deck-link prefix; still decoded, never emitted. */
export const LEGACY_DECK_PREFIX = "deck=v1.";
/** Prefix of a progress share link. */
export const PROGRESS_PREFIX = "p.";
/** Prefix of a combined ("together") share link: cards + progress. */
export const COMBINED_PREFIX = "t.";
/** Prefix of a full-sync payload (`s.…`) used by device-to-device sync. */
export const SYNC_PREFIX = "s.";
/**
 * Prefix of an encrypted server-link hash: `#k.{payload}`, where payload
 * is the base64url of the 48 raw bytes `id(16) ‖ key(32)` — encoding the
 * two together saves the separator and padding overhead of two separate
 * base64url strings (64 chars instead of 22+1+43=66; the bytes are
 * random, so gzip would only make them longer). The fragment is
 * self-contained and never sent to the server; the app extracts id + key
 * locally and only the id goes to `/api/share/{id}`. Canonical link:
 * `{origin}/#k.{payload}`. Older forms — `#k.{id}.{key}` and
 * `/s/{id}#k.{key}` — are still parsed for links already issued.
 */
export const SERVER_PREFIX = "k.";

/**
 * Full-sync payload (plain JSON, before gzip+base64url), exchanged
 * peer-to-peer during device sync:
 *
 *   {"kind":"nsc-sync","version":1,
 *    "decks": [Deck…],                          // full deck records
 *    "progress": { contentHash: { "s": [boxPerCardIndex], "o": 0|1 } } }
 *
 * Progress is keyed by deck contentHash (not slug), because slugs carry
 * a random per-device suffix — the hash is the stable identity. There is
 * no account UUID in the payload: the peer ID is the sync trust anchor.
 */
export interface SyncPayload {
    kind: "nsc-sync";
    version: 1;
    /** Full deck records (raw markdown, name, folder, deckType, contentHash). */
    decks: unknown[];
    /** Per-deck progress keyed by contentHash: boxes per card index + overview flag. */
    progress: Record<string, { s: number[]; o: boolean }>;
}

/** Encodes a full-sync payload as an `s.…` string (gzip + base64url). */
export async function encodeSyncShare(payload: SyncPayload): Promise<string> {
    const json = JSON.stringify(payload);
    const compressed = await gzip(new TextEncoder().encode(json));
    return `${SYNC_PREFIX}${bytesToBase64Url(compressed)}`;
}

/**
 * Decodes an `s.…` sync payload; null if invalid (bad prefix, corrupt
 * gzip/base64, wrong kind/version, malformed fields).
 */
export async function decodeSyncShare(hash: string): Promise<SyncPayload | null> {
    const payload = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!payload.startsWith(SYNC_PREFIX)) return null;
    try {
        const json = new TextDecoder().decode(
            await gunzip(base64UrlToBytes(payload.slice(SYNC_PREFIX.length))),
        );
        const data: unknown = JSON.parse(json);
        if (typeof data !== "object" || data === null) return null;
        const d = data as {
            kind?: unknown;
            version?: unknown;
            decks?: unknown;
            progress?: unknown;
        };
        if (d.kind !== "nsc-sync" || d.version !== 1) return null;
        if (!Array.isArray(d.decks)) return null;
        if (typeof d.progress !== "object" || d.progress === null) return null;
        const progress: SyncPayload["progress"] = {};
        for (const [hashKey, value] of Object.entries(
            d.progress as Record<string, unknown>,
        )) {
            if (typeof value !== "object" || value === null) continue;
            const v = value as { s?: unknown; o?: unknown };
            if (!Array.isArray(v.s)) continue;
            const boxes: number[] = [];
            let valid = true;
            for (const box of v.s) {
                if (
                    typeof box !== "number" ||
                    !Number.isInteger(box) ||
                    box < 0 ||
                    box > BOX_COUNT
                ) {
                    valid = false;
                    break;
                }
                boxes.push(box);
            }
            if (!valid) continue;
            progress[hashKey] = { s: boxes, o: v.o === 1 || v.o === true };
        }
        return {
            kind: "nsc-sync",
            version: 1,
            decks: d.decks,
            progress,
        };
    } catch {
        return null;
    }
}

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

export interface CombinedSharePayload {
    /** The deck itself ("cards" part of the link). */
    deck: SharePayload;
    /** The learning progress ("progress" part of the link). */
    progress: ProgressSharePayload;
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

/**
 * Encodes a deck together with its learning progress as a combined
 * ("together") link payload (`#t.…`) — one link carries cards and
 * progress, so a single share transfers the whole state.
 */
export async function encodeCombinedShare(
    deck: SharePayload,
    progress: ProgressSharePayload,
): Promise<string> {
    const json = JSON.stringify({
        t: deck.deckType,
        r: deck.raw,
        h: progress.hash,
        s: progress.boxes,
        o: progress.overviewDone ? 1 : 0,
        m: Math.max(0, Math.round(progress.studyTimeMs)),
    });
    const compressed = await gzip(new TextEncoder().encode(json));
    return `${COMBINED_PREFIX}${bytesToBase64Url(compressed)}`;
}

/**
 * Decodes a combined link payload back into deck + progress; null if
 * invalid. See the protocol description at the top of this file.
 */
export async function decodeCombinedShare(
    hash: string,
): Promise<CombinedSharePayload | null> {
    const payload = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!payload.startsWith(COMBINED_PREFIX)) return null;
    try {
        const json = new TextDecoder().decode(
            await gunzip(
                base64UrlToBytes(payload.slice(COMBINED_PREFIX.length)),
            ),
        );
        const data: unknown = JSON.parse(json);
        if (typeof data !== "object" || data === null) return null;
        const d = data as {
            t?: unknown;
            r?: unknown;
            h?: unknown;
            s?: unknown;
            o?: unknown;
            m?: unknown;
        };
        if (typeof d.r !== "string" || typeof d.h !== "string") return null;
        if (!/^[0-9a-f]{16}$/.test(d.h)) return null;
        if (!Array.isArray(d.s)) return null;
        const boxes: number[] = [];
        for (const state of d.s) {
            if (
                typeof state !== "number" ||
                !Number.isInteger(state) ||
                state < 0 ||
                state > BOX_COUNT
            ) {
                return null;
            }
            boxes.push(state);
        }
        const t = d.t;
        const deckType = DECK_TYPES_LIST.includes(t as DeckType)
            ? (t as DeckType)
            : "latin";
        return {
            deck: { raw: d.r, deckType },
            progress: {
                hash: d.h,
                boxes,
                overviewDone: d.o === 1 || d.o === true,
                studyTimeMs:
                    typeof d.m === "number" && d.m > 0
                        ? Math.round(d.m)
                        : 0,
            },
        };
    } catch {
        return null;
    }
}

/**
 * Normalizes a pasted or scanned share link to its hash part: a full URL
 * ("https://…/#c.…") is reduced to the "#c.…" hash, a bare hash passes
 * through unchanged.
 */
export function extractShareHash(input: string): string {
    const trimmed = input.trim();
    const hashIndex = trimmed.indexOf("#");
    return hashIndex === -1 ? trimmed : trimmed.slice(hashIndex);
}

/**
 * Whether a URL hash carries any share payload (deck, legacy deck,
 * progress, combined or encrypted server link), with or without the
 * leading "#".
 */
export function isShareHash(hash: string): boolean {
    const bare = hash.startsWith("#") ? hash.slice(1) : hash;
    return (
        bare.startsWith(DECK_PREFIX) ||
        bare.startsWith(LEGACY_DECK_PREFIX) ||
        bare.startsWith(PROGRESS_PREFIX) ||
        bare.startsWith(COMBINED_PREFIX) ||
        bare.startsWith(SERVER_PREFIX)
    );
}

/** A parsed server-link reference: the public id plus the secret key. */
export interface ServerShareRef {
    id: string;
    key: string;
}

/** A parsed `#k.…` fragment: the id (if present) plus the key. */
export interface ParsedServerShareHash {
    /** Null only for the key-only `#k.{key}` form (id lives in the /s/ path). */
    id: string | null;
    key: string;
}

/** 128-bit id, base64url-encoded (22 chars). */
const SERVER_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;
/** 256-bit key, base64url-encoded (43 chars). */
const SERVER_KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;
/** Raw byte length of the canonical payload: id(16) ‖ key(32). */
const SERVER_PAYLOAD_BYTES = 48;

/** Whether a string is a well-formed server-link id. */
export function isServerShareId(id: string): boolean {
    return SERVER_ID_PATTERN.test(id);
}

/**
 * Builds the self-contained server-link hash: `k.{payload}` where payload
 * is base64url over the 48 raw bytes `id ‖ key` (one encoding instead of
 * two saves the separator + padding: 64 chars instead of 66).
 */
export function buildServerShareHash(id: string, key: string): string {
    const bytes = new Uint8Array(SERVER_PAYLOAD_BYTES);
    bytes.set(base64UrlToBytes(id), 0);
    bytes.set(base64UrlToBytes(key), 16);
    return `${SERVER_PREFIX}${bytesToBase64Url(bytes)}`;
}

/**
 * Parses a `#k.…` hash (with or without the leading "#"). Accepted forms:
 * the canonical `k.{payload}` (base64url of id‖key, 64 chars), the
 * legacy `k.{id}.{key}`, and the key-only `k.{key}` used with `/s/{id}`
 * paths. Null if the format is invalid.
 */
export function parseServerShareHash(
    hash: string,
): ParsedServerShareHash | null {
    const bare = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!bare.startsWith(SERVER_PREFIX)) return null;
    const body = bare.slice(SERVER_PREFIX.length);
    const parts = body.split(".");
    if (parts.length === 2) {
        // Legacy self-contained form: k.{id}.{key}
        const [id, key] = parts;
        if (!isServerShareId(id)) return null;
        if (!SERVER_KEY_PATTERN.test(key)) return null;
        return { id, key };
    }
    if (parts.length !== 1) return null;
    const [part] = parts;
    if (SERVER_KEY_PATTERN.test(part)) {
        // Key-only form (id in the /s/{id} path).
        return { id: null, key: part };
    }
    // Canonical form: base64url over the 48 raw bytes id(16) ‖ key(32).
    let bytes: Uint8Array<ArrayBuffer>;
    try {
        bytes = base64UrlToBytes(part);
    } catch {
        return null;
    }
    if (bytes.length !== SERVER_PAYLOAD_BYTES) return null;
    const id = bytesToBase64Url(bytes.subarray(0, 16));
    const key = bytesToBase64Url(bytes.subarray(16));
    if (!isServerShareId(id) || !SERVER_KEY_PATTERN.test(key)) return null;
    return { id, key };
}

/**
 * Builds the canonical server-link URL: `{origin}/#k.{id}.{key}`.
 * The whole payload lives in the fragment, which is never sent in any
 * HTTP request — the app extracts id + key locally and only the id is
 * sent to `/api/share/{id}`.
 */
export function buildServerShareUrl(
    origin: string,
    id: string,
    key: string,
): string {
    return `${origin}/#${buildServerShareHash(id, key)}`;
}

/**
 * Parses a pasted or scanned server link — a full URL
 * (`https://…/#k.{id}.{key}`) or a bare `#k.…` hash — into its id and
 * key; null if the input is not a usable server link. The two-part
 * fragment is self-contained; the one-part compact form (`#k.{key}`,
 * issued as `/s/{id}#k.{key}`) takes the id from the path.
 */
export function parseServerShareLink(input: string): ServerShareRef | null {
    const trimmed = input.trim();
    const hashIndex = trimmed.indexOf("#");
    if (hashIndex === -1) return null;
    const parsed = parseServerShareHash(trimmed.slice(hashIndex));
    if (!parsed) return null;
    if (parsed.id) return { id: parsed.id, key: parsed.key };
    // Compact fragment `k.{key}`: the id must come from the /s/{id} path.
    const pathMatch = /\/s\/([A-Za-z0-9_-]{22})(?:[/?#]|$)/.exec(
        trimmed.slice(0, hashIndex),
    );
    if (!pathMatch || !isServerShareId(pathMatch[1])) return null;
    return { id: pathMatch[1], key: parsed.key };
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
