import { parseFolderName } from "#lib/core/deck/identity";
import { smallEngine } from "#lib/storage/detect";
import { readJson, writeJson } from "#lib/storage/engine";
import { STORAGE } from "#lib/storage/keys";

/**
 * Folders repository — ONE versioned JSON record under kk-folders: a
 * list of per-folder UI states on the home page ("name" + "opened").
 * Folders themselves live in the decks' kk-state records; this record
 * only remembers whether each folder section is expanded. Records of
 * a wrong shape are rejected → the empty list (every folder closed,
 * the default for new folders); unknown folders default to closed at
 * read time.
 */

/** UI state of one home-page folder section. */
export interface FolderState {
    /** Simple folder name — the section key in the home page grouping. */
    name: string;
    /** Whether the section is expanded (default false for new folders). */
    opened: boolean;
}

/**
 * Coerces an unknown parsed value into valid folder states: array
 * entries with a valid simple folder name and a boolean `opened`
 * survive, everything else is dropped. Duplicated names keep the
 * first occurrence (entry order preserved).
 */
export function normalizeFolderStates(input: unknown): FolderState[] {
    if (!Array.isArray(input)) return [];
    const seen = new Set<string>();
    const out: FolderState[] = [];
    for (const item of input) {
        if (typeof item !== "object" || item === null) continue;
        const r = item as Record<string, unknown>;
        if (typeof r.opened !== "boolean" || typeof r.name !== "string") continue;
        try {
            // Section keys are simple folders; "#" names never appear.
            const name = parseFolderName(r.name);
            if (seen.has(name)) continue;
            seen.add(name);
            out.push({ name, opened: r.opened });
        } catch {
            // no longer a valid folder name — drop the entry
        }
    }
    return out;
}

export interface FoldersRepository {
    /** The persisted folder states; the empty list when missing or corrupt. */
    get(): Promise<FolderState[]>;
    put(states: FolderState[]): Promise<void>;
    /** Deletes the record (the store then resets to "everything closed"). */
    remove(): Promise<void>;
}

/** One tiny record, so the repository picks a small engine itself. */
export async function createFoldersRepository(): Promise<FoldersRepository> {
    const engine = await smallEngine();
    const key = STORAGE.localStorage.folders;
    return {
        async get() {
            const value = await readJson(engine, key);
            return normalizeFolderStates(value);
        },
        async put(states) {
            await writeJson(engine, key, states);
        },
        async remove() {
            await engine.delete(key);
        },
    };
}
