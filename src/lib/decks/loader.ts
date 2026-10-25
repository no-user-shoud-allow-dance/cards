import { parseDeck } from "./parser";

import { DECKS, contentModules } from "./decks";
import { DECK_TYPES } from "./deckTypes";
import { userDecks } from "../store/userDecks.svelte";

import type { LoadedDeck, UserDeck } from "../utils/types";

let cache: Map<string, LoadedDeck> | null = null;
let rawBySlug: Map<string, string> | null = null;

// Parsed user decks, keyed by the stored deck object so a replaced store
// entry (new object) is parsed again.
const userDeckCache = new WeakMap<UserDeck, LoadedDeck>();

function buildCache(): Map<string, LoadedDeck> {
    const decks = new Map<string, LoadedDeck>();
    rawBySlug = new Map<string, string>();

    for (const folder of DECKS) {
        for (const entry of folder.decks) {
            const raw = contentModules[`/src/content/${entry.file}`];

            const parsed =
                raw !== undefined
                    ? parseDeck(raw)
                    : {
                          title: null,
                          cards: [],
                          errors: [`Datei "${entry.file}" nicht gefunden`],
                      };

            rawBySlug.set(entry.slug, raw ?? "");

            decks.set(entry.slug, {
                slug: entry.slug,
                folder: folder.folder,
                name: entry.name,
                deckType: entry.deckType,
                pureMode: entry.pureMode,
                title: parsed.title,
                cards: parsed.cards.map((card, index) => ({
                    ...card,
                    id: `${entry.slug}/${index}`,
                })),
                errors: parsed.errors,
            });
        }
    }

    return decks;
}

function loadedFromUserDeck(deck: UserDeck): LoadedDeck {
    let loaded = userDeckCache.get(deck);
    if (!loaded) {
        const parsed = parseDeck(deck.raw);
        loaded = {
            slug: deck.slug,
            folder: deck.folder,
            name: deck.name,
            deckType: deck.deckType,
            pureMode: DECK_TYPES[deck.deckType].pureMode,
            title: parsed.title,
            cards: parsed.cards.map((card, index) => ({
                ...card,
                id: `${deck.slug}/${index}`,
            })),
            errors: parsed.errors,
        };
        userDeckCache.set(deck, loaded);
    }
    return loaded;
}

export function getDeck(slug: string): LoadedDeck | null {
    cache ??= buildCache();
    const bundled = cache.get(slug);
    if (bundled) return bundled;
    const userDeck = userDecks.get(slug);
    return userDeck ? loadedFromUserDeck(userDeck) : null;
}

/** Raw markdown source of a deck (bundled or uploaded), e.g. for sharing. */
export function getDeckRaw(slug: string): string | null {
    cache ??= buildCache();
    if (rawBySlug!.has(slug)) return rawBySlug!.get(slug)!;
    return userDecks.get(slug)?.raw ?? null;
}
