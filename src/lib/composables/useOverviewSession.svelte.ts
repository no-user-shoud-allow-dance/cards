import { cardStore } from "#lib/store/store.svelte";
import { displayBack, displayFront } from "#lib/utils/pure";
import { DECK_TYPES } from "#lib/decks/deckTypes";
import type { Card, LoadedDeck } from "#lib/utils/types";

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

    const pureMode = $derived(
        deck ? deck.pureMode && cardStore.pureMode : false,
    );

    const currentCard = $derived<Card | null>(
        deck && index >= 0 && index < queue.length
            ? (deck.cards.find((c) => c.id === queue[index]) ?? null)
            : null,
    );

    const frontText = $derived(
        currentCard ? displayFront(currentCard, pureMode) : "",
    );

    const backText = $derived(
        currentCard ? displayBack(currentCard, pureMode) : "",
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
        if (!deck || deck.cards.length === 0) {
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
            `"${currentCard.back}" im Kontext im Deutschen und Vergleich mit Beispielen? ` +
            `Und wie ist der Fall, wenn es um die Übersetzung aus dem ${language} ` +
            `"${currentCard.front}" geht (auch mit Beispielen)?`;

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
            `"${currentCard.front}" Mnemotechnik oder verwandte Wörter in anderen Sprachen`;

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

        if (event.key.toLowerCase() === "h") {
            event.preventDefault();
            openHelpSearch();
        }

        if (event.key.toLowerCase() === "m") {
            event.preventDefault();
            openMnemonicSearch();
        }
    }

    return {
        get currentCard() { return currentCard; },
        get currentCardId() { return currentCard?.id ?? null; },
        get frontText() { return frontText; },
        get backText() { return backText; },
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
