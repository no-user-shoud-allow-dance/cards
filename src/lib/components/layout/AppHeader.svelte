<script lang="ts">
    import { cardStore } from "#lib/store/store.svelte";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import { page } from "$app/state";
    import { resolve } from "$app/paths";
    import Toggle from "../shared/Toggle.svelte";

    const formatSlug = (slug: string) =>
        slug
            .split(/[-_]+/)
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

    let routePath = $derived(page.url.pathname);
    let isDeckPage = $derived(routePath.startsWith("/deck/"));
    let isCramPage = $derived(routePath.startsWith("/cram/"));
    let isOverviewPage = $derived(routePath.startsWith("/overview/"));
    let slug = $derived(page.params.slug ?? "");
    let deck = $derived(slug ? userDecks.load(slug) : null);

    let deckName = $derived(
        deck?.name || formatSlug(slug) || "Stapel",
    );

    // Folder crumb is only known once the deck is loaded (user decks load
    // client-side, so it stays empty during SSR for uploaded decks).
    let deckFolder = $derived(deck?.folder ?? "");

    // The deck defines whether a pure mode exists for it.
    let pureModeAvailable = $derived(deck?.pureMode ?? false);
</script>

<header class="app-header">
    <a class="brand" href={resolve("/")} aria-label="NSC – zur Startseite">
        <span class="brand-mark" aria-hidden="true">
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
            >
                <rect
                    x="3.2"
                    y="6.2"
                    width="11.5"
                    height="14.5"
                    rx="2.6"
                    transform="rotate(-8 8.95 13.45)"
                    stroke="currentColor"
                    stroke-width="1.8"
                />
                <rect
                    x="9.3"
                    y="3.8"
                    width="11.5"
                    height="14.5"
                    rx="2.6"
                    transform="rotate(8 15.05 11.05)"
                    fill="rgb(255 255 255 / 22%)"
                    stroke="currentColor"
                    stroke-width="1.8"
                />
            </svg>
        </span>
    </a>

    <nav class="breadcrumbs" aria-label="Brotkrumennavigation">
        <ol>
            <li>
                {#if isDeckPage || isCramPage || isOverviewPage}
                    <a href={resolve("/")}>~</a>
                {:else}
                    <span aria-current="page">~</span>
                {/if}
            </li>

            {#if (isDeckPage || isCramPage || isOverviewPage) && deckFolder}
                <li>
                    <span class="separator" aria-hidden="true">/</span>
                    <span class="breadcrumb-folder">{deckFolder}</span>
                </li>
            {/if}

            {#if isDeckPage}
                <li>
                    <span class="separator" aria-hidden="true">/</span>
                    <span aria-current="page">{deckName}</span>
                </li>
            {:else if isCramPage}
                <li>
                    <span class="separator" aria-hidden="true">/</span>
                    <a href={resolve("/(deck)/deck/[slug]", { slug })}>{deckName}</a>
                </li>
                <li>
                    <span class="separator" aria-hidden="true">/</span>
                    <span aria-current="page">Lernmodus</span>
                </li>
            {:else if isOverviewPage}
                <li>
                    <span class="separator" aria-hidden="true">/</span>
                    <a href={resolve("/(deck)/deck/[slug]", { slug })}>{deckName}</a>
                </li>
                <li>
                    <span class="separator" aria-hidden="true">/</span>
                    <span aria-current="page">Übersicht</span>
                </li>
            {/if}
        </ol>
    </nav>

    {#if pureModeAvailable}
        <Toggle
            label="Pur-Modus"
            checked={cardStore.pureMode}
            onchange={(value) => cardStore.setPureMode(value)}
        />
    {/if}
</header>

<style>
    .brand {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 0.55rem;

        color: var(--text);
        text-decoration: none;
    }

    .brand-mark {
        display: grid;
        place-items: center;

        width: 1.95rem;
        height: 1.95rem;

        border: 1px solid var(--border-strong);
        border-radius: var(--radius-md);
        background: var(--surface);

        color: var(--primary);
    }

    .breadcrumbs {
        flex: 1;
        min-width: 0;

        color: var(--text-muted);
        font-size: 0.85rem;
    }

    .breadcrumbs ol {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.45rem;

        margin: 0;
        padding: 0;
        list-style: none;
    }

    .breadcrumbs li {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;

        min-width: 0;
    }

    .breadcrumbs a {
        color: var(--text-muted);
        text-decoration: none;
        transition: color var(--transition-fast);
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

    @media (max-width: 540px) {
        .breadcrumbs {
            padding-inline: 1rem;
        }
    }

    .app-header {
        position: sticky;
        top: 0;
        z-index: 10;

        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-direction: row;
        flex-wrap: nowrap;
        gap: 1rem;

        width: 100%;
        min-height: 3.5rem;
        padding: 0.7rem
            max(1rem, calc((100vw - var(--content-width)) / 2 + 1.5rem));

        background: var(--surface);
        border-bottom: 1px solid var(--border);
    }
</style>
