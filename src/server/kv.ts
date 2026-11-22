/**
 * Minimal Upstash (Vercel KV) REST client — plain `fetch`, no npm
 * dependency. Commands are sent as JSON arrays to the REST endpoint with
 * a bearer token; the response is `{ result }` or `{ error }`.
 *
 * Env vars (already provisioned on Vercel under these names; `.env` in
 * dev): `UPSTASH_URL` / `UPSTASH_TOKEN`.
 */

import { UPSTASH_TOKEN, UPSTASH_URL } from "$app/env/private";

export interface KvConfig {
    url: string;
    token: string;
}

/**
 * Returns the KV REST config from the environment, or null if unset.
 * The variables are declared in `src/env.ts` and exposed as named
 * exports of `$app/env/private` (SvelteKit 3 explicit env vars): in dev
 * the root `.env` is loaded automatically at server start — restart the
 * dev server if it was started before `.env` existed; on Vercel they
 * come from the project's environment settings.
 */
export function kvConfig(): KvConfig | null {
    const url = UPSTASH_URL ?? "";
    const token = UPSTASH_TOKEN ?? "";
    if (!url || !token) return null;
    return { url: url.replace(/\/+$/, ""), token };
}
/**
 * Runs one Redis command against the REST endpoint and returns its
 * `result`. Throws on HTTP errors or Redis-level `error` responses.
 */
export async function kvCommand(kv: KvConfig, ...command: (string | number)[]): Promise<unknown> {
    const response = await fetch(kv.url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${kv.token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
    });
    if (!response.ok) {
        throw new Error(`KV REST HTTP ${response.status}`);
    }
    const data = (await response.json()) as {
        result?: unknown;
        error?: unknown;
    };
    if (typeof data.error === "string") {
        throw new Error(`KV error: ${data.error}`);
    }
    return data.result;
}
