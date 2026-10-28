/**
 * Base class for localStorage-backed stores. Handles the SSR guard,
 * idempotent init, and delegates loading/persistence to subclasses.
 */
export abstract class BaseStore {
    #loaded = false;

    init(): void {
        if (typeof window === "undefined" || this.#loaded) return;
        this.#loaded = true;
        this.hydrate();
    }

    /** Loads persisted state into memory. Called once by init(). */
    protected abstract hydrate(): void;
    protected abstract persist(): void;
}
