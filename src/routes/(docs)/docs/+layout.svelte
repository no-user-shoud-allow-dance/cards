<script lang="ts">
    import { page } from "$app/state";
    import { resolve } from "$app/paths";
    import { Page, chapterMeta, neighbors, routeIdOf } from "#components";

    let { children, data } = $props();

    interface Shot {
        /** File in static/docs, inlined via {@html} (key of data.shotSvgs). */
        svg: string;
        title: string;
        text: string;
        /** False = only shown on its chapter page, not on the /docs index. */
        showOnIndex?: boolean;
        /** Docs chapter the shot links to on the index (e.g. "03-lernen"). */
        doc?: string;
    }

    // Animierte Mini-"Screenshots" der App-Seiten — mit Erklärung, was die
    // konkreten Schaltflächen tun. Die Reihenfolge folgt dem Kapitelverlauf
    // (01 was ist NSC → 05 Deck-Format), damit die Index-Seite wie ein
    // Mini-Inhaltsverzeichnis gelesen wird.
    const SHOTS: Record<string, Shot> = {
        home: {
            svg: "ScreenHome.svg",
            title: "Startseite",
            text: "„+“ bzw. „Stapel erstellen“ legt einen neuen Stapel an; jeder Kasten öffnet einen Stapel zum Lernen oder Verwalten.",
            doc: "01-was-ist-nsc",
        },
        leitner: {
            svg: "LeitnerBoxes.svg",
            title: "Leitner-Boxen",
            text: "„Richtig“ schiebt die Karte eine Box weiter (I → VI, dann gelernt); „Falsch“ wirft sie zurück nach Box I.",
            doc: "03-lernen",
        },
        upload: {
            svg: "ScreenUpload.svg",
            title: "Upload",
            text: "Markdown-Datei (.md) per Drag & Drop oder Datesauswahl hochladen – der Sprachtyp wird automatisch erkannt.",
            doc: "02-loslegen",
        },
        edit: {
            svg: "ScreenEdit.svg",
            title: "Editor",
            text: "Die Leiste oben fügt Formatierung ein (fett, kursiv, markiert …); der Stapel wird lokal im Browser gespeichert.",
            doc: "02-loslegen",
        },
        cram: {
            svg: "ScreenCram.svg",
            title: "Lernmodus",
            text: "„Umdrehen“ zeigt die Antwort; „Falsch“ setzt die Karte zurück in Box I, „Richtig“ schiebt sie eine Box weiter. Deine aktive Lernzeit zählt mit.",
            doc: "03-lernen",
        },
        overview: {
            svg: "ScreenOverview.svg",
            title: "Übersicht",
            text: "Eine Karte nach der anderen mit Vorder- und Rückseite – „Weiter“/„Zurück“ blättern, ohne den Lernfortschritt zu verändern.",
            doc: "03-lernen",
        },
        export: {
            svg: "ScreenExport.svg",
            title: "Export & Teilen",
            text: "Link und QR-Code teilen Stapel oder Fortschritt; auf der Konto-Seite startet „Sync“ die direkte Geräte-Verbindung.",
            doc: "04-teilen-und-sync",
        },
        account: {
            svg: "ScreenAccount.svg",
            title: "Konto",
            text: "Statistik und lokale Speicher auf einen Blick; „Synchronisieren“ startet Host oder Join, „Alle Daten löschen“ räumt das Gerät auf.",
            doc: "06-account",
        },
        format: {
            svg: "ScreenFormat.svg",
            title: "Formatierung",
            text: "In Kartentexten: **fett**, *kursiv*, ++unterstrichen++, ==markiert==, `Code`, ^hoch^, ~tief~ – die Leiste oben fügt sie ein.",
            doc: "05-deck-format",
        },
        syncscan: {
            svg: "SyncScan.svg",
            title: "Sync Schritt 1 – Pairing",
            text: "Das zweite Gerät scannt den QR-Code mit der Peer-ID („nsc-…“) oder fügt sie per Text ein.",
            showOnIndex: false,
            doc: "04-teilen-und-sync",
        },
        synclink: {
            svg: "SyncLink.svg",
            title: "Sync Schritt 2 – Direktverbindung",
            text: "Danach tauschen die Geräte alle Stapel und den Fortschritt direkt und verschlüsselt per WebRTC aus – ohne Server dazwischen.",
            showOnIndex: false,
            doc: "04-teilen-und-sync",
        },
        terminal: {
            svg: "ScreenTerminal.svg",
            title: "Terminal",
            text: "bun install && bun run dev – lokaler Dev-Server auf localhost:5173.",
            showOnIndex: false,
        },
    };

    // Welche Screenshots zum jeweiligen Kapitel passen; die Indexseite
    // (/docs) zeigt alle.
    const PER_PAGE: Record<string, string[]> = {
        "01-was-ist-nsc": ["home", "leitner"],
        "02-loslegen": ["edit", "upload"],
        "03-lernen": ["cram", "overview", "leitner"],
        "04-teilen-und-sync": ["export", "syncscan", "synclink"],
        "05-deck-format": ["edit", "format"],
        "06-account": ["account", "syncscan", "synclink"],
        "07-entwickler": ["terminal"],
    };

    // "/docs" is the index (slug ""), "/docs/03-lernen" is the chapter
    // "03-lernen" — each chapter is its own route folder with a thin +page.svelte wrapper.
    const slug = $derived(page.url.pathname.split("/").filter(Boolean)[1] ?? "");

    // The index page shows the shots as a table below the chapter list;
    // chapter pages keep the aside next to (resp. before, on phones) the text.
    const isIndex = $derived(slug === "");

    // Chapter chrome (header, pager) comes from the registry, so it always
    // matches the chapter frontmatter of the current chapter.
    const meta = $derived(chapterMeta(slug));
    const pager = $derived(neighbors(slug));

    const shots = $derived.by(() => {
        if (!slug || !(slug in PER_PAGE)) {
            // Index page: all shots except chapter-specific ones.
            return Object.values(SHOTS).filter((s) => s.showOnIndex !== false);
        }
        return PER_PAGE[slug].map((key) => SHOTS[key]);
    });

    const asideTitle = $derived(
        slug && slug in PER_PAGE ? "Passend zu diesem Kapitel" : "Die App im Überblick"
    );
</script>

<svelte:head>
    {#if !isIndex}
        <title>{meta.title} – NSC</title>
        {#if meta.description}
            <meta name="description" content={meta.description} />
        {/if}
    {/if}
</svelte:head>

<Page>
    <div class="docs-grid" class:on-index={isIndex}>
        <div class="docs-main">
            {#if !isIndex}
                <header class="doc-header" class:with-icon={meta.icon !== ""}>
                    {#if meta.icon}
                        <img class="doc-icon" src={meta.icon} alt="" width="56" height="56" />
                    {/if}
                    <h1 class="doc-title">{meta.title}</h1>
                    {#if meta.description}
                        <p class="doc-subtitle">{meta.description}</p>
                    {/if}
                </header>

                <p class="docs-back">
                    <a href={resolve("/(docs)/docs")}>← Alle Kapitel</a>
                </p>

                <article class="docs-content">
                    {@render children()}
                </article>

                <nav class="docs-pager" aria-label="Weitere Kapitel">
                    {#if pager.prev}
                        <a
                            class="pager-link"
                            href={resolve(routeIdOf(pager.prev.slug) as "/(docs)/docs")}
                        >
                            ← {pager.prev.title}
                        </a>
                    {:else}
                        <span></span>
                    {/if}
                    <a class="pager-all" href={resolve("/(docs)/docs")}>Alle Kapitel</a>
                    {#if pager.next}
                        <a
                            class="pager-link"
                            href={resolve(routeIdOf(pager.next.slug) as "/(docs)/docs")}
                        >
                            {pager.next.title} →
                        </a>
                    {:else}
                        <span></span>
                    {/if}
                </nav>
            {:else}
                {@render children()}
            {/if}
        </div>

        <!-- IMPORTANT : DISPLAY NONE -->
        <aside
            style="display: none;"
            class="docs-aside"
            class:on-index={isIndex}
            aria-label={asideTitle}
        >
            <p class="docs-aside-title">{asideTitle}</p>

            <div class="docs-shot-grid">
                {#each shots as shot (shot.title)}
                    {@const doc = isIndex ? shot.doc : undefined}
                    <figure class="docs-shot">
                        {#if doc}
                            <a
                                class="shot-link"
                                href={resolve(routeIdOf(doc) as "/(docs)/docs")}
                                aria-label="Kapitel zu „{shot.title}“ öffnen"
                            >
                                <!-- trusted build-time assets from static/docs, read by +layout.server.ts -->
                                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                                {@html data.shotSvgs[shot.svg]}
                            </a>
                        {:else}
                            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                            {@html data.shotSvgs[shot.svg]}
                        {/if}
                        <figcaption>
                            <strong>{shot.title}</strong>
                            – {shot.text}
                        </figcaption>
                    </figure>
                {/each}
            </div>

            {#if shots.length === 0}
                <p class="docs-aside-text">Technisches Kapitel – ohne Screenshot.</p>
            {/if}
        </aside>
    </div>
</Page>

<style lang="postcss">
    /* Grid layout: the icon spans both rows in the first column; the
       title sits in row 1 / column 2, the description in row 2 / column 2.
       The bottom spacing lives on the header, not the subtitle, so it
       does not inflate the second row and push the icon down. */
    .doc-header {
        margin: 0 0 1.75rem;

        &.with-icon {
            display: grid;
            grid-template-columns: auto 1fr;
            grid-template-rows: auto auto;
            align-items: center;
            column-gap: 1rem;
        }
    }

    .doc-icon {
        grid-row: 1 / 3;
        grid-column: 1;

        width: 3.5rem;
        height: 3.5rem;
    }

    .doc-title {
        grid-row: 1;
        grid-column: 2;

        margin: 0 0 0.4rem;
        font-size: clamp(1.7rem, 3dvw, 2.1rem);
        font-weight: 600;
        letter-spacing: -0.01em;
        line-height: 1.2;
    }

    .doc-subtitle {
        grid-row: 2;
        grid-column: 2;

        margin: 0;
        color: var(--text-muted);
        font-size: var(--fs-5);
    }

    @media (max-width: 540px) {
        .doc-header.with-icon {
            column-gap: 0.75rem;
        }

        .doc-icon {
            width: 2.75rem;
            height: 2.75rem;
        }
    }

    .docs-back {
        margin: 0 0 1.25rem;
        font-size: var(--fs-4);

        & a {
            color: var(--primary);
            text-decoration: none;
        }
    }

    .docs-back a:hover {
        text-decoration: underline;
    }

    .docs-pager {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;

        margin-top: 2.5rem;
        padding-top: 1.25rem;
        border-top: 1px solid var(--border);

        & a {
            color: var(--primary);
            font-size: var(--fs-4);
            text-decoration: none;
        }
    }

    .docs-pager a:hover {
        text-decoration: underline;
    }

    .pager-link {
        max-width: 40%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .pager-all {
        flex: 0 0 auto;
        color: var(--text-muted);
    }

    .docs-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 2rem;

        &.on-index .docs-shot {
            padding: 0.6rem;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
        }
    }

    .docs-aside {
        align-self: start;

        /* On phones the aside (with the chapter's animated shots) comes
           before the page header — chapter pages only; the index overrides
           this below. On desktop it sits in the right column. */
        order: -1;

        padding: 1rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        background: var(--surface);
        box-shadow: var(--shadow-card);
    }

    .docs-shot-grid {
        display: grid;
        gap: 0.9rem;
    }

    .docs-shot {
        position: relative;

        margin: 0;
        animation: shot-in 0.45s var(--transition-spring) both;

        & figcaption {
            margin-top: 0.25rem;
            color: var(--text-muted);
            font-size: var(--fs-2);
            line-height: 1.45;
        }
    }

    .shot-link {
        display: block;
        border-radius: var(--radius-md);

        &:focus-visible {
            outline: 3px solid var(--focus-ring);
            outline-offset: 2px;
        }
    }

    /* Stretch the link over the whole figure, so the caption is clickable too. */
    .shot-link::after {
        content: "";

        position: absolute;
        inset: 0;

        border-radius: var(--radius-md);
    }

    /* On the index the shots are bordered cells — highlight the hovered one. */
    .docs-grid.on-index .docs-shot:has(.shot-link:hover) {
        border-color: var(--primary);
    }

    /* Index page: the aside follows the chapter list and the shots become
       a table-like grid of bordered cells. */
    .docs-grid.on-index .docs-aside {
        order: 0;
    }

    @media (min-width: 640px) {
        .docs-grid.on-index .docs-shot-grid {
            grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
        }
    }

    @keyframes shot-in {
        from {
            opacity: 0;
            transform: translateY(8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .docs-shot figcaption strong {
        color: var(--text);
    }

    .docs-aside-title {
        margin: 0 0 0.75rem;
        font-size: var(--fs-4);
        font-weight: 600;
    }

    .docs-aside-text {
        margin: 0;
        color: var(--text-muted);
        font-size: var(--fs-3);
    }

    @media (min-width: 960px) {
        .docs-grid {
            grid-template-columns: minmax(0, 1fr) 15rem;
        }

        .docs-aside {
            order: 0;
            position: sticky;
            top: calc(var(--header-h) + 1.5rem);
        }

        /* On the index the aside is a full-width section below the list. */
        .docs-grid.on-index {
            grid-template-columns: minmax(0, 1fr);

            & .docs-aside {
                position: static;
            }
        }
    }
</style>
