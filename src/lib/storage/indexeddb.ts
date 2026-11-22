import type { EngineKind, KeyValueEngine } from "#lib/storage/engine";

/**
 * IndexedDB engine: guarded migrations (onupgradeneeded creates the
 * store only when missing) and promisified requests.
 */

function openDatabase(dbName: string, version: number, storeName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(storeName)) {
                request.result.createObjectStore(storeName);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error("indexedDB blocked"));
    });
}

function toPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export function indexedDbEngine(
    dbName: string,
    version: number,
    storeName: string
): KeyValueEngine {
    let dbPromise: Promise<IDBDatabase> | null = null;
    const db = (): Promise<IDBDatabase> => {
        dbPromise ??= openDatabase(dbName, version, storeName);
        return dbPromise;
    };
    const store = async (mode: IDBTransactionMode): Promise<IDBObjectStore> => {
        const database = await db();
        return database.transaction(storeName, mode).objectStore(storeName);
    };
    return {
        kind: "indexeddb" as EngineKind,
        async get(key) {
            const value = (await toPromise((await store("readonly")).get(key))) as string | null;
            return value ?? null;
        },
        async set(key, value) {
            await toPromise((await store("readwrite")).put(value, key));
        },
        async delete(key) {
            await toPromise((await store("readwrite")).delete(key));
        },
        async keys() {
            return (await toPromise((await store("readonly")).getAllKeys())) as string[];
        },
    };
}
