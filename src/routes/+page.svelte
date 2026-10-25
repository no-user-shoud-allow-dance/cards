<script lang="ts">
    import { onMount } from "svelte";
    import { cardStore } from "#lib/store/store.svelte";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import { BOX_COUNT, type DeckType } from "#lib/utils/types";
    import { computeProgressRatio, countCards } from "#lib/utils/pure";
    import { resolve } from "$app/paths";
    import Page from "#lib/components/shared/Page.svelte";
    import PageHeader from "#lib/components/shared/PageHeader.svelte";
    import SectionLabel from "#lib/components/shared/SectionLabel.svelte";
    import EmptyNote from "#lib/components/shared/EmptyNote.svelte";
    import FolderSection from "#lib/components/home/FolderSection.svelte";
    import ContinueCard from "#lib/components/home/ContinueCard.svelte";
    import ShareImport from "#lib/components/home/ShareImport.svelte";
    import HomeIntro from "#lib/components/home/HomeIntro.svelte";

    // Decks live only in this browser (IndexedDB); wait for them before
    // rendering so the server render and the first client render agree.
    let ready = $state(false);

    onMount(() => {
        userDecks.init().then(() => {
            ready = true;
        });
    });

    // All decks are user-uploaded, for totals and "Weiterlernen".
    const allEntries = $derived(
        Object.values(userDecks.decks).map((deck) => ({
            folder: deck.folder,
            slug: deck.slug,
            name: deck.name,
            deckType: deck.deckType,
        })),
    );

    // Totals shown in the page header.
    const totals = $derived.by(() => {
        let cards = 0;
        for (const entry of allEntries) {
            cards += userDecks.load(entry.slug)?.cards.length ?? 0;
        }
        return { decks: allEntries.length, cards };
    });

    // Decks with existing progress that still have unlearned cards,
    // most recently active first.
    const inProgress = $derived.by(() => {
        const items: {
            slug: string;
            name: string;
            folder: string;
            deckType: DeckType;
            learned: number;
            total: number;
            ratio: number;
            lastSeen: number;
        }[] = [];
        for (const entry of allEntries) {
            const deck = userDecks.load(entry.slug);
            if (!deck || deck.cards.length === 0) continue;
            let learned = 0;
            let lastSeen = 0;
            let hasProgress = false;
            for (const card of deck.cards) {
                const state = cardStore.states[card.id];
                if (state) {
                    hasProgress = true;
                    if (state.box === BOX_COUNT) learned++;
                    if (state.lastSeen > lastSeen)
                        lastSeen = state.lastSeen;
                }
            }
            // Fully learned decks have nothing left to continue with.
            const allLearned = learned === deck.cards.length;
            if (hasProgress && !allLearned) {
                items.push({
                    slug: entry.slug,
                    name: entry.name,
                    folder: entry.folder,
                    deckType: entry.deckType,
                    learned,
                    total: deck.cards.length,
                    ratio: computeProgressRatio(
                        deck.cards,
                        cardStore.states,
                    ),
                    lastSeen,
                });
            }
        }
        return items.sort((a, b) => b.lastSeen - a.lastSeen);
    });

    // User-uploaded decks grouped by their folder, newest first within a folder.
    const folders = $derived.by(() => {
        const sorted = Object.values(userDecks.decks).sort(
            (a, b) => b.createdAt - a.createdAt,
        );
        const groups = new Map<
            string,
            { slug: string; name: string; count: number }[]
        >();
        for (const deck of sorted) {
            const list = groups.get(deck.folder) ?? [];
            list.push({
                slug: deck.slug,
                name: deck.name,
                count: userDecks.load(deck.slug)?.cards.length ?? 0,
            });
            groups.set(deck.folder, list);
        }
        return [...groups.entries()]
            .map(([folder, decks]) => ({ folder, decks }))
            .sort((a, b) => a.folder.localeCompare(b.folder));
    });
</script>

{#if ready}
    <Page>
        <ShareImport />

        <HomeIntro />

        <PageHeader
            title="Ordner"
            subtitle="Wähle einen Stapel zum Lernen."
            compact
        >
            {#snippet actions()}
                <div class="hero-meta">
                    <p class="hero-stats">
                        {totals.decks} Stapel · {countCards(totals.cards)}
                    </p>
                    <a class="upload-link" href={resolve("/upload")}>
                        Eigenen Stapel hochladen
                    </a>
                </div>
            {/snippet}
        </PageHeader>

        {#if inProgress.length > 0}
            <section class="continue-section" aria-label="Weiterlernen">
                <SectionLabel>Weiterlernen</SectionLabel>
                <div class="continue-grid">
                    {#each inProgress as item (item.slug)}
                        <ContinueCard
                            slug={item.slug}
                            name={item.name}
                            folder={item.folder}
                            deckType={item.deckType}
                            learned={item.learned}
                            total={item.total}
                            ratio={item.ratio}
                        />
                    {/each}
                </div>
            </section>
        {/if}

        {#if folders.length === 0}
            <EmptyNote>
                Keine Stapel gefunden.
                <a href={resolve("/upload")}>Lade einen eigenen Stapel hoch</a>.
            </EmptyNote>
        {/if}

        {#each folders as folder (folder.folder)}
            <FolderSection folder={folder.folder} decks={folder.decks} />
        {/each}
    </Page>
{/if}

<style>
    .hero-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.9rem;

        margin-bottom: 1.75rem;
    }

    .hero-stats {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.85rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
    }

    .upload-link {
        display: inline-flex;
        align-items: center;

        padding: 0.55rem 1.1rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-md);

        background: var(--surface);
        color: var(--text);

        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: none;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast);
    }

    .upload-link:hover {
        border-color: var(--border-strong);
        background: var(--surface-hover);
    }

    .continue-section {
        margin-bottom: 0.5rem;
    }

    .continue-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
        gap: 0.8rem;
    }
</style>
