import { ErrorCode, NscError } from "#lib/core/errors";

/**
 * `A-Z`, `a-z`, `0-9`, `-` and `_`
 */
const ALPHABET: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/**
 * Lookup of the {@link ALPHABET}
 * @example
 * ```json
 * {
 *     "A": 0,
 *     "B": 1,
 *     "C": 2,
 *     "-": 62,
 *     "_": 63
 * }
 * ```
 */
const LOOKUP: Map<string, number> = new Map<string, number>([...ALPHABET].map((c, i) => [c, i]));

/**
 * Converts bytes into base64 string using {@link ALPHABET}
 *
 * @param bytes - Raw string bytes
 * @returns Unpadded (no `=`), URL-safe base64 string
 */
export function bytesToBase64(bytes: Uint8Array): string {
    let out = "";

    // Process the input in 3-byte chunks. Each chunk yields 4 base64 chars.

    for (let i = 0; i < bytes.length; i += 3) {
        // `has1`/`has2` track whether bytes actually exist, so it emits only the meaningful chars.
        const has1 = i + 1 < bytes.length;
        const has2 = i + 2 < bytes.length;

        // 24-bit group: [ b0 b0 b0 b0 b0 b0 | b0 b0 b1 b1 b1 b1 | b1 b1 b2 b2 b2 b2 | b2 b2 b2 b2 b2 b2 ]
        //               \_______ 1 _______/ \_______ 2 _______/ \_______ 3 _______/ \_______ 4 _______/
        const b0 = bytes[i]!;
        const b1 = has1 ? bytes[i + 1]! : 0;
        const b2 = has2 ? bytes[i + 2]! : 0;

        out += ALPHABET[b0 >> 2]!;

        //   b0     = 1 0 1 1 0 1 0 1
        // & 0x03   = 0 0 0 0 0 0 1 1
        //   result = 0 0 0 0 0 0 0 1 => 0 0 0 1 0 0 0 0
        //                             &         1 0 1 0 X X X X
        out += ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)]!;

        //   b1     = 1 0 1 1 0 1 0 1
        // & 0x0f   = 0 0 0 0 1 1 1 1
        //   result = 0 0 0 0 0 1 0 1 => 0 0 0 1 0 1 0 0
        //                             &             1 0 X X X X X X
        out += has1 ? ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)]! : "";

        //   b2     = 1 0 1 1 0 1 0 1
        // & 0x3f   = 0 0 1 1 1 1 1 1
        //   result = 0 0 1 1 0 1 0 1
        out += has2 ? ALPHABET[b2 & 0x3f]! : "";
    }

    return out;
}

/**
 * Converts base64 encoded with {@link ALPHABET} to raw bytes
 *
 * @param value - Unpadded (no `=`), URL-safe base64 string encoded with {@link ALPHABET}
 * @returns Raw bytes
 */
export function base64ToBytes(value: string): Uint8Array {
    // Fail fast on impossible lengths: base64's last chunk may be
    // 2 chars (= 12 bits → 1 byte) or 3 chars (= 18 bits → 2 bytes),
    // but a 1-char remainder can never contain a full byte (6 < 8),
    // so `length % 4 === 1` is never valid base64.
    if (value.length % 4 === 1) {
        throw new NscError(ErrorCode.LINK_INVALID_ENCODING, { reason: "length" });
    }

    const bytes: number[] = [];

    let buffer = 0;
    let bits = 0;

    for (const ch of value) {
        const v = LOOKUP.get(ch);

        if (v === undefined) {
            throw new NscError(ErrorCode.LINK_INVALID_ENCODING, { reason: "char", char: ch });
        }

        // Append the 6 new bits at the bottom of the accumulator:
        //
        //   buffer = [ ...old bits... | v v v v v v ]
        //             (grows by 6 bits per character)
        buffer = (buffer << 6) | v;
        bits += 6;

        // Once at least one full byte is available, emit it. The newest
        // bits sit at the bottom, so the next byte starts `bits - 8`
        // positions up:
        //
        //   buffer >> bits   → byte starts at the top of the unconsumed bits
        //   & 0xff           → keep exactly 8 bits; everything above is
        //                      older, already-emitted data that was never
        //                      cleared out of `buffer`, so the mask is
        //                      what prevents it from leaking into the output.
        if (bits >= 8) {
            bits -= 8;
            bytes.push((buffer >> bits) & 0xff);
        }
    }

    return new Uint8Array(bytes);
}
