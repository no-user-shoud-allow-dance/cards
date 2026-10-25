import type { DeckType, FolderEntry } from "../utils/types";
import { DECK_TYPES, deckTypeForFolder } from "./deckTypes";

const CONTENT_ROOT = "/src/content/";

export const contentModules = import.meta.glob("/src/content/**/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
}) as Record<string, string>;

interface DiscoveredDeck {
    folder: string;
    name: string;
    file: string;
    baseSlug: string;
    deckType: DeckType;
}

export function slugify(value: string): string {
    return value.toLowerCase().replaceAll("/", "-").replaceAll(" ", "-");
}

function generateDecks(): FolderEntry[] {
    const paths = Object.keys(contentModules)
        .filter((path) => {
            const relativePath = path.slice(CONTENT_ROOT.length);

            return path.startsWith(CONTENT_ROOT) && relativePath.includes("/");
        })
        .sort();

    const discovered: DiscoveredDeck[] = paths.map((path) => {
        const file = path.slice(CONTENT_ROOT.length);
        const [folder, ...segments] = file.split("/");
        const relativeName = segments.join("/").replace(/\.md$/i, "");

        return {
            folder,
            name: relativeName.replaceAll("/", " / "),
            file,
            baseSlug: slugify(relativeName),
            deckType: deckTypeForFolder(folder),
        };
    });

    const slugCounts = new Map<string, number>();

    for (const deck of discovered) {
        slugCounts.set(deck.baseSlug, (slugCounts.get(deck.baseSlug) ?? 0) + 1);
    }

    const folders = new Map<string, FolderEntry>();
    const usedSlugs = new Set<string>();

    for (const deck of discovered) {
        const baseSlug =
            slugCounts.get(deck.baseSlug)! > 1
                ? `${slugify(deck.folder)}-${deck.baseSlug}`
                : deck.baseSlug;

        let slug = baseSlug;
        let suffix = 2;

        while (usedSlugs.has(slug)) {
            slug = `${baseSlug}-${suffix++}`;
        }

        usedSlugs.add(slug);

        let entry = folders.get(deck.folder);

        if (!entry) {
            entry = { folder: deck.folder, decks: [] };
            folders.set(deck.folder, entry);
        }

        entry.decks.push({
            slug,
            name: deck.name,
            file: deck.file,
            deckType: deck.deckType,
            pureMode: DECK_TYPES[deck.deckType].pureMode,
        });
    }

    return [...folders.values()];
}

export const DECKS = generateDecks();
