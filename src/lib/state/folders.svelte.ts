import {
    createFoldersRepository,
    type FolderState,
    type FoldersRepository,
} from "#lib/repositories/foldersRepository";

/**
 * Persistent folder-section state of the home page ("name" + "opened"
 * under kk-folders). Thin store mirroring the folders repository —
 * the record lives in the repository, this store only makes it
 * reactive. New folders are closed by default until the user expands
 * them.
 */
class FoldersStore {
    list = $state<FolderState[]>([]);
    #repo: FoldersRepository | null = null;
    #ready: Promise<void> | null = null;

    async init(): Promise<void> {
        this.#ready ??= this.#load();
        return this.#ready;
    }

    async #load(): Promise<void> {
        this.#repo = await createFoldersRepository();
        this.list = await this.#repo.get();
    }

    /**
     * Whether a folder section is expanded (reactive inside a
     * $derived/$effect). Unknown folders read as closed — the default
     * "opened: false" for new folders.
     */
    openedOf(name: string): boolean {
        return this.list.find((f) => f.name === name)?.opened ?? false;
    }

    /** Flips one folder section's expansion and persists it. */
    async toggle(name: string): Promise<void> {
        await this.init();
        const current = this.list.find((f) => f.name === name);
        const next = current
            ? this.list.map((f) => (f.name === name ? { ...f, opened: !f.opened } : f))
            : [...this.list, { name, opened: true }];
        this.list = next;
        await this.#repo?.put(next);
    }

    /** Deletes the persisted record and resets to the empty list. */
    async clear(): Promise<void> {
        await this.init();
        await this.#repo?.remove();
        this.list = [];
    }
}

export const foldersStore = new FoldersStore();
