<script lang="ts">
    import { onMount } from "svelte";
    import { SvelteMap } from "svelte/reactivity";
    import {
        BoxIcon,
        Card,
        ContinueCard,
        EmptyState,
        FlashCard,
        FolderSection,
        Page,
        PageHeader,
        ReadyGate,
        SectionLabel,
        boxCountsOf,
        decks,
        folderLabel,
    } from "#components";
    import { UI } from "#messages/locale.svelte";
    import { BOX_COUNT, STORAGE, core, dialogStore, foldersStore, toastStore } from "#lib";
    import type { DeckType } from "#lib";
    import type { LoadedDeck } from "#components";

    import { resolve } from "$app/paths";

    // Decks live only in this browser (IndexedDB); wait for them before
    // rendering so the server render and the first client render agree.
    let ready = $state(false);

    // H2: the hero is a real, flippable mini-flashcard (sample word of the
    // app's domain), not a static banner.
    let heroFlipped = $state(false);

    onMount(() => {
        void foldersStore.init();
        decks.init().then(() => {
            ready = true;
            void maybeOfferSampleDeck();
        });
    });

    // Session-only flag so the offer appears at most once per tab session.
    const SAMPLE_FLAG = STORAGE.sessionStorage.sampleDialogDismissed;

    // Empty-state offer: import a sample deck that shows what the app can do.
    async function maybeOfferSampleDeck(): Promise<void> {
        if (sessionStorage.getItem(SAMPLE_FLAG) === "1") return;
        if (Object.keys(decks.decks).length > 0) return;

        const ok = await dialogStore.open({
            title: "Noch keine Stapel",
            message:
                "Hier ist noch alles leer. Importiere den Beispiel-Stapel und sieh dir an, wie das Lernen mit NSC funktioniert.",
            confirmLabel: "Beispiel-Stapel importieren",
            cancelLabel: "Später",
            bg: "info",
        });
        if (!ok) return;

        sessionStorage.setItem(SAMPLE_FLAG, "1");

        try {
            const res = await fetch("/decks/sample-deck.md");
            if (!res.ok) throw new Error(String(res.status));
            const raw = await res.text();
            const { doc } = core.parseCollect(core.makeRawMarkdown(raw));
            await decks.add(
                raw,
                "Beispiel",
                doc ? String(doc.title) : "Beispiel-Stapel",
                doc?.type ?? "english"
            );
            toastStore.success("Beispiel-Stapel importiert – viel Spaß beim Lernen!");
        } catch {
            toastStore.error("Der Beispiel-Stapel konnte nicht geladen werden.");
        }
    }

    // All decks are user-uploaded, for totals and "Weiterlernen".
    const allEntries = $derived(
        Object.values(decks.decks).map((deck) => ({
            folders: deck.folders,
            slug: deck.slug,
            name: deck.name,
            deckType: deck.deckType,
            createdAt: deck.createdAt,
        }))
    );

    // One »Weiterlernen« item — the ContinueCard input shape.
    interface ContinueItem {
        slug: string;
        name: string;
        folder: string;
        deckType: DeckType;
        learned: number;
        total: number;
        /** Card count per Leitner box, overview-only cards excluded. */
        boxCounts: number[];
        /** Cards seen in the overview but never answered (strip segment). */
        overviewOnly: number;
        lastSeen: number;
        createdAt: number;
        pinned: boolean;
    }

    // Deck progress values for the »Weiterlernen« items. Cards seen in
    // the overview but never answered leave box 1 and surface as their
    // own --overview segment on the strip.
    function progressOf(cards: LoadedDeck["cards"]): Pick<
        ContinueItem,
        "learned" | "total" | "boxCounts" | "overviewOnly" | "lastSeen"
    > & {
        hasProgress: boolean;
    } {
        const boxCounts = boxCountsOf(cards);
        let learned = 0;
        let lastSeen = 0;
        let hasProgress = false;
        let overviewOnly = 0;
        for (const card of cards) {
            const state = card.state;
            if (!state) continue;
            hasProgress = true;
            if (state.box === BOX_COUNT) learned++;
            if ((state.lastReviewed ?? 0) > lastSeen) lastSeen = state.lastReviewed ?? 0;
            if (state.overviewDone && state.lastReviewed === null) {
                overviewOnly++;
                boxCounts[0]!--;
            }
        }
        return { learned, total: cards.length, boxCounts, overviewOnly, lastSeen, hasProgress };
    }

    // »Weiterlernen«: pinned decks lead (a pin even shows fresh and
    // fully learned decks, and beats the `#exclude-from-continue-learning`
    // tag — the former »Angeheftet« section folded in here); below them,
    // decks with progress that still have unlearned cards. Most
    // recently active first within both halves.
    const continueItems = $derived.by(() => {
        const pinnedItems: ContinueItem[] = [];
        const progressItems: ContinueItem[] = [];
        for (const entry of allEntries) {
            const pinned = entry.folders.includes(core.SPECIAL_FOLDERS.pinned);
            const excluded = entry.folders.includes(core.SPECIAL_FOLDERS.excludeFromContinue);
            if (!pinned && excluded) continue;
            const cards = decks.load(entry.slug)?.cards ?? [];
            const progress = progressOf(cards);
            // Fully learned decks have nothing left to continue with —
            // only a pin keeps them in the list.
            if (!(pinned || (progress.hasProgress && progress.learned !== progress.total)))
                continue;
            const item: ContinueItem = {
                slug: entry.slug,
                name: entry.name,
                folder: folderLabel(entry.folders),
                deckType: entry.deckType,
                ...progress,
                createdAt: entry.createdAt,
                pinned,
            };
            (pinned ? pinnedItems : progressItems).push(item);
        }
        const recency = (a: ContinueItem, b: ContinueItem) =>
            b.lastSeen - a.lastSeen || b.createdAt - a.createdAt;
        return [...pinnedItems.sort(recency), ...progressItems.sort(recency)];
    });

    // User-uploaded decks grouped by their simple folder, newest first
    // within a folder. `#special` folders are tags, not sections: decks
    // without a simple folder fall under the default folder.
    const folders = $derived.by(() => {
        const sorted = Object.values(decks.decks).sort((a, b) => b.createdAt - a.createdAt);
        const groups = new SvelteMap<
            string,
            {
                slug: string;
                name: string;
                count: number;
                deckType: DeckType;
                pinned: boolean;
                excluded: boolean;
                draft: boolean;
            }[]
        >();
        for (const deck of sorted) {
            const key = core.firstSimpleFolder(deck.folders) ?? core.FOLDER_DEFAULT;
            const list = groups.get(key) ?? [];
            list.push({
                slug: deck.slug,
                name: deck.name,
                count: deck.count,
                deckType: deck.deckType,
                pinned: deck.folders.includes(core.SPECIAL_FOLDERS.pinned),
                excluded: deck.folders.includes(core.SPECIAL_FOLDERS.excludeFromContinue),
                draft: deck.folders.includes(core.DRAFT_FOLDER),
            });
            groups.set(key, list);
        }
        return [...groups.entries()]
            .map(([folder, decks]) => ({ folder, decks }))
            .sort((a, b) => a.folder.localeCompare(b.folder));
    });

    function togglePin(slug: string): void {
        void decks.togglePinned(slug);
    }

    function hideFromContinue(slug: string): void {
        void decks.toggleHiddenFromContinue(slug);
    }

    onMount(() => {
        console.log(continueItems);
    });
</script>

<svelte:head>
    <title>NSC</title>
</svelte:head>

<ReadyGate bind:ready>
    <Page>
        <!-- H2/H3: a live, flippable mini-flashcard as the hero — the
             banner's hardcoded light background is gone with it. -->
        <section class="hero" aria-label={UI.heroTitle}>
            <div class="hero-text">
                <h1 class="hero-title">{UI.heroTitle}</h1>
                <p class="hero-sub">{UI.heroText}</p>
            </div>
            <div class="hero-card">
                <FlashCard
                    compact
                    frontText="μανθάνω"
                    backText={UI.heroCardBack}
                    flipped={heroFlipped}
                    onFlip={() => (heroFlipped = !heroFlipped)}
                />
                <span class="hero-hint">{UI.heroFlipHint}</span>
            </div>
        </section>

        {#if continueItems.length > 0}
            <section class="continue-section" aria-label={UI.continueLearning}>
                <SectionLabel>{UI.continueLearning}</SectionLabel>
                <div class="continue-grid">
                    {#each continueItems as item (item.slug)}
                        <ContinueCard
                            slug={item.slug}
                            name={item.name}
                            folder={item.folder}
                            deckType={item.deckType}
                            learned={item.learned}
                            total={item.total}
                            boxCounts={item.boxCounts}
                            overviewCount={item.overviewOnly}
                            pinned={item.pinned}
                            onTogglePin={item.pinned ? () => togglePin(item.slug) : undefined}
                            onHide={item.pinned ? undefined : () => hideFromContinue(item.slug)}
                        />
                    {/each}
                </div>
            </section>
        {/if}

        <PageHeader title={UI.foldersHeading} subtitle={UI.foldersSubtitle} oneliner></PageHeader>

        {#if folders.length === 0}
            <EmptyState
                message={UI.emptyHome}
                action={{ href: resolve("/(io)/upload"), label: UI.emptyHomeAction }}
            >
                {#snippet icon()}
                    <BoxIcon size={40} />
                {/snippet}
            </EmptyState>
        {/if}

        {#each folders as folder (folder.folder)}
            <FolderSection
                folder={folder.folder}
                decks={folder.decks}
                onTogglePin={togglePin}
                opened={foldersStore.openedOf(folder.folder)}
                onToggle={() => void foldersStore.toggle(folder.folder)}
            />
        {/each}

        <!-- H4: the docs card sits below the user's own decks. -->
        <Card href={resolve("/(docs)/docs")} hover bg="primary" class="docs-card">
            <div class="docs-card-body">
                <div class="docs-card-texts">
                    <span class="docs-card-title">{UI.docsCardTitle}</span>
                    <span class="docs-card-text">{UI.docsCardText}</span>
                </div>
                <span class="docs-card-arrow" aria-hidden="true">→</span>
            </div>
        </Card>
    </Page>
</ReadyGate>

<style lang="postcss">
    /* The class lands on the Card root (a child component), so :global.
       The hover border needs to out-specify Card's own .card.hover:hover. */
    :global(.docs-card) {
        margin-top: 2rem;
    }

    :global(.card.docs-card.hover:hover) {
        border-color: var(--primary);
    }

    .docs-card-body {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .docs-card-texts {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
    }

    .docs-card-title {
        color: var(--primary);
        font-weight: 600;
    }

    .docs-card-text {
        color: var(--text-muted);
        font-size: var(--fs-4);
    }

    .docs-card-arrow {
        flex: 0 0 auto;

        color: var(--primary);
        font-size: 1.3rem;
        line-height: 1;

        transition: transform var(--transition-fast);
    }

    :global(.docs-card:hover) .docs-card-arrow {
        transform: translateX(4px);
    }

    /* H2 hero: welcome line left, live mini-flashcard right. */
    .hero {
        display: flex;
        align-items: center;
        gap: clamp(1.5rem, 4dvw, 3.5rem);

        margin-bottom: 1.75rem;
    }

    .hero-text {
        flex: 1 1 55%;
        min-width: 0;
    }

    .hero-title {
        margin: 0 0 0.6rem;
        font-size: var(--fs-7);
        letter-spacing: -0.01em;
    }

    .hero-sub {
        margin: 0;
        max-width: 34rem;
        color: var(--text-muted);
        font-size: var(--fs-4);
        line-height: 1.65;
    }

    .hero-card {
        flex: 0 1 340px;
        min-width: 0;
        text-align: center;
    }

    .hero-hint {
        display: inline-block;
        margin-top: 0.5rem;
        color: var(--text-muted);
        font-size: var(--fs-2);
        font-weight: 500;
    }

    @media (max-width: 540px) {
        .hero {
            flex-direction: column;
            align-items: stretch;
            gap: 1.25rem;
            margin-bottom: 1.25rem;
        }

        .hero-card {
            flex-basis: auto;
        }
    }

    .continue-section {
        margin-bottom: 0.5rem;
    }

    .continue-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
        gap: 0.8rem;
    }
</style>
