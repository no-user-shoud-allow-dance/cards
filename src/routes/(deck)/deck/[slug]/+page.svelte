<script lang="ts">
    import {
        BoxTabs,
        Button,
        Card,
        CardList,
        DeckErrors,
        DeckManager,
        Page,
        ProgressBar,
        ResetButton,
        ResetProgress,
        SectionLabel,
        boxOfCard,
        computeProgressRatio,
        decks,
    } from "#components";
    import type { BoxGroup, LoadedDeck } from "#components";
    import { BOX_COUNT, messages } from "#lib";

    import { resolve } from "$app/paths";
    import { fade } from "svelte/transition";

    let { data } = $props();
    // The (deck) layout renders this page only when the deck exists —
    // fully compiled: content, folders, progress and study time.
    let deck = $derived(decks.load(data.slug) as LoadedDeck);

    const studyTimeMs = $derived(deck.studyTimeMs);

    // Effective pure mode, compiled into the deck: the per-deck kk-state
    // override wins, else the global settings default applies.
    const pureMode = $derived(deck.pureModeEnabled);

    const learnedCount = $derived(deck.cards.filter((c) => boxOfCard(c) === BOX_COUNT).length);

    const hasProgress = $derived(deck.hasProgress);

    const allLearned = $derived(deck.cards.length > 0 && learnedCount === deck.cards.length);

    const overviewDone = $derived(deck.overviewComplete);

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

    const learningRatio = $derived(computeProgressRatio(deck.cards));

    let activeBox = $state<number>(1);

    // Box key of the moon box: 0 is unused by the Leitner boxes (1..BOX_COUNT).
    const MOON_BOX = 0;

    const boxGroups = $derived.by((): BoxGroup[] => {
        const groups: BoxGroup[] = [];
        for (let b = 1; b <= BOX_COUNT; b++) {
            groups.push({
                box: b,
                label: messages.UI.boxLabel(b),
                cards: deck.cards.filter((c) => boxOfCard(c) === b),
            });
        }
        // The moon box lists every mooned card (trailing `*`); the tab shows
        // only the count, the label stays as the accessible name.
        groups.push({
            box: MOON_BOX,
            label: messages.UI.moonBox,
            cards: deck.cards.filter((c) => c.hidden),
            moon: true,
        });
        return groups;
    });

    const activeGroup = $derived(boxGroups.find((g) => g.box === activeBox) ?? null);

    // Content-hash ids of all cards — the key progress is stored under.
    const cardIds = $derived(deck.cards.map((c) => c.cardId));

    // Moon button per card row: writes the trailing `*` via the store
    // (raw markdown stays inside storage) and confirms with a toast.
    // Structural type: the #components barrel's `FlashCard` name is merged
    // with the FlashCard component, so the interface isn't reachable there.
    async function toggleMoon(card: { id: string; hidden: boolean }): Promise<void> {
        await decks.toggleCardHidden(deck.slug, card.id);
    }
</script>

<svelte:head>
    <title>{deck.name} – NSC</title>
</svelte:head>

<Page>
    <DeckManager {deck} />

    {#if deck.errors.length > 0}
        <DeckErrors errors={deck.errors} />
    {/if}

    {#if deck.cards.length === 0}
        <p class="empty">Dieser Stapel enthält keine Karten.</p>
    {:else}
        <!-- Hero CTA: the primary action is the most prominent element.
             Drafts never reach this page — the (deck) layout bounces
             them to /draft/[slug]. -->
        <Card class="hero-cta" padding="lg">
            <div class="hero-cta-inner">
                <div class="hero-cta-info">
                    <span class="hero-cta-label">Lernfortschritt</span>
                    {#if overviewDone || hasProgress}
                        <span class="hero-cta-count">
                            {learnedCount} / {deck.cards.length} gelernt
                        </span>
                    {:else}
                        <span class="hero-cta-count">
                            {messages.UI.countCards(deck.cards.length)}
                            {messages.UI.deck}
                        </span>
                    {/if}
                    <ProgressBar ratio={learningRatio} height="5px" />
                    {#if overviewDone || !hasProgress}
                        <span class="hero-cta-overview">
                            Übersicht: {overviewDone ? "abgeschlossen" : "nicht begonnen"}
                        </span>
                    {/if}
                    {#if studyTimeMs > 0}
                        <span class="hero-cta-overview">
                            Lernzeit gesamt: {messages.UI.studyTime(studyTimeMs)}
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
                                onclick={() => {
                                    void decks.markOverviewDoneAll(
                                        deck.slug,
                                        deck.cards.map((c) => c.cardId)
                                    );
                                }}
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
            <BoxTabs groups={boxGroups} bind:activeBox />

            <Card class="box-panel" padding="sm" bg="soft">
                <div role="tabpanel">
                    {#key activeBox}
                        <div in:fade={{ duration: 200 }}>
                            {#if !activeGroup || activeGroup.cards.length === 0}
                                <p class="empty">
                                    {activeGroup?.box === MOON_BOX
                                        ? "Keine Karten in der Mond-Box."
                                        : "Keine Karten in dieser Box."}
                                </p>
                            {:else}
                                <CardList
                                    class="box-list"
                                    cards={activeGroup.cards}
                                    {pureMode}
                                    deckType={deck.deckType}
                                    onToggleMoon={toggleMoon}
                                />
                            {/if}
                        </div>
                    {/key}
                </div>
            </Card>
        </section>

        {#if hasProgress || overviewDone || studyTimeMs > 0}
            <div class="reset-actions">
                {#if overviewDone}
                    <ResetButton
                        variant="neutral"
                        label="Übersicht zurücksetzen"
                        confirmText="Übersicht für diesen Stapel zurücksetzen?"
                        onReset={() => {
                            void decks.clearOverview(
                                deck.slug,
                                deck.cards.map((c) => c.cardId)
                            );
                        }}
                    />
                {/if}
                {#if hasProgress}
                    <ResetProgress {cardIds} slug={deck.slug} />
                {/if}
                {#if studyTimeMs > 0}
                    <ResetButton
                        label="Lernzeit zurücksetzen"
                        confirmText="Lernzeit für diesen Stapel zurücksetzen?"
                        onReset={() => void decks.resetStudyTime(deck.slug)}
                    />
                {/if}
            </div>
        {/if}
    {/if}
</Page>

<style lang="postcss">
    /* Card provides border, radius, bg, shadow, padding. Classes passed to
       child components (Card/Button/CardList roots) are targeted via
       :global, anchored under this page's own elements where possible. */
    :global(.hero-cta) {
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
        font-size: var(--fs-2);
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
        font-size: var(--fs-2);
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
    .hero-cta-actions :global(.hero-cta-button) {
        min-height: 3rem;
        padding: 0.8rem 1.6rem;
        font-size: 1rem;
    }

    /* The skip button is deliberately smaller. */
    .hero-cta-actions :global(.hero-cta-skip) {
        min-height: 2.2rem;
        padding: 0.4rem 0.9rem;
        font-size: var(--fs-3);
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
        font-size: var(--fs-5);
    }

    .box-section {
        margin-bottom: 1rem;
    }

    /* Card provides border, radius, bg-soft, padding. */
    :global(.box-panel) {
        min-width: 0;

        & :global(.box-list) {
            margin: 0;
        }
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
