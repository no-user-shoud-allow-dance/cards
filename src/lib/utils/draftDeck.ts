import type { DeckType } from "../types";

/**
 * A deck draft passed from the upload or import page to the create
 * page. Stored in sessionStorage (cleared when the tab closes) because
 * the raw markdown can be far too large for a URL query parameter.
 */
export interface DraftDeck {
    /** Raw markdown source. */
    raw: string;
    /** Deck type detected from the content or carried by the link. */
    deckType: DeckType;
    /** Suggested deck name (file name or parsed title). */
    name: string;
    /** Parsed H1 title, if any. */
    title: string | null;
}

const DRAFT_KEY = "nsc_draft_deck";

/** Stashes a deck draft for the create page and navigates there. */
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
        if (typeof d.raw !== "string" || typeof d.deckType !== "string") {
            return null;
        }
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
