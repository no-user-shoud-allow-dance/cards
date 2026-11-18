/**
 * Payload encoding pipeline (innermost first):
 * `JSON` → `utf8` → `gzip` → `base64url`,
 * no padding, URL-safe. Implemented without atob/btoa so the pure core
 * also runs under plain Node/Bun test runners.
 */

export { base64ToBytes, bytesToBase64 } from "#lib/core/share/codec/base64";
export { gunzipBytes, gzipBytes } from "#lib/core/share/codec/gzip";
export { decodePayload, encodePayload } from "#lib/core/share/codec/payload";
