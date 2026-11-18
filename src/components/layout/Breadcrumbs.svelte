<script lang="ts">
    import { resolve } from "$app/paths";
    import { route, type RouteKind } from "#components/model/route.svelte";
    import { decks } from "#components/model/decks.svelte";
    import { folderLabel } from "#components/model/deckView";

    const formatSlug = (slug: string) =>
        slug
            .split(/[-_]+/)
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

    let deck = $derived(route.deckSlug ? decks.load(route.deckSlug) : null);
    let deckName = $derived(deck?.name || formatSlug(route.deckSlug) || "Stapel");

    // Folder crumb is only known once the deck is loaded (user decks load
    // client-side, so it stays empty during SSR for uploaded decks).
    let deckFolder = $derived(deck ? folderLabel(deck.folders) : "");

    // Section crumb per deck sub-page kind.
    const SECTION_LABELS: Partial<Record<RouteKind, string>> = {
        cram: "Lernmodus",
        overview: "Übersicht",
        export: "Exportieren",
        edit: "Bearbeiten",
        print: "Drucken",
    };
    let sectionLabel = $derived(SECTION_LABELS[route.kind]);

    // Mobile app bar (≤700px): the current position next to the back
    // button replaces the breadcrumb path.
    let mobileTitle = $derived.by(() => {
        switch (route.kind) {
            case "cram":
                return `${deckName} · Lernmodus`;
            case "overview":
                return `${deckName} · Übersicht`;
            case "export":
                return `${deckName} · Exportieren`;
            case "edit":
                return `${deckName} · Bearbeiten`;
            case "print":
                return `${deckName} · Drucken`;
            case "deck":
            case "draft":
                return deckName;
            case "docs":
                return "Dokumentation";
            case "account":
                return "Konto";
            default:
                return "";
        }
    });
</script>

<nav class="breadcrumbs" aria-label="Brotkrumennavigation">
    <ol>
        <li>
            {#if route.isDeckSubPage}
                <a href={resolve("/")}>~</a>
            {:else}
                <span aria-current="page">~</span>
            {/if}
        </li>

        {#if route.isDeckSubPage && deckFolder}
            <li>
                <span class="separator" aria-hidden="true">/</span>
                <span class="breadcrumb-folder">{deckFolder}</span>
            </li>
        {/if}

        {#if route.kind === "deck" || route.kind === "draft"}
            <li>
                <span class="separator" aria-hidden="true">/</span>
                <span aria-current="page">{deckName}</span>
            </li>
        {:else if route.isDeckSubPage && sectionLabel}
            <li>
                <span class="separator" aria-hidden="true">/</span>
                <a href={resolve("/(deck)/deck/[slug]", { slug: route.deckSlug })}>{deckName}</a>
            </li>
            <li>
                <span class="separator" aria-hidden="true">/</span>
                <span aria-current="page">{sectionLabel}</span>
            </li>
        {:else if route.kind === "docs"}
            <li>
                <span class="separator" aria-hidden="true">/</span>
                <span aria-current="page">Dokumentation</span>
            </li>
        {:else if route.kind === "account"}
            <li>
                <span class="separator" aria-hidden="true">/</span>
                <span aria-current="page">Konto</span>
            </li>
        {/if}
    </ol>
</nav>

{#if mobileTitle}
    <span class="mobile-title">{mobileTitle}</span>
{/if}

<style lang="postcss">
    .breadcrumbs {
        flex: 1;
        min-width: 0;

        color: var(--text-muted);
        font-size: var(--fs-3);

        & ol {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.45rem;

            margin: 0;
            padding: 0;
            list-style: none;
        }

        & li {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;

            min-width: 0;
        }

        & a {
            color: var(--text-muted);
            text-decoration: none;
            transition: color var(--transition-fast);
        }
    }

    .breadcrumbs a:hover {
        color: var(--primary);
    }

    .breadcrumbs [aria-current="page"] {
        color: var(--text);
        font-weight: 600;
        overflow-wrap: anywhere;
    }

    .breadcrumbs .breadcrumb-folder {
        color: var(--text-muted);
        font-weight: 500;
        overflow-wrap: anywhere;
    }

    .breadcrumbs .separator {
        color: var(--border-strong);
        user-select: none;
    }

    /* Current position shown next to the back button on mobile. */
    .mobile-title {
        display: none;
        flex: 1;
        min-width: 0;

        overflow: hidden;
        color: var(--text);
        font-size: var(--fs-5);
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* Mobile app bar: the breadcrumb path wraps and would make the
       header too tall — the back button + title take over. */
    @media (max-width: 700px) {
        .breadcrumbs {
            display: none;
        }

        .mobile-title {
            display: block;
        }
    }
</style>
