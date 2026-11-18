<script lang="ts">
    import { onMount } from "svelte";
    import {
        BoxStrip,
        DeckEmpty,
        FlashCard,
        SessionComplete,
        StatusBar,
        StudyControls,
        StudyLayout,
        decks,
        useCramSession,
        useMediaQuery,
        useStudyTime,
    } from "#components";
    import type { LoadedDeck } from "#components";
    import { messages, toastStore } from "#lib";
    import { UI } from "#messages/locale.svelte";

    let { data } = $props();

    // The (deck) layout renders this page only when the deck exists.
    let deck = $derived(decks.load(data.slug) as LoadedDeck);

    const session = useCramSession(() => decks.load(data.slug));

    // Active learning time: every learning action resets the inactivity
    // pause; the measured time is flushed through the facade.
    const studyTime = useStudyTime(() => data.slug);
    studyTime.observe(session);

    // On mobile the box overview moves from the top (above the progress
    // bar) to the bottom, above the controls.
    const isMobile = useMediaQuery("(max-width: 700px)");

    function handleKeydown(event: KeyboardEvent): void {
        session.handleKeydown(event);
    }

    onMount(() => {
        session.start();
    });

    // Moon button: hides the current card (trailing `*`) and advances
    // the queue; the store keeps the raw markdown inside storage.
    async function moonCurrent(): Promise<void> {
        if (!session.currentCard) return;
        await session.moonCurrent();
        toastStore.success(messages.UI.mooned);
    }

    // H16: grade flash on the card edge for ~150ms after answering.
    let flash = $state<"right" | "wrong" | null>(null);
    let flashTimer: ReturnType<typeof setTimeout> | undefined;

    function answer(right: boolean): void {
        flash = right ? "right" : "wrong";
        clearTimeout(flashTimer);
        flashTimer = setTimeout(() => (flash = null), 150);
        session.answer(right);
    }
</script>

<svelte:head>
    <title>Lernmodus – NSC</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<StudyLayout fullHeight>
    {#snippet top()}
        {#if session.currentCard}
            {#if !isMobile.matches}
                <BoxStrip
                    variant="labeled"
                    counts={session.boxCounts}
                    currentBox={session.currentBox}
                />
            {/if}
            <StatusBar
                learnedCount={session.learnedCount}
                totalCards={session.totalCards}
                boxCounts={session.boxCounts}
            />
        {/if}
    {/snippet}

    {#snippet center()}
        {#if deck.cards.length === 0}
            <DeckEmpty />
        {:else if session.currentCard}
            {#key session.currentCardId}
                <FlashCard
                    frontText={session.frontText}
                    backText={session.backText}
                    contextText={session.contextText}
                    tags={session.currentCard?.tags ?? []}
                    image={session.image}
                    flipped={session.revealed}
                    onFlip={session.toggleFlip}
                    onMoon={moonCurrent}
                    mooned={session.currentHidden}
                    {flash}
                />
            {/key}
        {:else if session.finished}
            <SessionComplete slug={data.slug} cardIds={deck.cards.map((c) => c.cardId)} />
        {:else}
            <DeckEmpty text={UI.emptyNoCards} />
        {/if}
    {/snippet}

    {#snippet bottom()}
        {#if session.currentCard}
            <StudyControls
                revealed={session.revealed}
                canGoBack={session.undoStack.length > 0}
                onGoBack={session.undo}
                onFlip={session.toggleFlip}
                onWrong={() => answer(false)}
                onRight={() => answer(true)}
                onHelp={session.openHelpSearch}
                onMnemonic={session.openMnemonicSearch}
            />
            {#if isMobile.matches}
                <BoxStrip
                    variant="labeled"
                    counts={session.boxCounts}
                    currentBox={session.currentBox}
                />
            {/if}
        {/if}
    {/snippet}
</StudyLayout>
