import { kvCommand, type KvConfig } from "./kv";
import { rateLimitKey } from "./keys";
import { hashSensible } from "./sensible";

/** Rate-limit buckets expire after one hour. */
export const RATE_LIMIT_WINDOW_S = 3600;

/** Current hour bucket (`YYYY-MM-DDTHH`) used by the rate-limit keys. */
function hourBucket(): string {
    return new Date().toISOString().slice(0, 13);
}

/**
 * The one rate-limit guard: INCR the caller's hour bucket and EXPIRE it
 * on the first hit. Only the HMAC-pseudonymized IP is stored (DSGVO),
 * never the raw address. Returns true when `limit` is exceeded.
 */
export async function rateLimited(
    kv: KvConfig,
    purpose: "post" | "get",
    ip: string,
    limit: number
): Promise<boolean> {
    const ipHash = await hashSensible(ip, kv.token);
    const bucket = rateLimitKey(purpose, ipHash, hourBucket());
    const count = await kvCommand(kv, "INCR", bucket);
    if (count === 1) await kvCommand(kv, "EXPIRE", bucket, RATE_LIMIT_WINDOW_S);
    return typeof count === "number" && count > limit;
}
