import { ErrorCode, NscError } from "#lib/core/errors";
import type { StyledText } from "#lib/core/deck/document";
import { fnv1aHex64 } from "#lib/core/deck/hash";

/**
 * Stable per-card ID: the content hash of front+back. Inserting or
 * deleting other cards never shifts it; toggling the moon (`hidden`)
 * never changes it. Editing hint content changes it — an accepted
 * consequence of treating hints as content, not decoration.
 */
export type CardId = string & { readonly __brand: "CardId" };

function canonicalSide(text: StyledText): string {
    const spans = text.spans.map((s) => `${s.style}:${s.start}-${s.end}`).join(",");
    return `${text.plain}␟${spans}`;
}

/** The one checked constructor of CardId. */
export function makeCardId(front: StyledText, back: StyledText): CardId {
    return fnv1aHex64(`${canonicalSide(front)}␞${canonicalSide(back)}`) as CardId;
}

export function isCardId(value: string): boolean {
    return /^[0-9a-f]{16}$/.test(value);
}

/** Brands an already-hashed id string (e.g. from a wire payload) after validation. */
export function cardIdFromString(value: string): CardId {
    if (!isCardId(value)) {
        throw new NscError(ErrorCode.LINK_BAD_SHAPE, { field: "cardId", value });
    }
    return value as CardId;
}
