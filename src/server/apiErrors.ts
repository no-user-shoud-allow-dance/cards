/**
 * The share API speaks English on the wire: `error` is the stable
 * machine-readable contract, `message` is English for API consumers
 * (curl/debug). German UI copy is mapped client-side from the code —
 * see readApiError in src/lib/sync/serverShare.ts.
 */

/** Stable machine-readable error codes of the share API. */
export type ApiErrorCode =
    "bad_request" | "rate_limited" | "unavailable" | "not_found" | "server_error";

/** The one error response shape of the API: `{ error, message }`. */
export function jsonError(status: number, code: ApiErrorCode, message: string): Response {
    return Response.json({ error: code, message }, { status });
}
