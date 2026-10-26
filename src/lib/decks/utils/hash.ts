import type { DeckType } from "../../utils/types";

/**
 * Content identity of a deck: a short, stable hash over the raw markdown
 * AND the deck type, so the same text under a different type counts as a
 * different deck. The hash is a deck's identity across devices — share
 * links and progress links reference it, and the deck slug is derived
 * from it (see userDecks.add).
 *
 * SHA-256 via WebCrypto, truncated to 16 hex chars (64 bit): collision-
 * resistant for any realistic number of personal decks. Falls back to a
 * deterministic 64-bit FNV-1a hash when WebCrypto is unavailable (plain
 * HTTP dev); both devices run the app over HTTPS, so the fallback only
 * matters for local development.
 */

/** Length of the content hash in hex chars (64 bit). */
export const CONTENT_HASH_LENGTH = 16;

function fnv1aHex64(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let hash = 14695981039346656037n;
    for (const byte of bytes) {
        hash ^= BigInt(byte);
        hash = BigInt.asUintN(64, hash * 1099511628211n);
    }
    return hash.toString(16).padStart(CONTENT_HASH_LENGTH, "0");
}

/** Stable content hash of a deck; identical input, identical hash. */
export async function hashDeckContent(
    raw: string,
    deckType: DeckType,
): Promise<string> {
    const input = `${raw}\n${deckType}`;
    if (typeof crypto !== "undefined" && crypto.subtle) {
        const digest = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(input),
        );
        const hex = [...new Uint8Array(digest)]
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
        return hex.slice(0, CONTENT_HASH_LENGTH);
    }
    return fnv1aHex64(input);
}
