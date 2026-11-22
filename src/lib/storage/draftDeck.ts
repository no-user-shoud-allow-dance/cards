import { DECK_TYPE_VALUES, type DeckType } from "#lib/core/deck/document";
import { STORAGE } from "#lib/storage/keys";

/**
 * A deck draft handed from the create/upload/import flows to the editor
 * when the content had parse errors: the draft deck itself stays
 * barebones, the original source is stashed here and the editor opens
 * with it. Stored in sessionStorage (gone when the tab closes) because
 * the raw markdown can be far too large for a URL. Raw markdown is L0
 * and may only live in storage — this file is its stash.
 */
export interface DraftDeck {
    /** Raw markdown source. */
    raw: string;
    /** Deck type detected from the content or carried by the link. */
    deckType: DeckType;
    /** Suggested deck name (draft name or parsed title). */
    name: string;
    /** Parsed H1 title, if any. */
    title: string | null;
}

const DRAFT_KEY = STORAGE.sessionStorage.draftDeck;

/** Stashes a deck draft for the editor. */
export function stashDraftDeck(draft: DraftDeck): void {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

/**
 * Reads and removes the stashed draft. Returns null when no draft is
 * present or the stored value is corrupt.
 */
export function readDraftDeck(): DraftDeck | null {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(DRAFT_KEY);
    try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return null;
        const d = parsed as Partial<DraftDeck>;
        if (typeof d.raw !== "string" || typeof d.deckType !== "string") return null;
        if (!(DECK_TYPE_VALUES as readonly string[]).includes(d.deckType)) return null;
        return {
            raw: d.raw,
            deckType: d.deckType as DeckType,
            name: typeof d.name === "string" ? d.name : "Geteilter Stapel",
            title: typeof d.title === "string" ? d.title : null,
        };
    } catch {
        return null;
    }
}
