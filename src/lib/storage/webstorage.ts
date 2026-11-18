import type { EngineKind, KeyValueEngine } from "#lib/storage/engine";

/**
 * localStorage/sessionStorage engine, with quota-error handling:
 * a QuotaExceededError propagates so the caller can downgrade the
 * repository to the next backend.
 */
export function webStorageEngine(storage: Storage): KeyValueEngine {
    // SSR guard, checked once instead of on every operation.
    const enabled = typeof window !== "undefined";
    return {
        kind:
            typeof localStorage !== "undefined" && storage === localStorage
                ? ("localstorage" as EngineKind)
                : ("sessionstorage" as EngineKind),
        async get(key) {
            return enabled ? storage.getItem(key) : null;
        },
        async set(key, value) {
            if (!enabled) return;
            storage.setItem(key, value); // throws QuotaExceededError → caller downgrades
        },
        async delete(key) {
            if (!enabled) return;
            storage.removeItem(key);
        },
        async keys() {
            if (!enabled) return [];
            const out: string[] = [];
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key) out.push(key);
            }
            return out;
        },
    };
}
