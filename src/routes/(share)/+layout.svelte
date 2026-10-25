<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { resolve } from "$app/paths";
    import { userDecks } from "#lib/store/userDecks.svelte";
    import Page from "#lib/components/shared/Page.svelte";

    let { children } = $props();

    // Decks live only in this browser (IndexedDB); wait for them so the
    // export deck pickers never render against an empty store.
    let ready = $state(false);

    onMount(() => {
        userDecks.init().then(() => {
            ready = true;
        });
    });

    // Route ids include the (share) group; the URLs do not.
    const tabs = [
        { href: resolve("/(share)/import/deck"), label: "Stapel importieren" },
        {
            href: resolve("/(share)/import/progress"),
            label: "Fortschritt importieren",
        },
        { href: resolve("/(share)/export/deck"), label: "Stapel exportieren" },
        {
            href: resolve("/(share)/export/progress"),
            label: "Fortschritt exportieren",
        },
    ];
</script>

{#if ready}
    <Page>
        <nav class="share-tabs" aria-label="Teilen und importieren">
            {#each tabs as tab (tab.href)}
                <a
                    class="share-tab"
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
    .share-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;

        margin-bottom: 2rem;
    }

    .share-tab {
        padding: 0.5rem 1rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-pill);

        background: var(--surface);
        color: var(--text-muted);

        font-size: 0.85rem;
        font-weight: 600;
        text-decoration: none;

        transition:
            border-color var(--transition-fast),
            background var(--transition-fast),
            color var(--transition-fast);
    }

    .share-tab:hover {
        border-color: var(--border-strong);
        color: var(--text);
    }

    .share-tab.active {
        border-color: var(--primary);
        background: var(--primary-soft);
        color: var(--info-text);
    }
</style>
