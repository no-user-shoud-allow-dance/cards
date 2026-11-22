import { decks } from "#components/model/decks.svelte";
import { displayFront, displayBack } from "#components/model/display";
import { handleStudyKeydown, useCardActions } from "#components/composables/useCardActions";
import type { FlashCard, LoadedDeck } from "#components/model/deckView";

export function useOverviewSession(resolveDeck: () => LoadedDeck | null, getSlug: () => string) {
    const deck = $derived(resolveDeck());

    // Reactive deck slug: the page component can be reused for another
    // deck, so the slug is read lazily.
    const slug = $derived(getSlug());

    // Shared card actions (moon, help/mnemonic search).
    const actions = useCardActions(
        () => deck,
        () => slug,
        () => currentCard
    );

    let queue = $state<string[]>([]);
    let index = $state(-1);
    let finished = $state(false);

    const currentCard = $derived<FlashCard | null>(
        deck && index >= 0 && index < queue.length
            ? (deck.cards.find((c) => c.id === queue[index]) ?? null)
            : null
    );

    // Overview always shows the original front and back — pure mode
    // only applies to cram sessions, not to browsing. Display text strips
    // image tokens (the images render separately above the text).
    const deckType = $derived(deck?.deckType ?? "english");

    const frontText = $derived(currentCard ? displayFront(currentCard, false, deckType) : "");

    const backText = $derived(currentCard ? displayBack(currentCard, false) : "");

    // Overview shows both sides at once; the card's image renders once.
    const image = $derived(currentCard?.image);

    // Extras for the card view: context line, tags, moon state.
    const contextText = $derived(currentCard?.context ?? "");

    const tags = $derived(currentCard?.tags ?? []);

    const hidden = $derived(currentCard?.hidden ?? false);

    const totalCards = $derived(deck?.cards.length ?? 0);

    // Cards seen so far, capped at the deck size.
    const seenCount = $derived(Math.min(index + 1, totalCards));

    const progressRatio = $derived(totalCards > 0 ? seenCount / totalCards : 0);

    const canGoBack = $derived(index > 0);

    function start(): void {
        if (!deck || deck.cards.length === 0) {
            finished = true;
            return;
        }
        // Overview completion is derived (compiled onto the deck view).
        if (deck.overviewComplete) {
            finished = true;
            return;
        }
        queue = [...deck.cards].map((c) => c.id).sort(() => Math.random() - 0.5);
        index = 0;
        finished = false;
    }

    function next(): void {
        if (!deck) return;
        index++;
        if (index >= queue.length) {
            finished = true;
            void decks.markOverviewDoneAll(
                slug,
                deck.cards.map((c) => c.cardId)
            );
        }
    }

    function goBack(): void {
        if (index <= 0) return;
        index--;
    }

    function handleKeydown(event: KeyboardEvent): void {
        handleStudyKeydown(event, {
            currentCard,
            space: next,
            arrowRight: next,
            help: actions.openHelpSearch,
            mnemonic: actions.openMnemonicSearch,
        });
    }

    return {
        get currentCard() {
            return currentCard;
        },
        get currentCardId() {
            return currentCard?.id ?? null;
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
        get tags() {
            return tags;
        },
        get hidden() {
            return hidden;
        },
        get finished() {
            return finished;
        },
        get totalCards() {
            return totalCards;
        },
        get seenCount() {
            return seenCount;
        },
        get progressRatio() {
            return progressRatio;
        },
        get canGoBack() {
            return canGoBack;
        },
        start,
        next,
        goBack,
        // The overview is not a review queue: mooning only flips the
        // marker, the card stays in the queue — so the shared action
        // without a queue advance is exactly right here.
        moonCurrent: actions.moonCurrent,
        openHelpSearch: actions.openHelpSearch,
        openMnemonicSearch: actions.openMnemonicSearch,
        handleKeydown,
    };
}
