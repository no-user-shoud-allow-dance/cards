<script lang="ts">
    import { onMount } from "svelte";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import { useOverviewSession } from "#lib/composables/useOverviewSession.svelte";
    import OverviewCard from "#lib/components/learning/overview/OverviewCard.svelte";
    import OverviewComplete from "#lib/components/learning/overview/OverviewComplete.svelte";
    import StudyControls from "#lib/components/learning/StudyControls.svelte";
    import ProgressBar from "#lib/components/shared/ProgressBar.svelte";
    import StudyLayout from "#lib/components/learning/StudyLayout.svelte";
    import type { LoadedDeck } from "#lib/types";
    import DeckEmpty from "#lib/components/decks/DeckEmpty.svelte";

    let { data } = $props();

    // The (deck) layout renders this page only when the deck exists.
    let deck = $derived(decks.load(data.slug) as LoadedDeck);

    const session = useOverviewSession(
        () => decks.load(data.slug),
        () => data.slug,
    );

    onMount(() => {
        // The parent layout mounts this page only after the user's decks
        // (IndexedDB) are loaded, so the session can start right away.
        session.start();
    });
</script>

<svelte:head>
    <title>Übersicht – NSC</title>
</svelte:head>

<svelte:window onkeydown={session.handleKeydown} />

<StudyLayout fullHeight>
    {#snippet top()}
        {#if session.currentCard}
            <div class="overview-banner">
                Übersichtsmodus — Karten werden nicht bewertet
            </div>
            <div class="overview-progress">
                <span class="overview-progress-label">
                    {session.seenCount} / {session.totalCards} Karten
                    angesehen
                </span>
                <span class="overview-progress-bar">
                    <ProgressBar ratio={session.progressRatio} />
                </span>
            </div>
        {/if}
    {/snippet}

    {#snippet center()}
        {#if deck.cards.length === 0}
            <DeckEmpty />
        {:else if session.currentCard}
            {#key session.currentCardId}
                <OverviewCard
                    frontText={session.frontText}
                    backText={session.backText}
                    onclick={session.next}
                />
            {/key}
        {:else if session.finished}
            <OverviewComplete
                slug={data.slug}
                totalCards={session.totalCards}
            />
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

<style>
    .overview-banner {
        padding: 0.5rem 0.85rem;

        border: 1px solid var(--overview-border);
        border-radius: var(--radius-md);

        background: var(--overview-soft);
        color: var(--overview);

        font-size: 0.82rem;
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
        font-size: 0.82rem;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    .overview-progress-bar {
        display: block;
        --progress-color: var(--overview);
    }
</style>
