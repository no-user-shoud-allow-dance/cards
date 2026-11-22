import type { RequestHandler } from "./$types";
import {
    SHARE_TTL_SECONDS,
    jsonError,
    kvCommand,
    kvConfig,
    rateLimited,
    shareKey,
    shareMetaKey,
} from "#server";

/**
 * `POST /api/share` — stores an encrypted share payload (Concept 7).
 *
 * Body: `{ ciphertext }` — the base64url blob produced client-side
 * (`nonce ‖ AES-256-GCM ciphertext ‖ tag`). The key itself never reaches
 * the server. Stores the ciphertext under a fresh 128-bit id with a 2-day
 * TTL and returns `{ id }`. Error responses carry the stable `error` code
 * plus an English `message`; the UI maps the code to German (readApiError).
 *
 * Rate-limited per IP (5 uploads/hour); ciphertext capped at 4 MB.
 */

/** Max ciphertext size in base64url chars (≈ 4 MB binary). */
const MAX_CIPHERTEXT_CHARS = 4 * 1024 * 1024;
/** Uploads allowed per IP per hour. */
const POST_LIMIT_PER_HOUR = 5;

const CIPHERTEXT_PATTERN = /^[A-Za-z0-9_-]+$/;

/** Generates a fresh 128-bit id, base64url-encoded (22 chars). */
function randomId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export const POST: RequestHandler = async (event) => {
    const kv = kvConfig();
    if (!kv) {
        return jsonError(503, "unavailable", "Server links are not configured on this server.");
    }

    let body: unknown;
    try {
        body = await event.request.json();
    } catch {
        return jsonError(400, "bad_request", "Invalid request.");
    }
    const ciphertext = (body as { ciphertext?: unknown }).ciphertext;
    if (
        typeof ciphertext !== "string" ||
        !CIPHERTEXT_PATTERN.test(ciphertext) ||
        ciphertext.length > MAX_CIPHERTEXT_CHARS
    ) {
        return jsonError(400, "bad_request", "Invalid request.");
    }

    try {
        // Per-IP rate limit: one counter per hour bucket. Only the
        // HMAC-pseudonymized IP is stored (DSGVO), never the raw address.
        if (await rateLimited(kv, "post", event.getClientAddress(), POST_LIMIT_PER_HOUR)) {
            return jsonError(429, "rate_limited", "Too many uploads – please try again later.");
        }

        const id = randomId();
        const meta = {
            createdAt: new Date().toISOString(),
            size: ciphertext.length,
            downloads: 0,
        };
        await kvCommand(kv, "SET", shareKey(id), ciphertext, "EX", SHARE_TTL_SECONDS);
        await kvCommand(kv, "SET", shareMetaKey(id), JSON.stringify(meta), "EX", SHARE_TTL_SECONDS);
        return Response.json({ id });
    } catch {
        return jsonError(500, "server_error", "Server error while saving.");
    }
};
