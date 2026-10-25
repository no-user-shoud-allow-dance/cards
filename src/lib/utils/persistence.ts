import { detectIncognito } from "detectincognitojs";

/**
 * Best-effort check for impersistent storage: private/incognito mode
 * (via detectincognitojs) plus blocked storage.
 *
 * Modern browsers allow localStorage and IndexedDB inside private
 * windows, but wipe them when the session ends. detectincognitojs
 * detects that private mode per browser generation (a timing
 * side-channel on IndexedDB durability for Chrome, OPFS/IndexedDB
 * errors for Safari and Firefox). On top of that, storage that is
 * missing or throws means nothing can be preserved at all (e.g.
 * disabled storage, some in-app browsers).
 */

const PROBE_KEY = "kk_persistence_probe";

function localStorageWorks(): boolean {
    try {
        localStorage.setItem(PROBE_KEY, "1");
        localStorage.removeItem(PROBE_KEY);
        return true;
    } catch {
        return false;
    }
}

function indexedDBBlocked(): Promise<boolean> {
    return new Promise((resolve) => {
        let settled = false;
        const done = (blocked: boolean): void => {
            if (!settled) {
                settled = true;
                resolve(blocked);
            }
        };
        // Never let a stalled request hold the toast back.
        setTimeout(() => done(false), 1500);
        try {
            const request = indexedDB.open(PROBE_KEY);
            request.onsuccess = () => {
                request.result.close();
                try {
                    indexedDB.deleteDatabase(PROBE_KEY);
                } catch {
                    /* cleanup is best-effort */
                }
                done(false);
            };
            request.onerror = () => done(true);
        } catch {
            done(true);
        }
    });
}

/**
 * Resolves to true when the app cannot rely on persistent storage.
 * Browser-only — call it from onMount.
 */
export async function detectImpersistentStorage(): Promise<boolean> {
    // Private/incognito mode: data is wiped when the session ends.
    // The library throws on browsers it cannot identify and needs a
    // secure context — treat failures as "not detected" and fall
    // through to the storage probes.
    try {
        const { isPrivate } = await detectIncognito();
        if (isPrivate) {
            return true;
        }
    } catch {
        /* fall through to the storage probes */
    }
    if (typeof localStorage === "undefined" || !localStorageWorks()) {
        return true;
    }
    if (typeof indexedDB === "undefined") {
        return true;
    }
    if (await indexedDBBlocked()) {
        return true;
    }
    try {
        if (
            navigator.storage &&
            typeof navigator.storage.estimate === "function"
        ) {
            const estimate = await navigator.storage.estimate();
            // A quota of 0 means no persistent storage is granted.
            if (estimate.quota === 0) {
                return true;
            }
        }
    } catch {
        /* estimate() is optional; ignore failures */
    }
    return false;
}
