import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { kvCommand, kvConfig } from "#lib/server/kv";

/**
 * `GET /api/share/{id}` — returns the stored ciphertext + meta and bumps
 * the download counter. Only the id is needed: the ciphertext is useless
 * without the key, which lives in the URL fragment and never reaches the
 * server. 404 when the link expired (TTL 2 days). There is no delete
 * endpoint — links simply expire.
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
    id: string,
): Promise<{ ciphertext: string; meta: ShareMeta } | null> {
    const result = (await kvCommand(
        kv,
        "MGET",
        `share:${id}`,
        `share:${id}:meta`,
    )) as [string | null, string | null];
    const [ciphertext, metaRaw] = result;
    if (!ciphertext || !metaRaw) return null;
    const meta = parseMeta(metaRaw);
    if (!meta) return null;
    return { ciphertext, meta };
}

export const GET: RequestHandler = async (event) => {
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
    const id = event.params.id ?? "";
    if (!ID_PATTERN.test(id)) {
        return json(
            { error: "bad_request", message: "Ungültige Link-ID." },
            { status: 400 },
        );
    }

    try {
        // Light per-IP rate limit on the public read endpoint.
        const ip = event.getClientAddress();
        const bucket = `ratelimit:share-get:${ip}:${new Date().toISOString().slice(0, 13)}`;
        const count = await kvCommand(kv, "INCR", bucket);
        if (count === 1) await kvCommand(kv, "EXPIRE", bucket, 3600);
        if (typeof count === "number" && count > GET_LIMIT_PER_HOUR) {
            return json(
                {
                    error: "rate_limited",
                    message:
                        "Zu viele Anfragen — bitte später erneut versuchen.",
                },
                { status: 429 },
            );
        }

        const entry = await loadEntry(kv, id);
        if (!entry) {
            return json(
                {
                    error: "not_found",
                    message: "Link abgelaufen.",
                },
                { status: 404 },
            );
        }
        // Bump the download counter, keeping the original TTL.
        const meta: ShareMeta = { ...entry.meta, downloads: entry.meta.downloads + 1 };
        await kvCommand(
            kv,
            "SET",
            `share:${id}:meta`,
            JSON.stringify(meta),
            "KEEPTTL",
        );
        return json({
            ciphertext: entry.ciphertext,
            meta: {
                createdAt: meta.createdAt,
                size: meta.size,
                downloads: meta.downloads,
            },
        });
    } catch {
        return json(
            { error: "server_error", message: "Server-Fehler beim Laden." },
            { status: 500 },
        );
    }
};
