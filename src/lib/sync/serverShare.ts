/**
 * Client side of the encrypted server links. Canonical form is the path
 * link `/k/{id}.{key}`: the deck markdown is encrypted locally with
 * AES-256-GCM and only the ciphertext is uploaded to `/api/share` — the
 * key lives in the link path and the API request carries the id alone.
 */

import { resolve } from "$app/paths";
import { SHARE } from "#messages/locale.svelte";
import { makeRawMarkdown } from "#lib/core/deck/parse";
import { decryptServerLink, encryptServerLink } from "#lib/core/share/crypto";
import {
    buildLinkUrl,
    generateShareKey,
    makeShareId,
    type ShareId,
    type ShareKey,
} from "#lib/core/share/links";

/** A user-facing failure with a German message (shown inline in the UI). */
export class ServerShareError extends Error {}

/** A created server link: id, key and the canonical URL. */
export interface ServerShareResult {
    id: string;
    key: string;
    url: string;
}

/**
 * Maps the stable `error` code of a failed API response to its German
 * sentence (the wire `message` is English for API consumers; the UI copy
 * lives here). Falls back to the status-based mapping for unknown codes.
 */
const API_ERROR_MESSAGES: Record<string, string | ((status: number) => string)> = {
    bad_request: SHARE.badRequest,
    rate_limited: SHARE.tooManyRequests,
    unavailable: SHARE.notConfigured,
    not_found: SHARE.linkExpired,
    server_error: SHARE.serverError,
};

/** Reads the German error message of a failed API response. */
async function readApiError(response: Response): Promise<string> {
    try {
        const data = (await response.json()) as { error?: unknown };
        if (typeof data.error === "string") {
            const mapped = API_ERROR_MESSAGES[data.error];
            if (mapped) return typeof mapped === "function" ? mapped(response.status) : mapped;
        }
    } catch {
        // Fall through to the status-based mapping.
    }
    if (response.status === 404) return SHARE.linkExpired;
    if (response.status === 429) return SHARE.tooManyRequests;
    if (response.status === 503) return SHARE.notConfigured;
    return SHARE.serverError(response.status);
}

/**
 * Encrypts deck markdown with a fresh key and uploads the ciphertext;
 * resolves with the id, the key and the canonical `/k/{id}.{key}` URL.
 * Throws ServerShareError (German message) on failure.
 */
export async function uploadServerLink(markdown: string): Promise<ServerShareResult> {
    const key = generateShareKey();
    const ciphertext = await encryptServerLink(key, makeRawMarkdown(markdown));
    let response: Response;
    try {
        // Only the ciphertext goes to the server — never the key.
        response = await fetch(resolve("/api/share"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ciphertext }),
        });
    } catch {
        throw new ServerShareError(SHARE.networkError);
    }
    if (!response.ok) throw new ServerShareError(await readApiError(response));
    const data = (await response.json()) as { id?: unknown };
    if (typeof data.id !== "string") throw new ServerShareError(SHARE.invalidResponse);
    let id: ShareId;
    try {
        id = makeShareId(data.id);
    } catch {
        throw new ServerShareError(SHARE.invalidResponse);
    }
    return {
        id,
        key,
        url: await buildLinkUrl(window.location.origin, { kind: "k", id, key }),
    };
}

/**
 * Fetches the ciphertext of a canonical server link (`/k/{id}.{key}`)
 * and decrypts it locally with the key from the link path; resolves with
 * the deck markdown. Only the id is sent to the server — never the key.
 * Throws ServerShareError (German message) on failure.
 */
export async function fetchServerLinkMarkdown(id: ShareId, key: ShareKey): Promise<string> {
    let response: Response;
    try {
        // Only the id is sent to the server — never the key.
        response = await fetch(resolve("/api/share/[id]", { id }));
    } catch {
        throw new ServerShareError(SHARE.networkError);
    }
    if (!response.ok) throw new ServerShareError(await readApiError(response));
    const data = (await response.json()) as { ciphertext?: unknown };
    if (typeof data.ciphertext !== "string") {
        throw new ServerShareError(SHARE.invalidResponse);
    }
    try {
        return await decryptServerLink(key, data.ciphertext);
    } catch {
        throw new ServerShareError(SHARE.decryptFailed);
    }
}
