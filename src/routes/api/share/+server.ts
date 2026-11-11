import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { kvCommand, kvConfig } from "#lib/server/kv";

/**
 * `POST /api/share` — stores an encrypted share payload (Concept 7).
 *
 * Body: `{ ciphertext }` — the base64url blob (`v1 ‖ nonce ‖ AES-256-GCM
 * ciphertext ‖ tag`) produced client-side. The key itself never reaches
 * the server. Stores the ciphertext under a fresh 128-bit id with a 2-day
 * TTL and returns `{ id }`.
 *
 * Rate-limited per IP (20 uploads/hour); ciphertext capped at 4 MB.
 */

/** 2 days in seconds — the TTL of every stored share. */
const TTL_SECONDS = 2 * 24 * 60 * 60;
/** Max ciphertext size in base64url chars (≈ 4 MB binary). */
const MAX_CIPHERTEXT_CHARS = 4 * 1024 * 1024;
/** Uploads allowed per IP per hour. */
const POST_LIMIT_PER_HOUR = 20;

const CIPHERTEXT_PATTERN = /^[A-Za-z0-9_-]+$/;

/** Generates a fresh 128-bit id, base64url-encoded (22 chars). */
function randomId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary)
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replace(/=+$/, "");
}

export const POST: RequestHandler = async (event) => {
    const kv = kvConfig();
    if (!kv) {
        return json(
            {
                error: "unavailable",
                message:
                    "Server-Links sind auf diesem Server nicht eingerichtet.",
            },
            { status: 503 },
        );
    }

    let body: unknown;
    try {
        body = await event.request.json();
    } catch {
        return json(
            { error: "bad_request", message: "Ungültige Anfrage." },
            { status: 400 },
        );
    }
    const ciphertext = (body as { ciphertext?: unknown }).ciphertext;
    if (
        typeof ciphertext !== "string" ||
        !CIPHERTEXT_PATTERN.test(ciphertext) ||
        ciphertext.length > MAX_CIPHERTEXT_CHARS
    ) {
        return json(
            { error: "bad_request", message: "Ungültige Anfrage." },
            { status: 400 },
        );
    }

    try {
        // Per-IP rate limit: one counter per hour bucket.
        const ip = event.getClientAddress();
        const bucket = `ratelimit:share-post:${ip}:${new Date().toISOString().slice(0, 13)}`;
        const count = await kvCommand(kv, "INCR", bucket);
        if (count === 1) await kvCommand(kv, "EXPIRE", bucket, 3600);
        if (typeof count === "number" && count > POST_LIMIT_PER_HOUR) {
            return json(
                {
                    error: "rate_limited",
                    message:
                        "Zu viele Uploads — bitte später erneut versuchen.",
                },
                { status: 429 },
            );
        }

        const id = randomId();
        const meta = {
            createdAt: new Date().toISOString(),
            size: ciphertext.length,
            downloads: 0,
        };
        await kvCommand(kv, "SET", `share:${id}`, ciphertext, "EX", TTL_SECONDS);
        await kvCommand(
            kv,
            "SET",
            `share:${id}:meta`,
            JSON.stringify(meta),
            "EX",
            TTL_SECONDS,
        );
        return json({ id });
    } catch {
        return json(
            { error: "server_error", message: "Server-Fehler beim Speichern." },
            { status: 500 },
        );
    }
};
