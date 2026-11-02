import {
    openDatabase,
    toPromise,
    deleteDatabase,
} from "../../storages/indexedStorage";

/**
 * Base class for IndexedDB-backed stores. Handles the SSR guard,
 * idempotent async init, lazy database connection, and provides
 * generic getAll/put/delete helpers. Subclasses define the database
 * configuration and implement hydrate().
 */
export abstract class IndexedDbStore {
    #dbPromise: Promise<IDBDatabase> | null = null;
    #initPromise: Promise<void> | null = null;
    #db: IDBDatabase | null = null;

    protected abstract readonly dbName: string;
    protected abstract readonly dbVersion: number;
    protected abstract readonly storeName: string;
    protected abstract readonly keyPath: string;

    /** Loads all stored records; resolves immediately during SSR. Idempotent. */
    init(): Promise<void> {
        if (typeof window === "undefined") return Promise.resolve();
        this.#initPromise ??= this.hydrate();
        return this.#initPromise;
    }

    /** Loads persisted state into memory. Called once by init(). */
    protected abstract hydrate(): Promise<void>;

    protected db(): Promise<IDBDatabase> {
        this.#dbPromise ??= openDatabase(
            this.dbName,
            this.dbVersion,
            this.storeName,
            this.keyPath,
        ).then((db) => {
            this.#db = db;
            return db;
        });
        return this.#dbPromise;
    }

    /**
     * Closes the connection and drops the entire database. The store can
     * be init()ed again afterwards (it re-creates an empty database).
     */
    async destroy(): Promise<void> {
        if (typeof window === "undefined") return;
        this.#db?.close();
        this.#db = null;
        this.#dbPromise = null;
        this.#initPromise = null;
        await deleteDatabase(this.dbName);
    }

    protected async getAll<T>(): Promise<T[]> {
        const db = await this.db();
        const tx = db.transaction(this.storeName, "readonly");
        return toPromise(tx.objectStore(this.storeName).getAll()) as Promise<
            T[]
        >;
    }

    protected async put<T>(value: T): Promise<void> {
        const db = await this.db();
        const tx = db.transaction(this.storeName, "readwrite");
        await toPromise(tx.objectStore(this.storeName).put(value));
    }

    protected async delete(key: string): Promise<void> {
        const db = await this.db();
        const tx = db.transaction(this.storeName, "readwrite");
        await toPromise(tx.objectStore(this.storeName).delete(key));
    }
}
