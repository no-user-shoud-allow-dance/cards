import { cardStore } from "#lib/stores/persistent/cardStore.svelte";
import { settingStore } from "#lib/stores/persistent/settingStore.svelte";
import { displayFront, displayBack } from "#lib/utils/pure";
import {
    isEditableTarget,
    isOnControl,
    openHelpSearch as openHelpSearchFor,
    openMnemonicSearch as openMnemonicSearchFor,
} from "#lib/utils/studyActions";
import type { FlashCard, LoadedDeck } from "#lib/types";

export function useOverviewSession(
    resolveDeck: () => LoadedDeck | null,
    getSlug: () => string,
) {
    const deck = $derived(resolveDeck());

    // Reactive deck slug: the page component can be reused for another
    // deck, so the slug is read lazily.
    const slug = $derived(getSlug());

    let queue = $state<string[]>([]);
    let index = $state(-1);
    let finished = $state(false);

    const currentCard = $derived<FlashCard | null>(
        deck && index >= 0 && index < queue.length
            ? (deck.cards.find((c) => c.id === queue[index]) ?? null)
            : null,
    );

    // Overview always shows the original front and back — pure mode
    // only applies to cram sessions, not to browsing. Display text strips
    // image tokens (the images render separately above the text).
    const deckType = $derived(deck?.deckType ?? "english");

    const frontText = $derived(
        currentCard ? displayFront(currentCard, false, deckType) : "",
    );

    const backText = $derived(
        currentCard ? displayBack(currentCard, false) : "",
    );

    // Overview shows both sides at once; images follow their side.
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

    const totalCards = $derived(deck?.cards.length ?? 0);

    // Cards seen so far, capped at the deck size.
    const seenCount = $derived(Math.min(index + 1, totalCards));

    const progressRatio = $derived(
        totalCards > 0 ? seenCount / totalCards : 0,
    );

    const canGoBack = $derived(index > 0);

    function start(): void {
        cardStore.init();
        if (!deck || deck.cards.length === 0 || cardStore.isOverviewDone(slug)) {
            finished = true;
            return;
        }
        queue = [...deck.cards]
            .map((c) => c.id)
            .sort(() => Math.random() - 0.5);
        index = 0;
        finished = false;
    }

    function next(): void {
        if (!deck) return;
        index++;
        if (index >= queue.length) {
            finished = true;
            cardStore.markOverviewDone(slug);
        }
    }

    function goBack(): void {
        if (index <= 0) return;
        index--;
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

        if (isEditableTarget(event.target)) return;

        // Space advances to the next card.
        if (event.code === "Space") {
            if (isOnControl(event.target)) return;
            event.preventDefault();
            next();
            return;
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            next();
            return;
        }

        // The Google search actions are unavailable when the user has
        // disabled them in the privacy settings.
        if (event.key.toLowerCase() === "h" && !settingStore.googleDisabled) {
            event.preventDefault();
            openHelpSearch();
        }

        if (event.key.toLowerCase() === "m" && !settingStore.googleDisabled) {
            event.preventDefault();
            openMnemonicSearch();
        }
    }

    return {
        get currentCard() { return currentCard; },
        get currentCardId() { return currentCard?.id ?? null; },
        get frontText() { return frontText; },
        get backText() { return backText; },
        get frontImages() { return frontImages; },
        get backImages() { return backImages; },
        get finished() { return finished; },
        get totalCards() { return totalCards; },
        get seenCount() { return seenCount; },
        get progressRatio() { return progressRatio; },
        get canGoBack() { return canGoBack; },
        start,
        next,
        goBack,
        openHelpSearch,
        openMnemonicSearch,
        handleKeydown,
    };
}
