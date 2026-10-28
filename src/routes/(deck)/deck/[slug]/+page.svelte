<script lang="ts">
    import { onMount } from "svelte";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import { cardStore } from "#lib/stores/persistent/cardStore.svelte";
    import { settingStore } from "#lib/stores/persistent/settingStore.svelte";
    import { DECK_TYPES } from "#lib/utils/deckTypes";
    import { BOX_COUNT, BOX_LABELS, type LoadedDeck } from "#lib/types";
    import { computeProgressRatio, countCards } from "#lib/utils/pure";
    import { resolve } from "$app/paths";
    import { fade } from "svelte/transition";
    import Page from "#lib/components/shared/ui/Page.svelte";
    import Card from "#lib/components/shared/ui/Card.svelte";
    import SectionLabel from "#lib/components/shared/ui/SectionLabel.svelte";
    import ProgressBar from "#lib/components/shared/ui/ProgressBar.svelte";
    import ResetButton from "#lib/components/shared/ResetButton.svelte";
    import ResetProgress from "#lib/components/shared/ResetProgress.svelte";
    import Button from "#lib/components/shared/ui/Button.svelte";
    import DeckManager from "#lib/components/decks/DeckManager.svelte";
    import BoxTabs, {
        type BoxGroup,
    } from "#lib/components/decks/BoxTabs.svelte";
    import CardList from "#lib/components/decks/CardList.svelte";
    import DeckErrors from "#lib/components/decks/DeckErrors.svelte";
    import { studyTimeStore } from "#lib/stores/persistent/studyTimeStore.svelte";
    import { formatStudyTime } from "#lib/utils/time";
    import { timerStateStore } from "#lib/stores/persistent/timerStateStore.svelte";

    let { data } = $props();
    // The (deck) layout renders this page only when the deck exists.
    let deck = $derived(decks.load(data.slug) as LoadedDeck);

    onMount(() => {
        studyTimeStore.init();
        timerStateStore.init();
    });

    const studyTimeMs = $derived(studyTimeStore.get(deck.slug));

    const hasTimerState = $derived(timerStateStore.has(deck.slug));

    // Effective pure mode: the deck must define one and the user must
    // have enabled it.
    const pureMode = $derived(deck.pureMode && settingStore.pureMode);

    const learnedCount = $derived(
        deck.cards.filter((c) => cardStore.boxOf(c.id) === BOX_COUNT).length,
    );

    const hasProgress = $derived(
        deck.cards.some((c) => cardStore.states[c.id] !== undefined),
    );

    const allLearned = $derived(
        deck.cards.length > 0 && learnedCount === deck.cards.length,
    );

    const overviewDone = $derived(cardStore.isOverviewDone(deck.slug));

    // CTA target and label depend on progress and overview state.
    const ctaHref = $derived.by(() => {
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
        computeProgressRatio(deck.cards, cardStore.states),
    );

    let activeBox = $state<number>(1);

    const boxGroups = $derived.by((): BoxGroup[] => {
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

    const cardIds = $derived(deck.cards.map((c) => c.id));
</script>

<svelte:head>
    <title>{deck.name} – NSC</title>
</svelte:head>

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
        <p class="empty">Dieser Stapel enthält keine Karten.</p>
    {:else}
        <!-- Hero CTA: the primary action is the most prominent element -->
        <Card class="hero-cta" padding="lg">
            <div class="hero-cta-inner">
                <div class="hero-cta-info">
                    <span class="hero-cta-label">Lernfortschritt</span>
                    {#if overviewDone || hasProgress}
                        <span class="hero-cta-count"
                            >{learnedCount} / {deck.cards.length} gelernt</span
                        >
                    {:else}
                        <span class="hero-cta-count"
                            >{countCards(deck.cards.length)} im Stapel</span
                        >
                    {/if}
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
                    <div class="hero-cta-actions">
                        <Button
                            variant={isOverviewCta ? "overview" : "primary"}
                            href={ctaHref}
                            class="hero-cta-button"
                        >
                            {ctaLabel}
                            <span aria-hidden="true">→</span>
                        </Button>
                        {#if isOverviewCta}
                            <Button
                                variant="secondary"
                                class="hero-cta-skip"
                                onclick={() => cardStore.markOverviewDone(deck.slug)}
                            >
                                Übersicht überspringen
                            </Button>
                        {/if}
                    </div>
                {/if}
            </div>
        </Card>

        <!-- Box overview: browse cards by Leitner box -->
        <section class="box-section" aria-label="Karten stöbern">
            <SectionLabel>Karten stöbern</SectionLabel>
            <BoxTabs
                groups={boxGroups}
                {activeBox}
                onSelect={(box) => (activeBox = box)}
            />

            <Card class="box-panel" padding="sm" bg="soft">
                <div role="tabpanel">
                    {#key activeBox}
                        <div in:fade={{ duration: 200 }}>
                            {#if !activeGroup || activeGroup.cards.length === 0}
                                <p class="empty">Keine Karten in dieser Box.</p>
                            {:else}
                                <CardList
                                    cards={activeGroup.cards}
                                    {pureMode}
                                />
                            {/if}
                        </div>
                    {/key}
                </div>
            </Card>
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
                    <ResetProgress {cardIds} />
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

<style>
    /* Card provides border, radius, bg, shadow, padding. */
    .hero-cta {
        margin-bottom: 2rem;
    }

    .hero-cta-inner {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1.25rem;
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

    .hero-cta-actions {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0.6rem;
        flex: 0 0 auto;
    }

    /* The main CTA matches the hero's visual weight. */
    .hero-cta :global(.hero-cta-button) {
        min-height: 3rem;
        padding: 0.8rem 1.6rem;
        font-size: 1rem;
    }

    /* The skip button is deliberately smaller. */
    .hero-cta :global(.hero-cta-skip) {
        min-height: 2.2rem;
        padding: 0.4rem 0.9rem;
        font-size: 0.8rem;
    }

    @media (max-width: 540px) {
        .hero-cta-inner {
            flex-direction: column;
            align-items: stretch;
        }
    }

    .empty {
        margin: 1rem 0;
        color: var(--text-muted);
        font-size: 0.95rem;
    }

    .box-section {
        margin-bottom: 1rem;
    }

    /* Card provides border, radius, bg-soft, padding. */
    .box-panel {
        min-width: 0;
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
        .hero-cta-actions {
            width: 100%;
        }
    }
</style>
