import { indexedDbEngine } from "#lib/storage/indexeddb";
import { webStorageEngine } from "#lib/storage/webstorage";
import { memoryEngine, type KeyValueEngine } from "#lib/storage/engine";
import { STORAGE } from "#lib/storage/keys";

/**
 * Capability detection — the ONE place that knows the backends.
 * Each consumer asks for the engine class it needs (large deck records
 * vs. small per-answer records) and gets the best available backend,
 * falling back IndexedDB → localStorage → sessionStorage → memory.
 * Everything above storage/ is engine-blind: no store, component, or
 * route can tell which backend answered.
 */

function makeIdbEngine(): KeyValueEngine {
    return indexedDbEngine(
        STORAGE.indexeddb.dbName,
        STORAGE.indexeddb.dbVersion,
        STORAGE.indexeddb.stores.decks
    );
}

// The IndexedDB probe opens a database, and the engine factories run
// once per repository — cache the answer instead of paying for it every time.
let idbProbe: Promise<boolean> | null = null;
function idbWorks(): Promise<boolean> {
    return (idbProbe ??= (async () => {
        if (typeof indexedDB === "undefined") return false;
        try {
            const engine = makeIdbEngine();
            await engine.set(STORAGE.engineProbe, "1");
            await engine.delete(STORAGE.engineProbe);
            return true;
        } catch {
            return false;
        }
    })());
}

/** True when the given WebStorage accepts a write right now. */
export function webStorageWorks(
    storage: Storage | undefined,
    probeKey: string = STORAGE.engineProbe
): boolean {
    if (!storage) return false;
    try {
        storage.setItem(probeKey, "1");
        storage.removeItem(probeKey);
        return true;
    } catch {
        return false;
    }
}

/** Usable backends right now; null entries mean "not available". */
interface Capabilities {
    idb: boolean;
    local: Storage | null;
    session: Storage | null;
}

async function detectCapabilities(): Promise<Capabilities> {
    return {
        idb: await idbWorks(),
        local:
            typeof localStorage !== "undefined" && webStorageWorks(localStorage)
                ? localStorage
                : null,
        session:
            typeof sessionStorage !== "undefined" && webStorageWorks(sessionStorage)
                ? sessionStorage
                : null,
    };
}

/** Engine for large, rarely written payloads (deck records): IndexedDB first. */
export async function largeEngine(): Promise<KeyValueEngine> {
    const caps = await detectCapabilities();
    if (caps.idb) return makeIdbEngine();
    if (caps.local) return webStorageEngine(caps.local);
    if (caps.session) return webStorageEngine(caps.session);
    return memoryEngine();
}

/**
 * Engine for small records written on every answer (learning state,
 * settings, study time): localStorage first. Worst case is memory —
 * the caller then shows the explicit "data will be lost" notice.
 */
export async function smallEngine(): Promise<KeyValueEngine> {
    const caps = await detectCapabilities();
    if (caps.local) return webStorageEngine(caps.local);
    if (caps.idb) return makeIdbEngine();
    if (caps.session) return webStorageEngine(caps.session);
    return memoryEngine();
}
