import { decks } from "#components/model/decks.svelte";
import {
    isEditableTarget,
    isOnControl,
    openHelpSearch as openHelpSearchFor,
    openMnemonicSearch as openMnemonicSearchFor,
} from "#components/model/studyActions";
import type { FlashCard, LoadedDeck } from "#components/model/deckView";

/**
 * The card actions shared by the study sessions (cram + overview):
 * moon the current card and the two Google search actions. Everything
 * is read lazily through getters, so the composable itself needs no
 * runes. The queue advance after mooning stays in the cram session —
 * the overview is not a review queue and keeps the card.
 */
export function useCardActions(
    getDeck: () => LoadedDeck | null,
    getSlug: () => string,
    getCurrentCard: () => FlashCard | null
) {
    /**
     * Moon button: flips the card's `hidden` flag in the deck document
     * (via the store, so the raw markdown stays inside storage).
     */
    async function moonCurrent(): Promise<void> {
        const card = getCurrentCard();
        if (!card) return;
        await decks.toggleCardHidden(getSlug(), card.id);
    }

    function openHelpSearch(): void {
        const deck = getDeck();
        const card = getCurrentCard();
        if (!card || !deck) return;
        openHelpSearchFor(card, deck.deckType);
    }

    function openMnemonicSearch(): void {
        const card = getCurrentCard();
        if (!card) return;
        openMnemonicSearchFor(card);
    }

    return { moonCurrent, openHelpSearch, openMnemonicSearch };
}

/** Keymap for handleStudyKeydown: the session-specific actions per key. */
export interface StudyKeymap {
    /** No current card → the event is ignored entirely. */
    currentCard: FlashCard | null;
    /** Grading/search keys only act when the card is revealed (cram). Default: true. */
    revealed?: boolean;
    /** Space action: flip (cram) or next (overview). */
    space: () => void;
    /** Extra navigation key (overview: ArrowRight). */
    arrowRight?: () => void;
    wrong?: () => void;
    right?: () => void;
    help: () => void;
    mnemonic: () => void;
}

/**
 * Shared keydown surface of the study sessions: ignores typing and
 * native control activation, maps Space (and optionally ArrowRight),
 * and gates the grading/search keys on the revealed state. The queue
 * logic behind the actions stays in the sessions.
 */
export function handleStudyKeydown(event: KeyboardEvent, keymap: StudyKeymap): void {
    if (!keymap.currentCard) return;

    // Do not intercept typing or native keyboard activation.
    if (isEditableTarget(event.target)) return;

    if (event.code === "Space") {
        if (isOnControl(event.target)) return;
        event.preventDefault();
        keymap.space();
        return;
    }

    if (event.key === "ArrowRight" && keymap.arrowRight) {
        event.preventDefault();
        keymap.arrowRight();
        return;
    }

    if (keymap.revealed === false) return;

    const key = event.key.toLowerCase();

    switch (key) {
        case "w":
            if (keymap.wrong) {
                event.preventDefault();
                keymap.wrong();
            }
            break;
        case "r":
            if (keymap.right) {
                event.preventDefault();
                keymap.right();
            }
            break;
        case "h":
            event.preventDefault();
            keymap.help();
            break;
        case "m":
            event.preventDefault();
            keymap.mnemonic();
            break;
    }
}
