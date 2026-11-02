/**
 * Thin wrappers around IndexedDB: opens/creates a database with a single
 * object store and promisifies IDB requests. Callers handle transactions.
 */

export function openDatabase(
    dbName: string,
    version: number,
    storeName: string,
    keyPath: string,
): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(storeName, { keyPath });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export function toPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/** Deletes a whole database; resolves even if it did not exist. */
export function deleteDatabase(dbName: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
