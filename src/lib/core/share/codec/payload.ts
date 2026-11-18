import { ErrorCode, NscError } from "#lib/core/errors";
import { base64ToBytes, bytesToBase64 } from "./base64";
import { gunzipBytes, gzipBytes } from "./gzip";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Incoming-payload caps (gzip-bomb guard): the encoded payload may not
 * exceed MAX_PAYLOAD_CHARS and the decompressed JSON not MAX_DECODED_BYTES.
 * The outgoing cap is SHARE_PATH_CAP in links.ts.
 */
export const MAX_PAYLOAD_CHARS = 8 * 1024;
export const MAX_DECODED_BYTES = 1024 * 1024;

/** `base64url(gzip(utf8(JSON.stringify(body))))`. */
export async function encodePayload(body: unknown): Promise<string> {
    return bytesToBase64(await gzipBytes(encoder.encode(JSON.stringify(body))));
}

/** Inverse of encodePayload; throws on bad input or over-cap payloads. */
export async function decodePayload(payload: string): Promise<unknown> {
    if (payload.length > MAX_PAYLOAD_CHARS) {
        throw new NscError(ErrorCode.LINK_PAYLOAD_TOO_LARGE, {
            length: payload.length,
            cap: MAX_PAYLOAD_CHARS,
        });
    }
    let bytes: Uint8Array;
    try {
        bytes = await gunzipBytes(base64ToBytes(payload), MAX_DECODED_BYTES);
    } catch (e) {
        if (e instanceof NscError) throw e;
        throw new NscError(ErrorCode.LINK_INVALID_ENCODING, { reason: "gunzip" });
    }
    try {
        return JSON.parse(decoder.decode(bytes)) as unknown;
    } catch {
        throw new NscError(ErrorCode.LINK_INVALID_ENCODING, { reason: "json" });
    }
}
