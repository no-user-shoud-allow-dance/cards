<script lang="ts">
    import { onMount } from "svelte";
    import { getDeck } from "#lib/decks/loader";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import { useOverviewSession } from "#lib/composables/useOverviewSession.svelte";
    import { resolve } from "$app/paths";
    import { fade } from "svelte/transition";
    import OverviewCard from "#lib/components/overview/OverviewCard.svelte";
    import StudyControls from "#lib/components/shared/StudyControls.svelte";
    import ProgressBar from "#lib/components/shared/ProgressBar.svelte";

    let { data } = $props();

    let deck = $derived(getDeck(data.slug));

    const session = useOverviewSession(() => getDeck(data.slug), () => data.slug);

    onMount(() => {
        // Wait for user-uploaded decks (IndexedDB) before starting.
        userDecks.init().then(() => session.start());
    });
</script>

<svelte:window onkeydown={session.handleKeydown} />

{#if !deck}
    <div class="page">
        <p>Stapel nicht gefunden.</p>
    </div>
{:else}
    <div class="overview-page">
        {#if deck.cards.length === 0}
            <div class="overview-empty">
                <p class="empty">Dieser Stapel enthält keine Karten.</p>
            </div>
        {:else if session.currentCard}
            <div class="overview-top">
                <div class="overview-banner">Übersichtsmodus — Karten werden nicht bewertet</div>
                <div class="overview-progress">
                    <span class="overview-progress-label">
                        {session.seenCount} / {session.totalCards} Karten angesehen
                    </span>
                    <span class="overview-progress-bar">
                        <ProgressBar ratio={session.progressRatio} />
                    </span>
                </div>
            </div>

            <div class="overview-center">
                {#key session.currentCardId}
                    <OverviewCard
                        frontText={session.frontText}
                        backText={session.backText}
                    />
                {/key}
            </div>

            <div class="overview-bottom">
                <StudyControls
                    revealed={true}
                    isOverview={true}
                    canGoBack={session.canGoBack}
                    onGoBack={session.goBack}
                    onNext={session.next}
                    onHelp={session.openHelpSearch}
                    onMnemonic={session.openMnemonicSearch}
                />
            </div>
        {:else if session.finished}
            <div class="overview-center">
                <div class="overview-done" in:fade={{ duration: 250 }}>
                    <h2>Übersicht abgeschlossen</h2>
                    <p>
                        Alle {session.totalCards} Karten wurden angesehen.
                        Starte jetzt den Lernmodus, um Antworten zu bewerten.
                    </p>
                    <div class="overview-done-actions">
                        <a class="secondary" href={resolve("/deck/[slug]", { slug: data.slug })}>
                            Zurück zum Stapel
                        </a>
                        <a class="primary" href={resolve("/cram/[slug]", { slug: data.slug })}>
                            Lernmodus starten
                            <span aria-hidden="true">→</span>
                        </a>
                    </div>
                </div>
            </div>
        {:else}
            <div class="overview-empty">
                <p class="empty">Keine Karten verfügbar.</p>
            </div>
        {/if}
    </div>
{/if}

<style>
    .overview-page {
        display: flex;
        flex-direction: column;

        width: min(100%, var(--content-width));
        min-height: calc(100vh - 3.5rem - var(--footer-h));
        margin-inline: auto;
        padding: 1.5rem 1.5rem 2rem;
    }

    .overview-top {
        flex: 0 0 auto;

        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }

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

    .overview-center {
        position: relative;

        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        justify-content: center;
        min-height: 0;
    }

    .overview-bottom {
        flex: 0 0 auto;
        margin-top: 1rem;
    }

    .overview-empty {
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        justify-content: center;
    }

    .overview-done {
        padding: clamp(2rem, 7vw, 4rem) 1.5rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        text-align: center;
    }

    .overview-done h2 {
        margin: 0 0 0.6rem;

        font-size: 1.6rem;
        font-weight: 600;
        letter-spacing: -0.01em;
    }

    .overview-done p {
        max-width: 32rem;
        margin: 0 auto 1.5rem;

        color: var(--text-muted);
        font-size: 0.95rem;
        line-height: 1.65;
    }

    .overview-done-actions {
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
    }

    .overview-done-actions .secondary {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        min-height: 2.8rem;
        padding: 0.7rem 1.15rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);
        text-decoration: none;

        font-size: 0.875rem;
        font-weight: 600;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast);
    }

    .overview-done-actions .secondary:hover {
        border-color: var(--border-strong);
        background: var(--surface-hover);
    }

    .overview-done-actions .primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;

        min-height: 2.8rem;
        margin: 0;
        padding: 0.7rem 1.4rem;

        border: 0;
        border-radius: var(--radius-md);

        background: var(--primary);
        color: var(--primary-text);
        text-decoration: none;

        font-size: 0.875rem;
        font-weight: 600;
        white-space: nowrap;

        transition: background var(--transition-fast);
    }

    .overview-done-actions .primary:hover {
        background: var(--primary-hover);
    }

    @media (max-width: 540px) {
        .overview-page {
            padding: 1rem 1rem 1.5rem;
        }

        .overview-done-actions {
            flex-direction: column;
        }

        .overview-done-actions .secondary,
        .overview-done-actions .primary {
            width: 100%;
        }
    }
</style>
