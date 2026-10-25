<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { getDeck } from "#lib/decks/loader";
    import { cardStore } from "#lib/store/store.svelte";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import { computeProgressRatio, countCards } from "#lib/utils/pure";
    import { DECK_TYPES } from "#lib/decks/deckTypes";
    import { BOX_COUNT } from "#lib/utils/types";
    import { resolve } from "$app/paths";
    import { fade, fly } from "svelte/transition";
    import ShareButton from "#lib/components/shared/ShareButton.svelte";
    import BoxTabs, {
        type BoxGroup,
    } from "#lib/components/deck/BoxTabs.svelte";
    import CardList from "#lib/components/deck/CardList.svelte";
    import DeckErrors from "#lib/components/deck/DeckErrors.svelte";
    import ResetProgress from "#lib/components/shared/ResetProgress.svelte";
    import ResetOverview from "#lib/components/deck/ResetOverview.svelte";
    import ProgressBar from "#lib/components/shared/ProgressBar.svelte";
    import { studyTimeStore } from "#lib/store/studyTimeStore.svelte";
    import { formatStudyTime } from "#lib/utils/time";
    import { timerStateStore } from "#lib/store/timerStateStore.svelte";
    import ResetTimer from "#lib/components/shared/ResetTimer.svelte";

    let { data } = $props();
    let deck = $derived(getDeck(data.slug));

    // Rename, move and delete only apply to user-uploaded decks
    // (bundled decks are read-only files). Share works for all decks.
    const isUserDeck = $derived(userDecks.get(data.slug) !== undefined);
    let editing = $state<"rename" | "move" | null>(null);
    let renameValue = $state("");
    let moveValue = $state("");
    let renameInput = $state<HTMLInputElement | null>(null);
    let moveInput = $state<HTMLInputElement | null>(null);
    let confirmDelete = $state(false);

    // Reset per-deck action state when navigating to another deck.
    $effect(() => {
        void data.slug;
        editing = null;
        confirmDelete = false;
    });

    // Focus the inline edit input once it appears.
    $effect(() => {
        if (editing === "rename") renameInput?.focus();
        if (editing === "move") moveInput?.focus();
    });

    function startRename(): void {
        if (!deck) return;
        renameValue = deck.name;
        confirmDelete = false;
        editing = "rename";
    }

    function startMove(): void {
        if (!deck) return;
        moveValue = deck.folder;
        confirmDelete = false;
        editing = "move";
    }

    async function submitRename(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        await userDecks.update(data.slug, { name: renameValue });
        editing = null;
    }

    async function submitMove(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        await userDecks.update(data.slug, { folder: moveValue });
        editing = null;
    }

    async function deleteDeck(): Promise<void> {
        await userDecks.remove(data.slug);
        goto(resolve("/"));
    }

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
            return resolve("/overview/[slug]", { slug: deck.slug });
        }
        return resolve("/cram/[slug]", { slug: deck.slug });
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
        const labels: Record<number, string> = {
            1: "I",
            2: "II",
            3: "III",
            4: "IV",
            5: "V",
            6: "Gelernt",
        };
        const groups: BoxGroup[] = [];
        for (let b = 1; b <= BOX_COUNT; b++) {
            groups.push({
                box: b,
                label: labels[b],
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
    <div class="page"><p>Stapel nicht gefunden.</p></div>
{:else}
    <div class="page">
        <h1 class="deck-title">
            {#if isUserDeck}
                <button
                    type="button"
                    class="title-part"
                    class:editing={editing === "move"}
                    title="Ordner ändern"
                    aria-label="Ordner ändern: {deck.folder}"
                    onclick={startMove}
                >
                    {deck.folder}
                </button>
            {:else}
                <span class="title-part">{deck.folder}</span>
            {/if}
            <span class="title-separator" aria-hidden="true">/</span>
            {#if isUserDeck}
                <button
                    type="button"
                    class="title-part"
                    class:editing={editing === "rename"}
                    title="Stapel umbenennen"
                    aria-label="Stapel umbenennen: {deck.name}"
                    onclick={startRename}
                >
                    {deck.name}
                </button>
            {:else}
                <span class="title-part">{deck.name}</span>
            {/if}
        </h1>
        <p class="subtitle">
            {DECK_TYPES[deck.deckType].label} · {countCards(deck.cards.length)}
        </p>

        <div class="deck-actions">
            {#if isUserDeck}
                {#if editing === "rename"}
                    <form
                        class="inline-form"
                        onsubmit={submitRename}
                        transition:fly={{ y: -6, duration: 160 }}
                    >
                        <input
                            class="inline-input"
                            type="text"
                            bind:this={renameInput}
                            bind:value={renameValue}
                            aria-label="Neuer Name des Stapels"
                        />
                        <button
                            type="submit"
                            class="deck-action deck-action--primary"
                        >
                            Speichern
                        </button>
                        <button
                            type="button"
                            class="deck-action"
                            onclick={() => (editing = null)}
                        >
                            Abbrechen
                        </button>
                    </form>
                {:else if editing === "move"}
                    <form
                        class="inline-form"
                        onsubmit={submitMove}
                        transition:fly={{ y: -6, duration: 160 }}
                    >
                        <input
                            class="inline-input"
                            type="text"
                            bind:this={moveInput}
                            bind:value={moveValue}
                            aria-label="Neuer Ordner des Stapels"
                        />
                        <button
                            type="submit"
                            class="deck-action deck-action--primary"
                        >
                            Speichern
                        </button>
                        <button
                            type="button"
                            class="deck-action"
                            onclick={() => (editing = null)}
                        >
                            Abbrechen
                        </button>
                    </form>
                {:else}
                    <div
                        class="deck-actions-row"
                        transition:fly={{ y: -6, duration: 160 }}
                    >
                        <ShareButton slug={deck.slug} />

                        {#key confirmDelete}
                            <button
                                type="button"
                                class="deck-action deck-action--danger"
                                in:fade={{ duration: 120 }}
                                onclick={confirmDelete
                                    ? deleteDeck
                                    : () => (confirmDelete = true)}
                            >
                                {confirmDelete
                                    ? "Wirklich löschen?"
                                    : "Löschen"}
                            </button>
                        {/key}
                    </div>
                {/if}
            {/if}
        </div>

        {#if deck.errors.length > 0}
            <DeckErrors errors={deck.errors} />
        {/if}

        {#if deck.cards.length === 0}
            <p class="empty">Dieser Stapel enthält keine Karten.</p>
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
                    <a
                        href={ctaHref}
                        class="hero-cta-button"
                        class:hero-cta-button--overview={isOverviewCta}
                    >
                        {ctaLabel}
                        <span aria-hidden="true">→</span>
                    </a>
                {/if}
            </section>

            <!-- Box overview: browse cards by Leitner box -->
            <section class="box-section" aria-label="Karten stöbern">
                <h2 class="section-label">Karten stöbern</h2>
                <BoxTabs
                    groups={boxGroups}
                    {activeBox}
                    onSelect={(box) => (activeBox = box)}
                />

                <div class="box-panel" role="tabpanel">
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
            </section>

            {#if hasProgress || overviewDone || studyTimeMs > 0 || hasTimerState}
                <div class="reset-actions">
                    {#if overviewDone}
                        <ResetOverview slug={deck.slug} />
                    {/if}
                    {#if hasProgress}
                        <ResetProgress {cardIds} slug={deck.slug} />
                    {/if}
                    {#if studyTimeMs > 0 || hasTimerState}
                        <ResetTimer slug={deck.slug} />
                    {/if}
                </div>
            {/if}
        {/if}
    </div>
{/if}

<style>
    .deck-title {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.5rem;
    }

    .title-part {
        font: inherit;
        color: inherit;

        margin: 0;
        padding: 0;

        border: 0;
        background: none;

        overflow-wrap: anywhere;
    }

    button.title-part {
        cursor: pointer;
        text-decoration: underline dotted;
        text-underline-offset: 0.18em;
        text-decoration-color: transparent;
        transition:
            0.3s text-decoration-color ease,
            0.3s text-decoration ease;
    }

    button.title-part:hover {
        color: var(--primary);
        text-decoration: underline dotted;
        text-decoration-color: var(--primary);
    }

    .title-part.editing {
        color: var(--primary);
        text-decoration: underline;
        text-decoration-color: var(--primary);
    }

    .title-separator {
        color: var(--text-muted);
        font-weight: 400;
        user-select: none;
    }

    .deck-actions {
        display: grid;
        align-items: center;

        margin: -0.5rem 0 1.5rem;
    }

    /* The action views (default row, rename form, move form) swap with fly
       transitions. Stack them in one grid cell so the outgoing and incoming
       elements overlap in place instead of sitting side by side in the flow
       and snapping into position once the outro finishes. */
    .deck-actions > * {
        grid-area: 1 / 1;
        justify-self: start;
    }

    .deck-actions-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
    }

    .deck-action {
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;

        padding: 0.7rem 1.15rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

        cursor: pointer;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast);
    }

    .deck-action:hover {
        border-color: var(--border-strong);
        background: var(--surface-hover);
    }

    .deck-action--primary {
        border-color: transparent;

        background: var(--primary);
        color: var(--primary-text);
    }

    .deck-action--primary:hover {
        background: var(--primary-hover);
    }

    .deck-action--danger {
        border-color: var(--danger-border);

        background: var(--danger-bg);
        color: var(--danger-text);
    }

    .deck-action--danger:hover {
        background: var(--danger-hover);
    }

    .inline-form {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
    }

    .inline-input {
        font: inherit;
        font-size: 0.875rem;

        min-width: 12rem;
        padding: 0.6rem 0.65rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);
    }

    .inline-input:focus {
        border-color: var(--primary);
        outline: 2px solid var(--focus-ring);
    }

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

    .hero-cta-button {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;

        min-height: 3rem;
        padding: 0.8rem 1.6rem;

        border: 0;
        border-radius: var(--radius-md);

        background: var(--primary);
        color: var(--primary-text);

        font-size: 1rem;
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;

        transition: background var(--transition-fast);
    }

    .hero-cta-button:hover {
        background: var(--primary-hover);
    }

    .hero-cta-button--overview {
        background: var(--overview);
    }

    .hero-cta-button--overview:hover {
        background: var(--overview-hover);
    }

    .hero-cta :global(.reset-progress) {
        min-height: 3rem;
        margin-top: 0;
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

    .reset-actions :global(.reset-progress),
    .reset-actions :global(.reset-overview),
    .reset-actions :global(.reset-timer) {
        margin-top: 0;
    }

    @media (max-width: 540px) {
        .hero-cta {
            flex-direction: column;
            align-items: stretch;
        }

        .hero-cta-button {
            width: 100%;
        }

        .box-panel {
            padding: 0.5rem;
        }
    }
</style>
