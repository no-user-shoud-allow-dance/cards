<script lang="ts">
    import { page } from "$app/state";
    import { resolve } from "$app/paths";
    import type { Component } from "svelte";
    import Page from "#lib/components/shared/ui/Page.svelte";
    import ScreenHome from "#lib/components/docs/ScreenHome.svelte";
    import ScreenCram from "#lib/components/docs/ScreenCram.svelte";
    import ScreenOverview from "#lib/components/docs/ScreenOverview.svelte";
    import ScreenEdit from "#lib/components/docs/ScreenEdit.svelte";
    import ScreenExport from "#lib/components/docs/ScreenExport.svelte";
    import ScreenAccount from "#lib/components/docs/ScreenAccount.svelte";
    import SyncScan from "#lib/components/docs/SyncScan.svelte";
    import SyncLink from "#lib/components/docs/SyncLink.svelte";
    import ScreenUpload from "#lib/components/docs/ScreenUpload.svelte";
    import LeitnerBoxes from "#lib/components/docs/LeitnerBoxes.svelte";
    import ScreenFormat from "#lib/components/docs/ScreenFormat.svelte";
    import ScreenTerminal from "#lib/components/docs/ScreenTerminal.svelte";

    let { children } = $props();

    interface Shot {
        component: Component;
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
            component: ScreenHome,
            title: "Startseite",
            text: "„+“ bzw. „Stapel erstellen“ legt einen neuen Stapel an; jeder Kasten öffnet einen Stapel zum Lernen oder Verwalten.",
            doc: "01-was-ist-nsc",
        },
        leitner: {
            component: LeitnerBoxes,
            title: "Leitner-Boxen",
            text: "„Richtig“ schiebt die Karte eine Box weiter (I → VI, dann gelernt); „Falsch“ wirft sie zurück nach Box I.",
            doc: "03-lernen",
        },
        upload: {
            component: ScreenUpload,
            title: "Upload",
            text: "Markdown-Datei (.md) per Drag & Drop oder Dateiauswahl hochladen — der Sprachtyp wird automatisch erkannt.",
            doc: "02-loslegen",
        },
        edit: {
            component: ScreenEdit,
            title: "Editor",
            text: "Die Leiste oben fügt Formatierung ein (fett, kursiv, markiert …); der Stapel wird lokal im Browser gespeichert.",
            doc: "02-loslegen",
        },
        cram: {
            component: ScreenCram,
            title: "Lernmodus",
            text: "„Umdrehen“ zeigt die Antwort; „Falsch“ setzt die Karte zurück in Box I, „Richtig“ schiebt sie eine Box weiter. Der Timer zählt nur aktive Lernzeit.",
            doc: "03-lernen",
        },
        overview: {
            component: ScreenOverview,
            title: "Übersicht",
            text: "Eine Karte nach der anderen mit Vorder- und Rückseite — „Weiter“/„Zurück“ blättern, ohne den Lernfortschritt zu verändern.",
            doc: "03-lernen",
        },
        export: {
            component: ScreenExport,
            title: "Export & Teilen",
            text: "Link und QR-Code teilen Stapel oder Fortschritt; auf der Konto-Seite startet „Sync“ die direkte Geräte-Verbindung.",
            doc: "04-teilen-und-sync",
        },
        account: {
            component: ScreenAccount,
            title: "Konto",
            text: "Statistik und lokale Speicher auf einen Blick; „Synchronisieren“ startet Host oder Join, „Alle Daten löschen“ räumt das Gerät auf.",
            doc: "06-account",
        },
        format: {
            component: ScreenFormat,
            title: "Formatierung",
            text: "In Kartentexten: **fett**, *kursiv*, ++unterstrichen++, ==markiert==, `Code`, ^hoch^, ~tief~ — die Leiste oben fügt sie ein.",
            doc: "05-deck-format",
        },
        syncscan: {
            component: SyncScan,
            title: "Sync Schritt 1 — Pairing",
            text: "Das zweite Gerät scannt den QR-Code mit der Peer-ID („nsc-…“) oder fügt sie per Text ein.",
            showOnIndex: false,
            doc: "04-teilen-und-sync",
        },
        synclink: {
            component: SyncLink,
            title: "Sync Schritt 2 — Direktverbindung",
            text: "Danach tauschen die Geräte alle Stapel und den Fortschritt direkt und verschlüsselt per WebRTC aus — ohne Server dazwischen.",
            showOnIndex: false,
            doc: "04-teilen-und-sync",
        },
        terminal: {
            component: ScreenTerminal,
            title: "Terminal",
            text: "bun install && bun run dev — lokaler Dev-Server auf localhost:5173.",
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

    // On /docs the param is empty; on /docs/[slug] it is the chapter slug.
    const slug = $derived(page.params.slug ?? "");

    // The index page shows the shots as a table below the chapter list;
    // chapter pages keep the aside next to (resp. before, on phones) the text.
    const isIndex = $derived(!slug);

    // On the index, each shot links to its docs chapter; chapter pages stay static.
    function hrefFor(shot: Shot): string | null {
        if (!shot.doc) return null;
        return resolve("/docs/[slug]", { slug: shot.doc });
    }

    const shots = $derived.by(() => {
        if (!slug || !(slug in PER_PAGE)) {
            // Index page: all shots except chapter-specific ones.
            return Object.values(SHOTS).filter((s) => s.showOnIndex !== false);
        }
        return PER_PAGE[slug].map((key) => SHOTS[key]);
    });

    const asideTitle = $derived(
        slug && slug in PER_PAGE
            ? "Passend zu diesem Kapitel"
            : "Die App im Überblick",
    );
</script>

<Page>
    <div class="docs-grid" class:on-index={isIndex}>
        <div class="docs-main">
            {@render children()}
        </div>

        <aside class="docs-aside" class:on-index={isIndex} aria-label={asideTitle}>
            <p class="docs-aside-title">{asideTitle}</p>

            <div class="docs-shot-grid">
                {#each shots as shot (shot.title)}
                    {@const href = isIndex ? hrefFor(shot) : null}
                    <figure class="docs-shot">
                        {#if href}
                            <a
                                class="shot-link"
                                {href}
                                aria-label="Kapitel zu „{shot.title}“ öffnen"
                            >
                                <svelte:component this={shot.component} />
                            </a>
                        {:else}
                            <svelte:component this={shot.component} />
                        {/if}
                        <figcaption>
                            <strong>{shot.title}</strong>
                            — {shot.text}
                        </figcaption>
                    </figure>
                {/each}
            </div>

            {#if shots.length === 0}
                <p class="docs-aside-text">
                    Technisches Kapitel — ohne Screenshot.
                </p>
            {/if}
        </aside>
    </div>
</Page>

<style>
    .docs-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 2rem;
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
    }

    .shot-link {
        display: block;
        border-radius: var(--radius-md);
    }

    /* Stretch the link over the whole figure, so the caption is clickable too. */
    .shot-link::after {
        content: "";

        position: absolute;
        inset: 0;

        border-radius: var(--radius-md);
    }

    .shot-link:focus-visible {
        outline: 3px solid var(--focus-ring);
        outline-offset: 2px;
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

    .docs-grid.on-index .docs-shot {
        padding: 0.6rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
    }

    @media (min-width: 640px) {
        .docs-grid.on-index .docs-shot-grid {
            grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
        }
    }

    @keyframes shot-in {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .docs-shot figcaption {
        margin-top: 0.25rem;
        color: var(--text-muted);
        font-size: 0.78rem;
        line-height: 1.45;
    }

    .docs-shot figcaption strong {
        color: var(--text);
    }

    .docs-aside-title {
        margin: 0 0 0.75rem;
        font-size: 0.9rem;
        font-weight: 600;
    }

    .docs-aside-text {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.82rem;
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
        }

        .docs-grid.on-index .docs-aside {
            position: static;
        }
    }
</style>
