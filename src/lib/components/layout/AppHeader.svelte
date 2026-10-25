<script lang="ts">
    import { cardStore } from "#lib/store/store.svelte";
    import { getDeck } from "#lib/decks/loader";
    import { page } from "$app/state";
    import { resolve } from "$app/paths";

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
    let deck = $derived(slug ? getDeck(slug) : null);

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
    <a class="brand" href={resolve("/")}>
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
        <!-- <span class="brand-name">NSC</span> -->
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
                    <a href={resolve("/deck/[slug]", { slug })}>{deckName}</a>
                </li>
                <li>
                    <span class="separator" aria-hidden="true">/</span>
                    <span aria-current="page">Lernmodus</span>
                </li>
            {:else if isOverviewPage}
                <li>
                    <span class="separator" aria-hidden="true">/</span>
                    <a href={resolve("/deck/[slug]", { slug })}>{deckName}</a>
                </li>
                <li>
                    <span class="separator" aria-hidden="true">/</span>
                    <span aria-current="page">Übersicht</span>
                </li>
            {/if}
        </ol>
    </nav>

    {#if pureModeAvailable}
        <label class="pure-toggle">
            <input
                type="checkbox"
                checked={cardStore.pureMode}
                onchange={(e) => cardStore.setPureMode(e.currentTarget.checked)}
            />
            <span>Pur-Modus</span>
        </label>
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

    .brand-name {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        
        font-size: 0.95rem;
        font-weight: 600;
        letter-spacing: -0.01em;

        width: 0px;
        overflow: hidden;
        transition: 0.3s width ease;
    }

    .brand:hover .brand-name, .brand-name:hover {
        width: 2.3rem;
    }

    @media (max-width: 640px) {
        .brand-name {
            display: none;
        }
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

    .pure-toggle {
        display: inline-flex;
        align-items: center;
        gap: 0.65rem;

        color: var(--text-muted);
        font-size: 0.875rem;
        font-weight: 500;

        cursor: pointer;
        user-select: none;
    }

    /* Custom switch, while preserving the native checkbox interaction. */

    .pure-toggle input {
        position: relative;
        appearance: none;
        flex: 0 0 auto;

        width: 2.1rem;
        height: 1.2rem;
        margin: 0;

        border: 1px solid var(--border-strong);
        border-radius: var(--radius-pill);
        background: var(--surface-soft);

        cursor: pointer;
        transition:
            background var(--transition-fast),
            border-color var(--transition-fast);
    }

    .pure-toggle input::after {
        position: absolute;
        top: 2px;
        left: 2px;

        width: 0.78rem;
        height: 0.78rem;

        border-radius: 50%;
        transform: translateY(1px);

        background: var(--text-muted);
        content: "";
        transition:
            transform var(--transition-fast),
            background var(--transition-fast);
    }

    .pure-toggle input:checked {
        border-color: var(--primary);
        background: var(--primary);
    }

    .pure-toggle input:checked::after {
        transform: translateX(0.9rem) translateY(1px);
        background: var(--primary-text);
    }

    .pure-toggle input:focus-visible {
        outline: 3px solid var(--focus-ring);
        outline-offset: 3px;
    }
</style>
