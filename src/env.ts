import { defineEnvVars } from "@sveltejs/kit/env";

/**
 * Explicitly declared private environment variables (SvelteKit 3 way —
 * see https://svelte.dev/docs/kit/environment-variables). In dev and at
 * build time, `.env` / `.env.local` are loaded automatically; on Vercel
 * the variables come from the project settings. Consumed via
 * `$app/env/private` (server-only) in `src/lib/server/kv.ts`.
 *
 * Both naming pairs are declared: the `UPSTASH_KV_REST_API_*` names of a
 * manually created Upstash database (present in the local `.env`) and
 * the `VERCEL_KV_REST_API_*` names Vercel injects for an attached KV
 * store (present in production) — either pair works, so every variable
 * is optional: a function schema returning `undefined` marks it as such.
 */
export const variables = defineEnvVars({
    UPSTASH_KV_REST_API_URL: {
        description: "Upstash (Vercel KV) REST endpoint, e.g. https://….upstash.io",
        schema: (value) => value,
    },
    UPSTASH_KV_REST_API_TOKEN: {
        description: "Upstash REST bearer token (read-write)",
        schema: (value) => value,
    },
    UPSTASH_KV_REST_API_READ_ONLY_TOKEN: {
        description: "Upstash REST bearer token (read-only)",
        schema: (value) => value,
    },
    VERCEL_KV_REST_API_URL: {
        description: "Vercel KV REST endpoint (injected when a KV store is attached)",
        schema: (value) => value,
    },
    VERCEL_KV_REST_API_TOKEN: {
        description: "Vercel KV REST bearer token (injected when a KV store is attached)",
        schema: (value) => value,
    },
    // Imprint (Impressum) data — lives in .env / Vercel env settings, never
    // in the source code. Rendered by /legal/impressum via a server load.
    IMPRESSUM_NAME: {
        description: "Full name of the Verantwortlicher (Diensteanbieter), § 5 DDG",
        schema: (value) => value,
    },
    IMPRESSUM_STREET: {
        description: "Street and house number of the Verantwortlicher",
        schema: (value) => value,
    },
    IMPRESSUM_ZIP: {
        description: "Postal code of the Verantwortlicher",
        schema: (value) => value,
    },
    IMPRESSUM_CITY: {
        description: "City of the Verantwortlicher",
        schema: (value) => value,
    },
    IMPRESSUM_COUNTRY: {
        description: "Country of the Verantwortlicher",
        schema: (value) => value,
    },
    IMPRESSUM_EMAIL: {
        description: "Contact email of the Verantwortlicher (§ 5 Abs. 1 Nr. 2 DDG)",
        schema: (value) => value,
    },
});
