<script lang="ts">
    import { DECKS } from "#lib/decks/decks";
    import { getDeck } from "#lib/decks/loader";
    import { cardStore } from "#lib/store/store.svelte";
    import { BOX_COUNT, type DeckType } from "#lib/utils/types";
    import { computeProgressRatio, countCards } from "#lib/utils/pure";
    import FolderSection from "#lib/components/home/FolderSection.svelte";
    import ContinueCard from "#lib/components/home/ContinueCard.svelte";
    import ShareImport from "#lib/components/home/ShareImport.svelte";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import { resolve } from "$app/paths";
    import { slide } from "svelte/transition";
    import { onMount } from "svelte";

    const INTRO_STORAGE_KEY = "kk_intro_open";

    let introOpen = $state(true);
    let mounted = $state(false);

    // Restore the expanded/collapsed state from the last visit. Gated on
    // mounted so the server render and the first client render agree.
    onMount(() => {
        try {
            const saved = localStorage.getItem(INTRO_STORAGE_KEY);
            if (saved !== null) introOpen = saved === "true";
        } catch {
            /* ignore */
        }
        mounted = true;
    });

    const showIntro = $derived(mounted && introOpen);

    function toggleIntro(): void {
        introOpen = !introOpen;
        try {
            localStorage.setItem(INTRO_STORAGE_KEY, String(introOpen));
        } catch {
            /* ignore */
        }
    }

    const folders = DECKS.map((folder) => ({
        folder: folder.folder,
        decks: folder.decks.map((deck) => ({
            slug: deck.slug,
            name: deck.name,
            count: getDeck(deck.slug)?.cards.length ?? 0,
        })),
    }));

    // All decks — bundled and user-uploaded — for totals and "Weiterlernen".
    const allEntries = $derived.by(() => {
        const entries: {
            folder: string;
            slug: string;
            name: string;
            deckType: DeckType;
        }[] = [];
        for (const folder of DECKS) {
            for (const deck of folder.decks) {
                entries.push({
                    folder: folder.folder,
                    slug: deck.slug,
                    name: deck.name,
                    deckType: deck.deckType,
                });
            }
        }
        for (const deck of Object.values(userDecks.decks)) {
            entries.push({
                folder: deck.folder,
                slug: deck.slug,
                name: deck.name,
                deckType: deck.deckType,
            });
        }
        return entries;
    });

    // Totals shown in the page header.
    const totals = $derived.by(() => {
        let cards = 0;
        for (const entry of allEntries) {
            cards += getDeck(entry.slug)?.cards.length ?? 0;
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
            const deck = getDeck(entry.slug);
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
    const userFolders = $derived.by(() => {
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
                count: getDeck(deck.slug)?.cards.length ?? 0,
            });
            groups.set(deck.folder, list);
        }
        return [...groups.entries()]
            .map(([folder, decks]) => ({ folder, decks }))
            .sort((a, b) => a.folder.localeCompare(b.folder));
    });

    // Bundled and user-uploaded decks share one section per folder name.
    const allFolders = $derived.by(() => {
        const byFolder = new Map<
            string,
            { slug: string; name: string; count: number }[]
        >();
        for (const folder of folders) {
            byFolder.set(folder.folder, [...folder.decks]);
        }
        for (const group of userFolders) {
            const list = byFolder.get(group.folder) ?? [];
            list.push(...group.decks);
            byFolder.set(group.folder, list);
        }
        return [...byFolder.entries()].map(([folder, decks]) => ({
            folder,
            decks,
        }));
    });
</script>

<div class="page">
    <ShareImport />

    <section class="intro" aria-label="NSC">
        <div class="intro-box">
            <button
                class="intro-header"
                class:intro-header--open={showIntro}
                onclick={toggleIntro}
                aria-expanded={showIntro}
            >
                <span class="intro-title">NSC</span>
                <span class="intro-chevron" aria-hidden="true">▾</span>
            </button>
            {#if showIntro}
                <div class="intro-body" transition:slide={{ duration: 200 }}>
                    <p>
                        Lerne mit Karteikarten in Ordnern und Stapeln. Jeder Stapel
                        durchläuft drei Phasen:
                        <br />
                        <span class="term term--overview">Übersicht</span>,
                        <span class="term term--primary">Lernen</span> und
                        <span class="term term--success">Gelernt</span>.
                    </p>
                    <hr />
                    <p>
                        In der <span class="term term--overview">Übersicht</span> siehst
                        du alle Karten mit direkt eingeblendeter Antwort.
                    </p>
                    <p>
                        Beim <span class="term term--primary">Lernen</span>
                        bewertest du jede Karte nach dem Leitner-System – von
                        <span class="term term--primary">I</span>
                        bis <span class="term term--primary">VI</span> und dann in
                        <span class="term term--success">Gelernt</span>. Falsch
                        beantwortete Karten rutschen zurück in
                        <span class="term term--primary">I</span>. Ein optionaler
                        Timer sorgt für Pausen.
                    </p>
                    <p>
                        Sind alle Karten <span class="term term--success"
                            >Gelernt</span
                        >, kannst du den Fortschritt jederzeit zurücksetzen und von
                        vorne beginnen.
                    </p>
                </div>
            {/if}
        </div>
    </section>

    <header class="hero">
        <h1>Ordner</h1>
        <p class="subtitle">Wähle einen Stapel zum Lernen.</p>
        <div class="hero-meta">
            <p class="hero-stats">
                {totals.decks} Stapel · {countCards(totals.cards)}
            </p>
            <a class="upload-link" href={resolve("/upload")}>
                Eigenen Stapel hochladen
            </a>
        </div>
    </header>

    {#if inProgress.length > 0}
        <section class="continue-section" aria-label="Weiterlernen">
            <h2 class="section-label">Weiterlernen</h2>
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

    {#if allFolders.length === 0}
        <p class="empty">
            Keine Stapel gefunden. <a href={resolve("/upload")}
                >Lade einen eigenen Stapel hoch</a
            >.
        </p>
    {/if}

    {#each allFolders as folder (folder.folder)}
        <FolderSection folder={folder.folder} decks={folder.decks} />
    {/each}
</div>

<style>
    .hero .subtitle {
        margin-bottom: 0.35rem;
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

    .intro {
        margin-bottom: 2rem;
    }

    .intro-box {
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        overflow: hidden;
    }

    .intro-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;

        padding: 0.55rem 1.25rem;

        border: 0;
        border-bottom: 1px solid var(--border);

        background: var(--surface-soft);

        cursor: pointer;
        text-align: left;

        transition: background var(--transition-fast);
    }

    .intro-header:hover {
        background: var(--surface-hover);
    }

    .intro-header--open {
        border-bottom-color: var(--border);
    }

    .intro-box:not(:has(.intro-body)) .intro-header {
        border-bottom: 0;
    }

    .intro-chevron {
        color: var(--text-muted);
        font-size: 0.7rem;

        transition: transform var(--transition-fast);
    }

    .intro-header--open .intro-chevron {
        transform: rotate(180deg);
    }

    .intro-title {
        font-family: var(--font-sans);
        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        line-height: 1.4;
        text-transform: uppercase;
    }

    .intro-body {
        padding: 1.1rem 1.25rem 1.25rem;
    }

    .intro-body p {
        margin: 0;

        font-size: 0.95rem;
        line-height: 1.75;
    }

    .intro-body p + p {
        margin-top: 0.75rem;
    }

    .intro-body hr {
        margin: 1rem 0;

        border: 0;
        border-top: 1px solid var(--border);
    }

    .term {
        display: inline-block;

        margin: 0 0.15rem;
        padding: 0.05rem 0.55rem;

        border-radius: var(--radius-pill);

        font-size: 0.85em;
        font-weight: 700;
        white-space: nowrap;
    }

    .term--overview {
        background: var(--overview-soft);
        color: var(--overview);
    }

    .term--primary {
        background: var(--primary-soft);
        color: var(--primary);
    }

    .term--success {
        background: var(--success-bg);
        color: var(--success-text);
    }
</style>
