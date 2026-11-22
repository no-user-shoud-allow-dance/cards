import { ErrorCode, NscError } from "#lib/core/errors";
import type { DeckDocument } from "#lib/core/deck/document";

/**
 * Deterministic 64-bit FNV-1a hash as 16 hex chars. Synchronous on
 * purpose: CardId/DeckHash are Record keys and must be identical on
 * every device (share/sync links), so no async WebCrypto here.
 */
export function fnv1aHex64(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let hash = 14695981039346656037n;
    for (const byte of bytes) {
        hash ^= BigInt(byte);
        hash = BigInt.asUintN(64, hash * 1099511628211n);
    }
    return hash.toString(16).padStart(16, "0");
}

export type DeckHash = string & { readonly __brand: "DeckHash" };

export function isDeckHash(value: string): boolean {
    return /^[0-9a-f]{16}$/.test(value);
}

/** Brands an already-computed hash string (e.g. from a wire payload) after validation. */
export function deckHashFromString(value: string): DeckHash {
    if (!isDeckHash(value)) {
        throw new NscError(ErrorCode.LINK_BAD_SHAPE, { field: "deckHash", value });
    }
    return value as DeckHash;
}

/**
 * Content identity of a deck: hash over title + type + cards, but NOT
 * over `meta` — editing author/description/source must not change deck
 * identity. The one checked constructor of DeckHash.
 *
 * `cardBody` is supplied by serialize.ts to avoid a module cycle; the
 * canonical per-card string covers front, back, context, tags, hidden.
 */
export function makeDeckHash(serialized: string): DeckHash {
    return fnv1aHex64(serialized) as DeckHash;
}

export function hashDeckContent(
    doc: DeckDocument,
    serializeCard: (card: DeckDocument["cards"][number]) => string
): DeckHash {
    const body = doc.cards.map(serializeCard).join("\n");
    return makeDeckHash(`${doc.title}\n${doc.type}\n${body}`);
}
