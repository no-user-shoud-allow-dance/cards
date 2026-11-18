import { SvelteSet } from "svelte/reactivity";
import { decks } from "#components/model/decks.svelte";
import {
    displayBack,
    displayFront,
    boxOfCard,
    boxCountsOf,
    computeProgressRatio,
} from "#components/model/display";
import { handleStudyKeydown, useCardActions } from "#components/composables/useCardActions";
import { BOX_COUNT } from "#lib/core/learning/leitner";
import type { CardId } from "#lib/core/deck/ids";
import type { CardProgress, FlashCard, LoadedDeck } from "#components/model/deckView";

const MAX_REVIEW_BOX = BOX_COUNT - 1;
const HISTORY_LIMIT = 10;
const RECENT_CARD_COUNT = 2;

interface UndoEntry {
    /** Content-hash id (learning state key). */
    cardId: CardId;
    /** Positional id `${slug}/${index}` (UI key). */
    viewId: string;
    /** The card's progress before the answer; null when it had none. */
    prevState: CardProgress | null;
    prevHistory: string[];
}

// Select one uniformly random candidate.
function pickRandom<T>(items: T[]): T | null {
    if (items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)] ?? null;
}

/**
 * Session composables share one shape (the pattern): getter-ized
 * deriveds + action functions, with `handleKeydown` kept in the
 * returned object rather than bound inside — so consumers like
 * `useStudyTime.observe` can rely on it.
 */
export function useCramSession(resolveDeck: () => LoadedDeck | null) {
    const deck = $derived(resolveDeck());

    // Shared card actions (moon, help/mnemonic search); the queue
    // advance after mooning is cram-specific and stays below.
    const actions = useCardActions(
        () => deck,
        () => deck?.slug ?? "",
        () => currentCard
    );

    // The deck arrives fully compiled: per-card progress is on every
    // FlashCard (`card.state`), deck-level values on the LoadedDeck.
    let currentCardId = $state<string | null>(null);
    let history = $state<string[]>([]);
    let undoStack = $state<UndoEntry[]>([]);
    let flipped = $state(false);
    let finished = $state(false);

    // Revealing the card is the only condition needed to enable grading.
    const revealed = $derived(flipped);

    // Effective pure mode arrives compiled on the deck: the deck's
    // kk-state override wins, else the global settings default applies.
    const pureMode = $derived(deck ? deck.pureModeEnabled : false);

    const currentCard = $derived<FlashCard | null>(
        deck && currentCardId
            ? (deck.cards.find((card) => card.id === currentCardId) ?? null)
            : null
    );

    const currentBox = $derived(currentCard ? boxOfCard(currentCard) : 1);

    const deckType = $derived(deck?.deckType ?? "english");

    const frontText = $derived(currentCard ? displayFront(currentCard, pureMode, deckType) : "");

    const backText = $derived(currentCard ? displayBack(currentCard, pureMode) : "");

    // The card's image (trailing `![alt](url)` field) renders on both
    // faces of the flashcard.
    const image = $derived(currentCard?.image);

    // Mooned cards (trailing `*`) are skipped by every review queue.
    const visibleCards = $derived(deck ? deck.cards.filter((card) => !card.hidden) : []);

    const totalCards = $derived(visibleCards.length);

    // Context line (`::` field) shown under the answer; already markup.
    const contextText = $derived(currentCard?.context ?? "");

    const currentHidden = $derived(currentCard?.hidden ?? false);

    const learnedCount = $derived(
        visibleCards.filter((card) => boxOfCard(card) === BOX_COUNT).length
    );

    const boxCounts = $derived(boxCountsOf(visibleCards));

    // Weighted progress: each card contributes (box - 1) / (BOX_COUNT - 1),
    // so box 1 = 0 % and box BOX_COUNT = 100 %. Averaged across all cards.
    const progressRatio = $derived(computeProgressRatio(visibleCards));

    function pickNext(excludedIds: ReadonlySet<string>): FlashCard | null {
        const cards = visibleCards;

        const candidatesByBox: FlashCard[][] = Array.from({ length: MAX_REVIEW_BOX }, () => []);

        // Group cards by their current learning box.
        for (const card of cards) {
            const box = boxOfCard(card);
            if (box >= 1 && box <= MAX_REVIEW_BOX) {
                candidatesByBox[box - 1]!.push(card);
            }
        }

        // Prefer the lowest non-empty box, excluding recently seen cards.
        for (const candidates of candidatesByBox) {
            const available = candidates.filter((card) => !excludedIds.has(card.id));
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
        if (!deck || visibleCards.length === 0) return;

        const first = pickNext(new SvelteSet());

        currentCardId = first?.id ?? null;
        history = first ? [first.id] : [];
        undoStack = [];
        finished = !first;
        resetCardView();
    }

    function answer(correct: boolean): void {
        if (!currentCardId || !deck || !currentCard) return;

        const cardId = currentCard.cardId;
        // Snapshot from the compiled card view: the exact progress
        // before this answer (null when the card had none) — undo
        // restores it through the facade.
        const prevState = currentCard.state;
        const prevHistory = [...history];

        void decks.answer(deck.slug, cardId, correct);

        undoStack = [...undoStack, { cardId, viewId: currentCardId, prevState, prevHistory }];

        const excludedIds = new SvelteSet(history.slice(0, RECENT_CARD_COUNT));
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
        if (!entry || !deck) return;

        void decks.restoreCard(deck.slug, entry.cardId, entry.prevState);

        currentCardId = entry.viewId;
        history = entry.prevHistory;
        undoStack = undoStack.slice(0, -1);

        resetCardView();
        finished = false;
    }

    /**
     * Moon button: flips the card's `hidden` flag in the deck document (via
     * the store, so the raw markdown stays inside storage) and advances the
     * queue without grading, because the card just left it.
     */
    async function moonCurrent(): Promise<void> {
        if (!deck || !currentCardId) return;
        await actions.moonCurrent();

        const excludedIds = new SvelteSet(history.slice(0, RECENT_CARD_COUNT));
        const nextCard = pickNext(excludedIds);

        resetCardView();

        if (!nextCard) {
            currentCardId = null;
            finished = true;
            return;
        }

        currentCardId = nextCard.id;
        history = [nextCard.id, ...history].slice(0, HISTORY_LIMIT);
        finished = false;
    }

    function handleKeydown(event: KeyboardEvent): void {
        handleStudyKeydown(event, {
            currentCard,
            revealed,
            space: toggleFlip,
            wrong: () => answer(false),
            right: () => answer(true),
            help: actions.openHelpSearch,
            mnemonic: actions.openMnemonicSearch,
        });
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
        get image() {
            return image;
        },
        get contextText() {
            return contextText;
        },
        get currentHidden() {
            return currentHidden;
        },
        get totalCards() {
            return totalCards;
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
        moonCurrent,
        openHelpSearch: actions.openHelpSearch,
        openMnemonicSearch: actions.openMnemonicSearch,
        handleKeydown,
    };
}
