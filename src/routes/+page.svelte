<script lang="ts">
    import { onMount } from "svelte";
    import { cardStore } from "#lib/stores/persistent/cardStore.svelte";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import { BOX_COUNT, type DeckType } from "#lib/types";
    import { computeProgressRatio, countCards } from "#lib/utils/pure";
    import { parseDeck } from "#lib/utils/parser";
    import { guessDeckType } from "#lib/utils/deckTypes";
    import { dialogStore } from "#lib/stores/session/dialogStore.svelte";
    import { toastStore } from "#lib/stores/session/toastStore.svelte";
    import { resolve } from "$app/paths";
    import Page from "#lib/components/shared/ui/Page.svelte";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import SectionLabel from "#lib/components/shared/ui/SectionLabel.svelte";
    import FolderSection from "#lib/components/home/FolderSection.svelte";
    import ContinueCard from "#lib/components/home/ContinueCard.svelte";
    import ShareImport from "#lib/components/sharing/ShareImport.svelte";
    import Card from "#lib/components/shared/ui/Card.svelte";
    import Button from "#lib/components/shared/ui/Button.svelte";

    // Decks live only in this browser (IndexedDB); wait for them before
    // rendering so the server render and the first client render agree.
    let ready = $state(false);

    onMount(() => {
        decks.init().then(() => {
            ready = true;
            void maybeOfferSampleDeck();
        });
    });

    // Session-only flag so the offer appears at most once per tab session.
    const SAMPLE_FLAG = "nsc_sample_dialog_shown";

    // Empty-state offer: import a sample deck that shows what the app can do.
    async function maybeOfferSampleDeck(): Promise<void> {
        if (Object.keys(decks.decks).length > 0) return;
        if (sessionStorage.getItem(SAMPLE_FLAG) === "1") return;
        sessionStorage.setItem(SAMPLE_FLAG, "1");

        const ok = await dialogStore.open({
            title: "Noch keine Stapel",
            message:
                "Hi! Es sieht so aus, als hättest du noch keine Karten. Möchtest du einen Beispiel-Stapel importieren, der zeigt, was diese App kann?",
            confirmLabel: "Beispiel-Stapel importieren",
            cancelLabel: "Später",
            bg: "info",
        });
        if (!ok) return;

        try {
            const res = await fetch("/sample-deck.md");
            if (!res.ok) throw new Error(String(res.status));
            const raw = await res.text();
            const parsed = parseDeck(raw);
            await decks.add(
                raw,
                "Beispiel",
                parsed.title ?? "Beispiel-Stapel",
                guessDeckType(raw),
            );
            toastStore.success(
                "Beispiel-Stapel importiert — viel Spaß beim Lernen!",
            );
        } catch {
            toastStore.error("Der Beispiel-Stapel konnte nicht geladen werden.");
        }
    }

    // All decks are user-uploaded, for totals and "Weiterlernen".
    const allEntries = $derived(
        Object.values(decks.decks).map((deck) => ({
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
            cards += decks.load(entry.slug)?.cards.length ?? 0;
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
            const deck = decks.load(entry.slug);
            if (!deck || deck.cards.length === 0) continue;
            let learned = 0;
            let lastSeen = 0;
            let hasProgress = false;
            for (const card of deck.cards) {
                const state = cardStore.states[card.id];
                if (state) {
                    hasProgress = true;
                    if (state.box === BOX_COUNT) learned++;
                    if (state.lastSeen > lastSeen) lastSeen = state.lastSeen;
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
                    ratio: computeProgressRatio(deck.cards, cardStore.states),
                    lastSeen,
                });
            }
        }
        return items.sort((a, b) => b.lastSeen - a.lastSeen);
    });

    // User-uploaded decks grouped by their folder, newest first within a folder.
    const folders = $derived.by(() => {
        const sorted = Object.values(decks.decks).sort(
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
                count: decks.load(deck.slug)?.cards.length ?? 0,
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
        <img
            class="banner"
            src="/banner.svg"
            alt="NSC – Banner mit wabernden Formen und Karteikarten"
            width="1280"
            height="480"
        />

        <ShareImport />

        <Card href={resolve("/docs")} hover bg="primary" class="docs-card">
            <div class="docs-card-body">
                <div class="docs-card-texts">
                    <span class="docs-card-title">Dokumentation</span>
                    <span class="docs-card-text">
                        So funktioniert NSC — einfach erklärt, inklusive
                        technischem Hintergrund für Entwickler:innen.
                    </span>
                </div>
                <span class="docs-card-arrow" aria-hidden="true">→</span>
            </div>
        </Card>

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
                    <Button href={resolve("/(io)/create")}>
                        Stapel erstellen
                    </Button>
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
            <p class="empty">
                Keine Stapel gefunden.
                <a href={resolve("/(io)/upload")}
                    >Lade einen eigenen Stapel hoch</a
                >.
            </p>
        {/if}

        {#each folders as folder (folder.folder)}
            <FolderSection folder={folder.folder} decks={folder.decks} />
        {/each}
    </Page>
{/if}

<style>
    /* The class lands on the Card root (a child component), so :global.
       The hover border needs to out-specify Card's own .card.hover:hover. */
    :global(.docs-card) {
        margin-bottom: 2rem;
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
        font-size: 0.9rem;
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

    .banner {
        display: block;
        width: 100%;
        height: auto;

        margin-bottom: 1.75rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-card);
    }

    @media (max-width: 540px) {
        .banner {
            margin-bottom: 1.25rem;
        }
    }

    .empty {
        margin: 1rem 0;
        color: var(--text-muted);
        font-size: 0.95rem;
    }

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

    .continue-section {
        margin-bottom: 0.5rem;
    }

    .continue-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
        gap: 0.8rem;
    }
</style>
