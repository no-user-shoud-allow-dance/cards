import { cardStore } from "#lib/stores/persistent/cardStore.svelte";
import { settingStore } from "#lib/stores/persistent/settingStore.svelte";
import {
    displayBack,
    displayFront,
    computeProgressRatio,
} from "#lib/utils/pure";
import {
    isEditableTarget,
    isOnControl,
    openHelpSearch as openHelpSearchFor,
    openMnemonicSearch as openMnemonicSearchFor,
} from "#lib/utils/studyActions";
import { BOX_COUNT } from "#lib/types";
import type { FlashCard, CardState, LoadedDeck } from "#lib/types";

const MAX_REVIEW_BOX = BOX_COUNT - 1;
const HISTORY_LIMIT = 10;
const RECENT_CARD_COUNT = 2;

interface UndoEntry {
    cardId: string;
    prevState: CardState | null;
    prevHistory: string[];
}

// Select one uniformly random candidate.
function pickRandom<T>(items: T[]): T | null {
    if (items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)] ?? null;
}

export function useCramSession(resolveDeck: () => LoadedDeck | null) {
    const deck = $derived(resolveDeck());

    let currentCardId = $state<string | null>(null);
    let history = $state<string[]>([]);
    let undoStack = $state<UndoEntry[]>([]);
    let flipped = $state(false);
    let finished = $state(false);

    // Revealing the card is the only condition needed to enable grading.
    const revealed = $derived(flipped);

    // Effective pure mode: the deck must define one and the user must
    // have enabled it.
    const pureMode = $derived(
        deck ? deck.pureMode && settingStore.pureMode : false,
    );

    const currentCard = $derived<FlashCard | null>(
        deck && currentCardId
            ? (deck.cards.find((card) => card.id === currentCardId) ?? null)
            : null,
    );

    const currentBox = $derived(
        currentCard ? cardStore.boxOf(currentCard.id) : 1,
    );

    const deckType = $derived(deck?.deckType ?? "english");

    const frontText = $derived(
        currentCard ? displayFront(currentCard, pureMode, deckType) : "",
    );

    const backText = $derived(
        currentCard ? displayBack(currentCard, pureMode) : "",
    );

    // Images follow the side they were written on: front images are part
    // of the prompt (also in pure mode), back images are revealed with
    // the answer because the back face only shows when flipped.
    const frontImages = $derived(
        currentCard
            ? currentCard.images.filter((image) => image.side === "front")
            : [],
    );

    const backImages = $derived(
        currentCard
            ? currentCard.images.filter((image) => image.side === "back")
            : [],
    );

    const learnedCount = $derived(
        deck
            ? deck.cards.filter(
                  (card) => cardStore.boxOf(card.id) === BOX_COUNT,
              ).length
            : 0,
    );

    const boxCounts = $derived.by(() => {
        const counts = Array.from({ length: BOX_COUNT }, () => 0);
        if (!deck) return counts;
        for (const card of deck.cards) {
            const box = cardStore.boxOf(card.id);
            if (box >= 1 && box <= BOX_COUNT) counts[box - 1]++;
        }
        return counts;
    });

    // Weighted progress: each card contributes (box - 1) / (BOX_COUNT - 1),
    // so box 1 = 0 % and box BOX_COUNT = 100 %. Averaged across all cards.
    const progressRatio = $derived(
        deck ? computeProgressRatio(deck.cards, cardStore.states) : 0,
    );

    function pickNext(excludedIds: ReadonlySet<string>): FlashCard | null {
        if (!deck) return null;

        const candidatesByBox: FlashCard[][] = Array.from(
            { length: MAX_REVIEW_BOX },
            () => [],
        );

        // Group cards by their current learning box.
        for (const card of deck.cards) {
            const box = cardStore.states[card.id]?.box ?? 1;
            if (box >= 1 && box <= MAX_REVIEW_BOX) {
                candidatesByBox[box - 1].push(card);
            }
        }

        // Prefer the lowest non-empty box, excluding recently seen cards.
        for (const candidates of candidatesByBox) {
            const available = candidates.filter(
                (card) => !excludedIds.has(card.id),
            );
            const next = pickRandom(available);
            if (next) return next;
        }

        // If necessary, allow recently seen cards again.
        for (const candidates of candidatesByBox) {
            const next = pickRandom(candidates);
            if (next) return next;
        }

        return null;
    }

    function resetCardView(): void {
        flipped = false;
    }

    function toggleFlip(): void {
        if (!currentCard) return;
        flipped = !flipped;
    }

    function start(): void {
        cardStore.init();
        if (!deck || deck.cards.length === 0) return;

        const first = pickNext(new Set());

        currentCardId = first?.id ?? null;
        history = first ? [first.id] : [];
        undoStack = [];
        finished = !first;
        resetCardView();
    }

    function answer(correct: boolean): void {
        if (!currentCardId) return;

        const cardId = currentCardId;
        const prevState = cardStore.states[cardId] ?? null;
        const prevHistory = [...history];

        cardStore.answer(cardId, correct);

        undoStack = [...undoStack, { cardId, prevState, prevHistory }];

        const excludedIds = new Set(history.slice(0, RECENT_CARD_COUNT));
        const nextCard = pickNext(excludedIds);

        resetCardView();

        if (!nextCard) {
            currentCardId = null;
            finished = true;
            return;
        }

        currentCardId = nextCard.id;
        history = [nextCard.id, ...prevHistory].slice(0, HISTORY_LIMIT);
        finished = false;
    }

    function undo(): void {
        const entry = undoStack.at(-1);
        if (!entry) return;

        cardStore.restore(entry.cardId, entry.prevState);

        currentCardId = entry.cardId;
        history = entry.prevHistory;
        undoStack = undoStack.slice(0, -1);

        resetCardView();
        finished = false;
    }

    function openHelpSearch(): void {
        if (!currentCard || !deck) return;
        openHelpSearchFor(currentCard, deck.deckType);
    }

    function openMnemonicSearch(): void {
        if (!currentCard) return;
        openMnemonicSearchFor(currentCard);
    }

    function handleKeydown(event: KeyboardEvent): void {
        if (!currentCard) return;

        // Do not intercept typing or native keyboard activation.
        if (isEditableTarget(event.target)) return;

        if (event.code === "Space") {
            if (isOnControl(event.target)) return;
            event.preventDefault();
            toggleFlip();
            return;
        }

        if (!revealed) return;

        const key = event.key.toLowerCase();

        // The Google search actions are unavailable when the user has
        // disabled them in the privacy settings.
        if (settingStore.googleDisabled && (key === "h" || key === "m")) {
            return;
        }

        switch (key) {
            case "w":
                event.preventDefault();
                answer(false);
                break;
            case "r":
                event.preventDefault();
                answer(true);
                break;
            case "h":
                event.preventDefault();
                openHelpSearch();
                break;
            case "m":
                event.preventDefault();
                openMnemonicSearch();
                break;
        }
    }

    return {
        // State
        get currentCardId() {
            return currentCardId;
        },
        get history() {
            return history;
        },
        get undoStack() {
            return undoStack;
        },
        get flipped() {
            return flipped;
        },
        get finished() {
            return finished;
        },
        // Derived
        get revealed() {
            return revealed;
        },
        get currentCard() {
            return currentCard;
        },
        get currentBox() {
            return currentBox;
        },
        get frontText() {
            return frontText;
        },
        get backText() {
            return backText;
        },
        get frontImages() {
            return frontImages;
        },
        get backImages() {
            return backImages;
        },
        get learnedCount() {
            return learnedCount;
        },
        get boxCounts() {
            return boxCounts;
        },
        get progressRatio() {
            return progressRatio;
        },
        // Constants
        BOX_COUNT,
        // Actions
        start,
        toggleFlip,
        answer,
        undo,
        openHelpSearch,
        openMnemonicSearch,
        handleKeydown,
    };
}
