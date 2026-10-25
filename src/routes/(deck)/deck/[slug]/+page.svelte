<script lang="ts">
    import { onMount } from "svelte";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import { cardStore } from "#lib/store/store.svelte";
    import { DECK_TYPES } from "#lib/decks/deckTypes";
    import { BOX_COUNT, BOX_LABELS } from "#lib/utils/types";
    import { computeProgressRatio, countCards } from "#lib/utils/pure";
    import { resolve } from "$app/paths";
    import { fade } from "svelte/transition";
    import Page from "#lib/components/shared/Page.svelte";
    import SectionLabel from "#lib/components/shared/SectionLabel.svelte";
    import EmptyNote from "#lib/components/shared/EmptyNote.svelte";
    import ProgressBar from "#lib/components/shared/ProgressBar.svelte";
    import ResetButton from "#lib/components/shared/ResetButton.svelte";
    import ResetProgress from "#lib/components/shared/ResetProgress.svelte";
    import Button from "#lib/components/shared/Button.svelte";
    import DeckNotFound from "#lib/components/deck/DeckNotFound.svelte";
    import DeckManager from "#lib/components/deck/DeckManager.svelte";
    import BoxTabs, {
        type BoxGroup,
    } from "#lib/components/deck/BoxTabs.svelte";
    import CardList from "#lib/components/deck/CardList.svelte";
    import DeckErrors from "#lib/components/deck/DeckErrors.svelte";
    import { studyTimeStore } from "#lib/store/studyTimeStore.svelte";
    import { formatStudyTime } from "#lib/utils/time";
    import { timerStateStore } from "#lib/store/timerStateStore.svelte";

    let { data } = $props();
    let deck = $derived(userDecks.load(data.slug));

    onMount(() => {
        studyTimeStore.init();
        timerStateStore.init();
    });

    const studyTimeMs = $derived(deck ? studyTimeStore.get(deck.slug) : 0);

    const hasTimerState = $derived(
        deck ? timerStateStore.has(deck.slug) : false,
    );

    // Effective pure mode: the deck must define one and the user must
    // have enabled it.
    const pureMode = $derived(
        deck ? deck.pureMode && cardStore.pureMode : false,
    );

    const learnedCount = $derived(
        deck
            ? deck.cards.filter((c) => cardStore.boxOf(c.id) === BOX_COUNT)
                  .length
            : 0,
    );

    const hasProgress = $derived(
        deck
            ? deck.cards.some((c) => cardStore.states[c.id] !== undefined)
            : false,
    );

    const allLearned = $derived(
        deck
            ? deck.cards.length > 0 && learnedCount === deck.cards.length
            : false,
    );

    const overviewDone = $derived(
        deck ? cardStore.isOverviewDone(deck.slug) : false,
    );

    // CTA target and label depend on progress and overview state.
    const ctaHref = $derived.by(() => {
        if (!deck) return resolve("/");
        if (!hasProgress && !overviewDone) {
            return resolve("/(deck)/overview/[slug]", { slug: deck.slug });
        }
        return resolve("/(deck)/cram/[slug]", { slug: deck.slug });
    });

    const ctaLabel = $derived.by(() => {
        if (!hasProgress && !overviewDone) return "Karten ansehen";
        if (!hasProgress && overviewDone) return "Lernmodus starten";
        return "Weiterlernen";
    });

    const isOverviewCta = $derived(!hasProgress && !overviewDone);

    const learningRatio = $derived(
        deck ? computeProgressRatio(deck.cards, cardStore.states) : 0,
    );

    let activeBox = $state<number>(1);

    const boxGroups = $derived.by((): BoxGroup[] => {
        if (!deck) return [];
        const groups: BoxGroup[] = [];
        for (let b = 1; b <= BOX_COUNT; b++) {
            groups.push({
                box: b,
                label: BOX_LABELS[b - 1] ?? String(b),
                cards: deck.cards.filter((c) => cardStore.boxOf(c.id) === b),
            });
        }
        return groups;
    });

    const activeGroup = $derived(
        boxGroups.find((g) => g.box === activeBox) ?? null,
    );

    const cardIds = $derived(deck ? deck.cards.map((c) => c.id) : []);
</script>

<svelte:head>
    <title>{deck?.name ?? "Stapel nicht gefunden"} – NSC</title>
</svelte:head>

{#if !deck}
    <DeckNotFound />
{:else}
    <Page>
        <DeckManager
            {deck}
            subtitle="{DECK_TYPES[deck.deckType].label} · {countCards(
                deck.cards.length,
            )}"
        />

        {#if deck.errors.length > 0}
            <DeckErrors errors={deck.errors} />
        {/if}

        {#if deck.cards.length === 0}
            <EmptyNote>Dieser Stapel enthält keine Karten.</EmptyNote>
        {:else}
            <!-- Hero CTA: the primary action is the most prominent element -->
            <section class="hero-cta">
                <div class="hero-cta-info">
                    <span class="hero-cta-label">Lernfortschritt</span>
                    <span class="hero-cta-count"
                        >{learnedCount} / {deck.cards.length} gelernt</span
                    >
                    <ProgressBar ratio={learningRatio} height="5px" />
                    {#if overviewDone || !hasProgress}
                        <span class="hero-cta-overview">
                            Übersicht: {overviewDone
                                ? "abgeschlossen"
                                : "nicht begonnen"}
                        </span>
                    {/if}
                    {#if studyTimeMs > 0}
                        <span class="hero-cta-overview">
                            Lernzeit gesamt: {formatStudyTime(studyTimeMs)}
                        </span>
                    {/if}
                </div>
                {#if allLearned}
                    <ResetProgress {cardIds} slug={deck.slug} />
                {:else}
                    <Button
                        variant={isOverviewCta ? "overview" : "primary"}
                        href={ctaHref}
                        class="hero-cta-button"
                    >
                        {ctaLabel}
                        <span aria-hidden="true">→</span>
                    </Button>
                {/if}
            </section>

            <!-- Box overview: browse cards by Leitner box -->
            <section class="box-section" aria-label="Karten stöbern">
                <SectionLabel>Karten stöbern</SectionLabel>
                <BoxTabs
                    groups={boxGroups}
                    {activeBox}
                    onSelect={(box) => (activeBox = box)}
                />

                <div class="box-panel" role="tabpanel">
                    {#key activeBox}
                        <div in:fade={{ duration: 200 }}>
                            {#if !activeGroup || activeGroup.cards.length === 0}
                                <EmptyNote>Keine Karten in dieser Box.</EmptyNote>
                            {:else}
                                <CardList
                                    cards={activeGroup.cards}
                                    {pureMode}
                                />
                            {/if}
                        </div>
                    {/key}
                </div>
            </section>

            {#if hasProgress || overviewDone || studyTimeMs > 0 || hasTimerState}
                <div class="reset-actions">
                    {#if overviewDone}
                        <ResetButton
                            variant="neutral"
                            label="Übersicht zurücksetzen"
                            confirmText="Übersicht für diesen Stapel zurücksetzen?"
                            onReset={() => cardStore.resetOverview(deck.slug)}
                        />
                    {/if}
                    {#if hasProgress}
                        <ResetProgress {cardIds} slug={deck.slug} />
                    {/if}
                    {#if studyTimeMs > 0 || hasTimerState}
                        <ResetButton
                            label="Timer und Lernzeit zurücksetzen"
                            confirmText="Timer und Lernzeit für diesen Stapel zurücksetzen?"
                            onReset={() => {
                                studyTimeStore.reset(deck.slug);
                                timerStateStore.reset(deck.slug);
                            }}
                        />
                    {/if}
                </div>
            {/if}
        {/if}
    </Page>
{/if}

<style>
    .hero-cta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1.25rem;

        margin-bottom: 2rem;
        padding: 1.25rem 1.4rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);
    }

    .hero-cta-info {
        display: flex;
        flex: 1 1 200px;
        flex-direction: column;
        gap: 0.35rem;
        min-width: 0;
    }

    .hero-cta-label {
        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }

    .hero-cta-count {
        font-size: 1.15rem;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    .hero-cta-overview {
        margin-top: 0.15rem;

        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 500;
    }

    /* The CTA and the reset action match the hero's visual weight. */
    .hero-cta :global(.btn),
    .hero-cta :global(.reset-button) {
        flex: 0 0 auto;
        min-height: 3rem;
        padding: 0.8rem 1.6rem;
        font-size: 1rem;
    }

    .box-section {
        margin-bottom: 1rem;
    }

    .box-panel {
        min-width: 0;
        padding: 0.75rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface-soft);
    }

    .box-panel :global(.card-list) {
        margin: 0;
    }

    .reset-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;

        margin-top: 1.25rem;
    }

    @media (max-width: 540px) {
        .hero-cta {
            flex-direction: column;
            align-items: stretch;
        }

        .hero-cta :global(.btn),
        .hero-cta :global(.reset-button) {
            width: 100%;
        }

        .box-panel {
            padding: 0.5rem;
        }
    }
</style>
