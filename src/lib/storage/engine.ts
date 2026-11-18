/**
 * The storage capability: a minimal async key/value interface plus the
 * JSON helpers every repository uses, and the in-memory worst case.
 * Concrete backends live in ./indexeddb.ts and ./webstorage.ts;
 * ./detect.ts is the one place that picks one. Nothing above storage/
 * ever sees a concrete backend or a storage key literal.
 */

import { recoveryRecordKey } from "#lib/storage/keys";

export type EngineKind = "indexeddb" | "localstorage" | "sessionstorage" | "memory";

export interface KeyValueEngine {
    readonly kind: EngineKind;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
    keys(): Promise<string[]>;
}

/** Reads and JSON-parses one key; null when missing or invalid JSON. */
export async function readJson(engine: KeyValueEngine, key: string): Promise<unknown | null> {
    const raw = await engine.get(key);
    if (raw === null) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/** JSON-stringifies and writes one key. */
export async function writeJson(
    engine: KeyValueEngine,
    key: string,
    value: unknown
): Promise<void> {
    await engine.set(key, JSON.stringify(value));
}

/**
 * Quarantines a corrupt record: the raw value is preserved under
 * `recovery:<uuid>` and the original key is deleted, so one bad record
 * can never break loading again — and the data stays recoverable.
 */
export async function stashForRecovery(
    engine: KeyValueEngine,
    key: string,
    raw: string
): Promise<void> {
    await engine.set(recoveryRecordKey(crypto.randomUUID()), raw);
    await engine.delete(key);
}

/** Worst-case engine: nothing persists; the UI shows the data-loss notice. */
export function memoryEngine(): KeyValueEngine {
    const map = new Map<string, string>();
    return {
        kind: "memory",
        async get(key) {
            return map.get(key) ?? null;
        },
        async set(key, value) {
            map.set(key, value);
        },
        async delete(key) {
            map.delete(key);
        },
        async keys() {
            return [...map.keys()];
        },
    };
}
