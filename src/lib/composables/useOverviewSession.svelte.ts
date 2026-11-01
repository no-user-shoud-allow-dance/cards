import { cardStore } from "#lib/stores/persistent/cardStore.svelte";
import { settingStore } from "#lib/stores/persistent/settingStore.svelte";
import { DECK_TYPES } from "#lib/utils/deckTypes";
import { cardPrompt, cardAnswer, displayFront, displayBack } from "#lib/utils/pure";
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
        currentCard ? displayBack(currentCard, false, deckType) : "",
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

        const language = DECK_TYPES[deck.deckType].language;

        const query =
            `"${cardAnswer(currentCard)}" im Kontext im Deutschen und Vergleich mit Beispielen? ` +
            `Und wie ist der Fall, wenn es um die Übersetzung aus dem ${language} ` +
            `"${cardPrompt(currentCard)}" geht (auch mit Beispielen)?`;

        const params = new URLSearchParams({
            q: query,
            udm: "50",
        });

        window.open(
            `https://www.google.com/search?${params}`,
            "_blank",
            "noopener,noreferrer",
        );
    }

    function openMnemonicSearch(): void {
        if (!currentCard) return;

        const query =
            `"${cardPrompt(currentCard)}" Mnemotechnik oder verwandte Wörter in anderen Sprachen`;

        const params = new URLSearchParams({
            q: query,
            udm: "50",
        });

        window.open(
            `https://www.google.com/search?${params}`,
            "_blank",
            "noopener,noreferrer",
        );
    }

    function handleKeydown(event: KeyboardEvent): void {
        if (!currentCard) return;

        const target = event.target;

        if (
            target instanceof HTMLElement &&
            target.closest("input, textarea, select, [contenteditable='true']")
        ) {
            return;
        }

        // Space advances to the next card.
        if (event.code === "Space") {
            if (target instanceof HTMLElement && target.closest("button, a")) {
                return;
            }
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
