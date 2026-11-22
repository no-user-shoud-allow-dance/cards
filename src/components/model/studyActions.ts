import { UI } from "#messages/locale.svelte";
import { cardAnswer, cardPrompt } from "#components/model/display";
import type { DeckType } from "#lib/core/deck/document";
import type { FlashCard } from "#components/model/deckView";

/**
 * Shared helpers for the study sessions (cram + overview) and the
 * learning-time tracking: keyboard-target guards, the Google search
 * actions, and the action-key detection used to reset the inactivity
 * pause.
 */

/** True when the event target is an editable element — typing must not be intercepted. */
export function isEditableTarget(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable='true']") !== null
    );
}

/** True when the event target is a button or link — native activation must win. */
export function isOnControl(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && target.closest("button, a") !== null;
}

function openGoogleSearch(query: string): void {
    const params = new URLSearchParams({
        q: query,
        udm: "50", // AI search
    });
    window.open(`https://www.google.com/search?${params}`, "_blank", "noopener,noreferrer");
}

/** Opens the Google help search (context + translation) for a card. */
export function openHelpSearch(card: FlashCard, deckType: DeckType): void {
    const language = UI.deckTypeLanguage(deckType);
    openGoogleSearch(UI.helpSearchQuery(cardAnswer(card), language, cardPrompt(card)));
}

/** Opens the Google mnemonic search for a card. */
export function openMnemonicSearch(card: FlashCard): void {
    openGoogleSearch(UI.mnemonicSearchQuery(cardPrompt(card)));
}

/**
 * Mirrors the action keys handled by the study sessions (Space, W, R, H,
 * M), so keyboard-driven flips/answers/searches also count as activity
 * for the learning-time tracking.
 */
export function isActionKey(event: KeyboardEvent): boolean {
    if (isEditableTarget(event.target)) return false;
    if (event.code === "Space") return !isOnControl(event.target);
    return ["w", "r", "h", "m"].includes(event.key.toLowerCase());
}
