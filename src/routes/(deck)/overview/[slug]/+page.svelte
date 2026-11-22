<script lang="ts">
    import { onMount } from "svelte";
    import {
        DeckEmpty,
        FlashCard,
        OverviewComplete,
        ProgressBar,
        StudyControls,
        StudyLayout,
        decks,
        useOverviewSession,
    } from "#components";
    import type { LoadedDeck } from "#components";
    import { messages, toastStore } from "#lib";

    let { data } = $props();

    // The (deck) layout renders this page only when the deck exists.
    let deck = $derived(decks.load(data.slug) as LoadedDeck);

    const session = useOverviewSession(
        () => decks.load(data.slug),
        () => data.slug
    );

    onMount(() => {
        // The parent layout mounts this page only after the user's decks
        // (IndexedDB) are loaded, so the session can start right away.
        session.start();
    });

    // Moon button: toggles the trailing `*` on the current card. The
    // overview keeps mooned cards visible — only the marker changes.
    async function moonCurrent(): Promise<void> {
        if (!session.currentCard) return;
        const wasHidden = session.hidden;
        await session.moonCurrent();
        toastStore.success(wasHidden ? messages.UI.wake : messages.UI.mooned);
    }
</script>

<svelte:head>
    <title>Übersicht – NSC</title>
</svelte:head>

<svelte:window onkeydown={session.handleKeydown} />

<StudyLayout fullHeight>
    {#snippet top()}
        {#if session.currentCard}
            <div class="overview-banner">Übersichtsmodus – Karten werden nicht bewertet</div>
            <div class="overview-progress">
                <span class="overview-progress-label">
                    {session.seenCount} / {session.totalCards} Karten angesehen
                </span>
                <span class="overview-progress-bar">
                    <ProgressBar ratio={session.progressRatio} color="overview" />
                </span>
            </div>
        {/if}
    {/snippet}

    {#snippet center()}
        {#if deck.cards.length === 0}
            <DeckEmpty />
        {:else if session.finished}
            <OverviewComplete slug={data.slug} totalCards={session.totalCards} />
        {:else if session.currentCard}
            {#key session.currentCardId}
                <FlashCard
                    frontText={session.frontText}
                    backText={session.backText}
                    contextText={session.contextText}
                    tags={session.tags}
                    mooned={session.hidden}
                    image={session.image}
                    onclick={session.next}
                    onMoon={moonCurrent}
                />
            {/key}
        {:else}
            <DeckEmpty text="Keine Karten verfügbar." />
        {/if}
    {/snippet}

    {#snippet bottom()}
        {#if session.currentCard}
            <StudyControls
                revealed={true}
                isOverview={true}
                canGoBack={session.canGoBack}
                onGoBack={session.goBack}
                onNext={session.next}
                onHelp={session.openHelpSearch}
                onMnemonic={session.openMnemonicSearch}
            />
        {/if}
    {/snippet}
</StudyLayout>

<style lang="postcss">
    .overview-banner {
        padding: 0.5rem 0.85rem;

        border: 1px solid var(--overview-border);
        border-radius: var(--radius-md);

        background: var(--overview-soft);
        color: var(--overview);

        font-size: var(--fs-3);
        font-weight: 600;
        text-align: center;
    }

    .overview-progress {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;

        margin-top: 0.6rem;
    }

    .overview-progress-label {
        color: var(--text-muted);
        font-size: var(--fs-3);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    .overview-progress-bar {
        display: block;
        --progress-color: var(--overview);
    }
</style>
