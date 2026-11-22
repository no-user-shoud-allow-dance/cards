import { ErrorCode, NscError } from "#lib/core/errors";
import type { DeckHash } from "#lib/core/deck/hash";
import { isCardId, type CardId } from "#lib/core/deck/ids";
import { base64ToBytes, bytesToBase64, decodePayload, encodePayload } from "#lib/core/share/codec/";

/**
 * Share/sync link kinds. Canonical and only form is the path route
 * (`/c/{payload}`, `/p/{payload}`, `/t/{payload}`, `/s/{peerId}`,
 * `/k/{id}.{key}`). Bodies carry no version tag — the kind letter in the
 * path is the contract; a breaking body change renames the route.
 * Incoming payloads are size-capped in codec/payload.ts (decodePayload).
 */

export const SHARE_QR_WARN_LENGTH = 2200;
export const SHARE_PATH_CAP = 8 * 1024;

export type ShareId = string & { readonly __brand: "ShareId" };
export type ShareKey = string & { readonly __brand: "ShareKey" };

const B64URL = /^[A-Za-z0-9_-]+$/;

export function makeShareId(value: string): ShareId {
    if (!B64URL.test(value) || value.length !== 22) {
        throw new NscError(ErrorCode.SHARE_ID_INVALID, { value });
    }
    return value as ShareId;
}

export function makeShareKey(value: string): ShareKey {
    if (!B64URL.test(value) || value.length !== 43) {
        throw new NscError(ErrorCode.SHARE_KEY_INVALID, { value });
    }
    return value as ShareKey;
}

/** Fresh 128-bit server-link id, base64url (22 chars). */
export function generateShareId(
    random: (bytes: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer> = (b) =>
        crypto.getRandomValues(b)
): ShareId {
    return makeShareId(bytesToBase64(random(new Uint8Array(16))));
}

/** Fresh 256-bit share key, base64url (43 chars). */
export function generateShareKey(
    random: (bytes: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer> = (b) =>
        crypto.getRandomValues(b)
): ShareKey {
    return makeShareKey(bytesToBase64(random(new Uint8Array(32))));
}

/** `c` — deck only: raw markdown travels in `c`. */
export interface CardsBody {
    c: string;
}

/** One card's state as a positional tuple (sparse: only touched cards). */
export type CardStateTuple = [CardId, number, number, number | null, 0 | 1];

/** `p` — progress only, keyed by DeckHash + CardId. */
export interface ProgressBody {
    h: DeckHash;
    /** Deck-level streak. */
    s: number;
    c: CardStateTuple[];
}

/** `t` — together: deck head + per-card [markdown, ...state] tuples. */
export interface TogetherBody {
    h: DeckHash;
    s: number;
    /** Deck head: title + frontmatter; head + card lines = a valid deck file. */
    head: string;
    c: [string, number, number, number | null, 0 | 1][];
}

export type ShareLink =
    | { kind: "c"; body: CardsBody }
    | { kind: "p"; body: ProgressBody }
    | { kind: "t"; body: TogetherBody }
    | { kind: "s"; peerId: string }
    | { kind: "k"; id: ShareId; key: ShareKey };

export type ShareBody = CardsBody | ProgressBody | TogetherBody;

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

function isStateFields(v: unknown): v is [number, number, number | null, 0 | 1] {
    return (
        Array.isArray(v) &&
        v.length === 4 &&
        Number.isInteger(v[0]) &&
        Number.isInteger(v[1]) &&
        (v[2] === null || (Number.isInteger(v[2]) && (v[2] as number) >= 0)) &&
        (v[3] === 0 || v[3] === 1)
    );
}

function isCardStateTuple(v: unknown): v is CardStateTuple {
    return (
        Array.isArray(v) && v.length === 5 && typeof v[0] === "string" && isStateFields(v.slice(1))
    );
}

/** Field-by-field validation of a decoded body, per link kind. */
export function validateBody(kind: "c" | "p" | "t", raw: unknown): ShareBody {
    if (!isRecord(raw)) {
        throw new NscError(ErrorCode.LINK_BAD_SHAPE, { kind, field: "body" });
    }
    if (kind === "c") {
        if (typeof raw.c !== "string")
            throw new NscError(ErrorCode.LINK_BAD_SHAPE, { kind, field: "c" });
        return raw as unknown as CardsBody;
    }
    if (kind === "p") {
        const b = raw;
        if (typeof b.h !== "string" || !/^[0-9a-f]{16}$/.test(b.h))
            throw new NscError(ErrorCode.LINK_BAD_SHAPE, { kind, field: "h" });
        if (!Number.isInteger(b.s))
            throw new NscError(ErrorCode.LINK_BAD_SHAPE, { kind, field: "s" });
        // Progress tuples are keyed by CardId — a 16-hex content hash, not
        // arbitrary text (unlike "t", where the first element is markdown).
        if (!Array.isArray(b.c) || !b.c.every((t) => isCardStateTuple(t) && isCardId(t[0])))
            throw new NscError(ErrorCode.LINK_BAD_SHAPE, { kind, field: "c" });
        return b as unknown as ProgressBody;
    }
    const b = raw;
    if (typeof b.h !== "string" || !/^[0-9a-f]{16}$/.test(b.h))
        throw new NscError(ErrorCode.LINK_BAD_SHAPE, { kind, field: "h" });
    if (typeof b.head !== "string" || !Number.isInteger(b.s))
        throw new NscError(ErrorCode.LINK_BAD_SHAPE, { kind, field: "head/s" });
    if (
        !Array.isArray(b.c) ||
        !b.c.every(
            (t) =>
                Array.isArray(t) &&
                t.length === 5 &&
                typeof t[0] === "string" &&
                isStateFields(t.slice(1))
        )
    ) {
        throw new NscError(ErrorCode.LINK_BAD_SHAPE, { kind, field: "c" });
    }
    return b as unknown as TogetherBody;
}

async function encodeBody(body: ShareBody): Promise<string> {
    const payload = await encodePayload(body);
    if (payload.length > SHARE_PATH_CAP) {
        throw new NscError(ErrorCode.LINK_PAYLOAD_TOO_LARGE, {
            length: payload.length,
            cap: SHARE_PATH_CAP,
        });
    }
    return payload;
}

/** Builds the canonical path URL for a link: `https://host/{kind}/…`. */
export async function buildLinkUrl(origin: string, link: ShareLink): Promise<string> {
    switch (link.kind) {
        case "c":
        case "p":
        case "t":
            return `${origin}/${link.kind}/${await encodeBody(link.body)}`;
        case "s":
            return `${origin}/s/${bytesToBase64(new TextEncoder().encode(link.peerId))}`;
        case "k":
            return `${origin}/k/${link.id}.${link.key}`;
    }
}

const KIND_LETTERS = new Set(["c", "p", "t", "s"]);

/**
 * Parses a canonical path link from a full URL or a bare path
 * (`/c/…`, `/p/…`, `/t/…`, `/s/…`, `/k/{id}.{key}`).
 */
export async function parseLink(input: string): Promise<ShareLink> {
    let path = input;
    const schemeAt = input.indexOf("://");
    if (schemeAt !== -1) {
        try {
            path = new URL(input).pathname;
        } catch {
            throw new NscError(ErrorCode.LINK_UNKNOWN_KIND, { input });
        }
    }
    const match = /^\/([cpstk])\/(.+)$/.exec(path);
    if (!match) throw new NscError(ErrorCode.LINK_UNKNOWN_KIND, { input });
    const [, letter, rest] = match;
    if (letter === "k") return parseKPath(rest);
    return decodePathKind(letter!, rest);
}

function parseKPath(rest: string): ShareLink {
    const dot = rest.indexOf(".");
    if (dot === -1) throw new NscError(ErrorCode.LINK_BAD_SHAPE, { kind: "k", field: "id.key" });
    return {
        kind: "k",
        id: makeShareId(rest.slice(0, dot)),
        key: makeShareKey(rest.slice(dot + 1)),
    };
}

async function decodePathKind(letter: string, payload: string): Promise<ShareLink> {
    if (!KIND_LETTERS.has(letter))
        throw new NscError(ErrorCode.LINK_UNKNOWN_KIND, { kind: letter });
    if (letter === "s") {
        const peerId = new TextDecoder().decode(base64ToBytes(payload));
        if (!peerId.startsWith("nsc-"))
            throw new NscError(ErrorCode.LINK_BAD_SHAPE, { kind: "s", field: "peerId" });
        return { kind: "s", peerId };
    }
    const body = validateBody(letter as "c" | "p" | "t", await decodePayload(payload));
    return { kind: letter as "c" | "p" | "t", body } as ShareLink;
}
