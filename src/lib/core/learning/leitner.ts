import { ErrorCode, NscError } from "#lib/core/errors";

/**
 * Leitner box transitions. `Box` is a branded int 0..BOX_COUNT; only
 * promote()/demote()/makeBox() construct it — an invalid box cannot be
 * constructed. Box BOX_COUNT counts as learned.
 */
export const BOX_COUNT = 6;

export type Box = number & { readonly __brand: "Box" };

/**
 * Language-neutral box numerals I–V for boxes 1..BOX_COUNT-1; the last box
 * (BOX_COUNT) is "learned" — its label is UI wording and lives in the
 * messages layer (`UI.boxLabel`), not here.
 */
export const BOX_ROMANS = ["I", "II", "III", "IV", "V"] as const;

/** The one checked constructor of Box. */
export function makeBox(value: number): Box {
    if (!Number.isInteger(value) || value < 0 || value > BOX_COUNT) {
        throw new NscError(ErrorCode.BOX_OUT_OF_RANGE, { value, max: BOX_COUNT });
    }
    return value as Box;
}

/** A card that was never answered starts in box 1. */
export function initialBox(): Box {
    return makeBox(1);
}

/** Correct answer: one box up, capped at BOX_COUNT. */
export function promote(box: Box): Box {
    return makeBox(Math.min(box + 1, BOX_COUNT));
}

/** Wrong answer (a lapse): back to box 1. */
export function demote(_box: Box): Box {
    return makeBox(1);
}
