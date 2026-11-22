import type { RequestHandler } from "./$types";
import { jsonError, kvCommand, kvConfig, rateLimited, shareKey, shareMetaKey } from "#server";

/**
 * `GET /api/share/{id}` — returns the stored ciphertext + meta and bumps
 * the download counter. Only the id is needed: the ciphertext is useless
 * without the key, which lives in the URL fragment and never reaches the
 * server. 404 when the link expired (TTL 2 days). There is no delete
 * endpoint — links simply expire. Error responses carry the stable
 * `error` code plus an English `message`; the UI maps the code to German
 * (readApiError).
 */

const ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;
/** Downloads allowed per IP per hour (read endpoint is public). */
const GET_LIMIT_PER_HOUR = 100;

interface ShareMeta {
    createdAt: string;
    size: number;
    downloads: number;
}

function parseMeta(raw: string): ShareMeta | null {
    try {
        const data = JSON.parse(raw) as Partial<ShareMeta>;
        if (
            typeof data.createdAt !== "string" ||
            typeof data.size !== "number" ||
            typeof data.downloads !== "number"
        ) {
            return null;
        }
        return data as ShareMeta;
    } catch {
        return null;
    }
}

async function loadEntry(
    kv: NonNullable<ReturnType<typeof kvConfig>>,
    id: string
): Promise<{ ciphertext: string; meta: ShareMeta } | null> {
    const result = (await kvCommand(kv, "MGET", shareKey(id), shareMetaKey(id))) as [
        string | null,
        string | null,
    ];
    const [ciphertext, metaRaw] = result;
    if (!ciphertext || !metaRaw) return null;
    const meta = parseMeta(metaRaw);
    if (!meta) return null;
    return { ciphertext, meta };
}

export const GET: RequestHandler = async (event) => {
    const kv = kvConfig();
    if (!kv) {
        return jsonError(503, "unavailable", "Server links are not configured on this server.");
    }
    const id = event.params.id ?? "";
    if (!ID_PATTERN.test(id)) {
        return jsonError(400, "bad_request", "Invalid link id.");
    }

    try {
        // Light per-IP rate limit on the public read endpoint. Only the
        // HMAC-pseudonymized IP is stored (DSGVO), never the raw address.
        if (await rateLimited(kv, "get", event.getClientAddress(), GET_LIMIT_PER_HOUR)) {
            return jsonError(429, "rate_limited", "Too many requests – please try again later.");
        }

        const entry = await loadEntry(kv, id);
        if (!entry) {
            return jsonError(404, "not_found", "Link expired.");
        }
        // Bump the download counter, keeping the original TTL.
        const meta: ShareMeta = { ...entry.meta, downloads: entry.meta.downloads + 1 };
        await kvCommand(kv, "SET", shareMetaKey(id), JSON.stringify(meta), "KEEPTTL");
        return Response.json({
            ciphertext: entry.ciphertext,
            meta: {
                createdAt: meta.createdAt,
                size: meta.size,
                downloads: meta.downloads,
            },
        });
    } catch {
        return jsonError(500, "server_error", "Server error while loading.");
    }
};
