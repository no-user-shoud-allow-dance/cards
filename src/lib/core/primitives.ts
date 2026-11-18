import { ErrorCode, NscError } from "#lib/core/errors";

/**
 * Branded value primitives. Plain `number`/`string` live only at the
 * edges (user input, wire, storage); inside the domain every invariant-
 * carrying value goes through the one checked constructor, which throws
 * `NscError` on violation.
 */

/** Non-negative integer timestamp in milliseconds since the Unix epoch. */
export type EpochMs = number & { readonly __brand: "EpochMs" };

export function makeEpochMs(value: number): EpochMs {
    if (!Number.isInteger(value) || value < 0) {
        throw new NscError(ErrorCode.EPOCH_INVALID, { value });
    }
    return value as EpochMs;
}

export function nowEpochMs(): EpochMs {
    return makeEpochMs(Date.now());
}

/** Non-empty array brand. */
export type NonEmptyArray<T> = readonly [T, ...T[]] & { readonly __brand: "NonEmptyArray" };

/** The one checked constructor of NonEmptyArray. */
export function makeNonEmptyArray<T>(items: readonly T[]): NonEmptyArray<T> {
    if (items.length === 0) {
        throw new NscError(ErrorCode.EMPTY_ARRAY);
    }
    return items as NonEmptyArray<T>;
}
