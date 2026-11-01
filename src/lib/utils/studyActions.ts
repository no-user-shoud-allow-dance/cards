import { DECK_TYPES } from "./deckTypes";
import { cardAnswer, cardPrompt } from "./pure";
import type { DeckType, FlashCard } from "../types";

/**
 * Shared helpers for the study sessions (cram + overview) and the study
 * timer: keyboard-target guards, the Google search actions, and the
 * action-key detection used to reset the timer's inactivity pause.
 */

/** True when the event target is an editable element — typing must not be intercepted. */
export function isEditableTarget(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable='true']") !==
            null
    );
}

/** True when the event target is a button or link — native activation must win. */
export function isOnControl(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLElement &&
        target.closest("button, a") !== null
    );
}

function openGoogleSearch(query: string): void {
    const params = new URLSearchParams({
        q: query,
        udm: "50", // AI search
    });
    window.open(
        `https://www.google.com/search?${params}`,
        "_blank",
        "noopener,noreferrer",
    );
}

/** Opens the Google help search (context + translation) for a card. */
export function openHelpSearch(card: FlashCard, deckType: DeckType): void {
    const language = DECK_TYPES[deckType].language;
    openGoogleSearch(
        `"${cardAnswer(card)}" im Kontext im Deutschen und Vergleich mit Beispielen? ` +
            `Und wie ist der Fall, wenn es um die Übersetzung aus dem ${language} ` +
            `"${cardPrompt(card)}" geht (auch mit Beispielen)?`,
    );
}

/** Opens the Google mnemonic search for a card. */
export function openMnemonicSearch(card: FlashCard): void {
    openGoogleSearch(
        `"${cardPrompt(card)}" Mnemotechnik oder verwandte Wörter in anderen Sprachen`,
    );
}

/**
 * Mirrors the action keys handled by the study sessions (Space, W, R, H,
 * M), so keyboard-driven flips/answers/searches also count as activity
 * for the study timer.
 */
export function isActionKey(event: KeyboardEvent): boolean {
    if (isEditableTarget(event.target)) return false;
    if (event.code === "Space") return !isOnControl(event.target);
    return ["w", "r", "h", "m"].includes(event.key.toLowerCase());
}
