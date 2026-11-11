<script lang="ts" module>
    import type { Component } from "svelte";

    interface DocModule {
        default: Component;
        metadata?: { title?: string; description?: string; icon?: string };
    }

    // All docs chapters, compiled from markdown by mdsvex (vite.config.ts).
    const docs = import.meta.glob("/docs/*.md", {
        eager: true,
    }) as Record<string, DocModule>;
</script>

<script lang="ts">
    import { resolve } from "$app/paths";
    import Page from "#lib/components/shared/ui/Page.svelte";

    let { data }: { data: { slug: string } } = $props();

    const mod = $derived(docs[`/docs/${data.slug}.md`]);
    const title = $derived(mod?.metadata?.title ?? "Dokumentation");
    const description = $derived(mod?.metadata?.description ?? "");
    const icon = $derived(mod?.metadata?.icon ?? "");
</script>

<svelte:head>
    <title>{title} – NSC</title>
    {#if description}
        <meta name="description" content={description} />
    {/if}
</svelte:head>

<Page>
    <header class="doc-header" class:with-icon={icon !== ""}>
        {#if icon}
            <img class="doc-icon" src={icon} alt="" width="56" height="56" />
        {/if}
        <h1 class="doc-title">{title}</h1>
        {#if description}
            <p class="doc-subtitle">{description}</p>
        {/if}
    </header>

    <p class="docs-back">
        <a href={resolve("/docs")}>← Alle Kapitel</a>
    </p>

    <article class="docs-content">
        {#if mod}
            <svelte:component this={mod.default} />
        {/if}
    </article>
</Page>

<style>
    /* Grid layout: the icon spans both rows in the first column; the
       title sits in row 1 / column 2, the description in row 2 / column 2.
       The bottom spacing lives on the header, not the subtitle, so it
       does not inflate the second row and push the icon down. */
    .doc-header {
        margin: 0 0 1.75rem;
    }

    .doc-header.with-icon {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto;
        align-items: center;
        column-gap: 1rem;
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
        font-size: 0.95rem;
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
        font-size: 0.9rem;
    }

    .docs-back a {
        color: var(--primary);
        text-decoration: none;
    }

    .docs-back a:hover {
        text-decoration: underline;
    }
</style>
