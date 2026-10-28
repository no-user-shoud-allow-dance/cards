<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { resolve } from "$app/paths";
    import { decks } from "#lib/stores/data/deckStore.svelte";
    import Page from "#lib/components/shared/Page.svelte";

    let { children } = $props();

    // Decks live only in this browser (IndexedDB); wait for them so the
    // pages never render against an empty store.
    let ready = $state(false);

    onMount(() => {
        decks.init().then(() => {
            ready = true;
        });
    });

    // Route ids include the (io) group; the URLs do not. Import tabs
    // carry the "receiving" color (green); upload stays neutral.
    const tabs = [
        {
            href: resolve("/(io)/upload"),
            label: "Hochladen",
            kind: "upload",
        },
        {
            href: resolve("/(io)/import"),
            label: "Importieren",
            kind: "import",
        },
    ];
</script>

{#if ready}
    <Page>
        <nav class="io-tabs" aria-label="Hochladen und importieren">
            {#each tabs as tab (tab.href)}
                <a
                    class="io-tab"
                    class:import={tab.kind === "import"}
                    class:active={page.url.pathname === tab.href}
                    href={tab.href}
                    aria-current={page.url.pathname === tab.href
                        ? "page"
                        : undefined}
                >
                    {tab.label}
                </a>
            {/each}
        </nav>
        {@render children()}
    </Page>
{/if}

<style>
    /* Segmented tabs in the NSC-Intro look: one bordered box with soft
       segments (like the intro dropdown on the home page) — but plain
       tabs, no collapsible dropdown. */
    .io-tabs {
        display: flex;

        margin-bottom: 2rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);

        background: var(--surface);
        box-shadow: var(--shadow-card);

        overflow: hidden;
    }

    .io-tab {
        flex: 1 1 0;
        min-width: 0;

        padding: 0.55rem 1.25rem;

        border: 0;
        border-right: 1px solid var(--border);

        background: transparent;
        color: var(--text-muted);

        font-size: 0.85rem;
        font-weight: 600;
        text-align: center;
        text-decoration: none;

        transition:
            background var(--transition-fast),
            color var(--transition-fast);
    }

    .io-tab:last-child {
        border-right: 0;
    }

    .io-tab:hover {
        background: var(--surface-hover);
        color: var(--text);
    }

    .io-tab.active {
        background: var(--surface-soft);
        color: var(--text);
    }

    /* Import tabs carry the "receiving" color: green. */
    .io-tab.import {
        color: var(--success-text);
    }

    .io-tab.import:hover {
        background: var(--success-hover);
        color: var(--success-text);
    }

    .io-tab.import.active {
        background: var(--success-bg);
        color: var(--success-text);
    }
</style>
