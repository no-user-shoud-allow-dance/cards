/**
 * Client side of the encrypted server links (Concept 7): upload an
 * encrypted share payload to `/api/share`, fetch + decrypt it again, and
 * delete it. The key never leaves the browser except inside the URL
 * fragment of the link the user chooses to share.
 */

import { resolve } from "$app/paths";
import { decryptShare, encryptShare, generateShareKey } from "./crypto";
import {
    buildServerShareUrl,
    isServerShareId,
    type ServerShareRef,
} from "./share";

/** A user-facing failure with a German message (shown inline in the UI). */
export class ServerShareError extends Error {}

/** A created server link: id, key and the canonical URL. */
export interface ServerShareResult {
    id: string;
    key: string;
    url: string;
}

/** Reads the German error message of a failed API response. */
async function readApiError(response: Response): Promise<string> {
    try {
        const data = (await response.json()) as { message?: unknown };
        if (typeof data.message === "string" && data.message) {
            return data.message;
        }
    } catch {
        // Fall through to the status-based mapping.
    }
    if (response.status === 404) return "Link abgelaufen.";
    if (response.status === 429) return "Zu viele Anfragen — bitte später erneut versuchen.";
    if (response.status === 503) return "Server-Links sind auf diesem Server nicht eingerichtet.";
    return `Server-Fehler (HTTP ${response.status}).`;
}

/**
 * Encrypts a share payload (`c.…` / `t.…`, without the leading "#") with
 * a fresh key and uploads the ciphertext; resolves with the id, the key
 * and the canonical `/s/{id}#k.…` URL. The key never leaves the browser
 * except inside the fragment of the returned link. Throws ServerShareError
 * (German message) on failure.
 */
export async function uploadServerShare(
    payload: string,
): Promise<ServerShareResult> {
    const key = generateShareKey();
    const ciphertext = await encryptShare(key, payload);
    let response: Response;
    try {
        response = await fetch(resolve("/api/share"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ciphertext }),
        });
    } catch {
        throw new ServerShareError("Netzwerkfehler — bist du online?");
    }
    if (!response.ok) throw new ServerShareError(await readApiError(response));
    const data = (await response.json()) as { id?: unknown };
    if (typeof data.id !== "string" || !isServerShareId(data.id)) {
        throw new ServerShareError("Ungültige Server-Antwort.");
    }
    const id = data.id;
    return {
        id,
        key,
        url: buildServerShareUrl(window.location.origin, id, key),
    };
}

/**
 * Fetches the ciphertext for a server link and decrypts it with the key
 * from the URL fragment; resolves with the original share hash (e.g.
 * `c.…`, without the leading "#"). Throws ServerShareError (German
 * message) on 404, auth failure or network problems.
 */
export async function fetchServerSharePayload(
    ref: ServerShareRef,
): Promise<string> {
    let response: Response;
    try {
        // Only the id is sent to the server — never the fragment.
        response = await fetch(resolve("/api/share/[id]", { id: ref.id }));
    } catch {
        throw new ServerShareError("Netzwerkfehler — bist du online?");
    }
    if (!response.ok) throw new ServerShareError(await readApiError(response));
    const data = (await response.json()) as { ciphertext?: unknown };
    if (typeof data.ciphertext !== "string") {
        throw new ServerShareError("Ungültige Server-Antwort.");
    }
    try {
        return await decryptShare(ref.key, data.ciphertext);
    } catch {
        throw new ServerShareError(
            "Schlüssel falsch oder Daten beschädigt.",
        );
    }
}
