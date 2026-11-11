<script lang="ts">
    import { resolve } from "$app/paths";
    import { chapterMeta, neighbors } from "#lib/utils/docs";

    let { data }: { data: { slug: string } } = $props();

    const meta = $derived(chapterMeta(data.slug));
    const pager = $derived(neighbors(data.slug));
</script>

<svelte:head>
    <title>{meta.title} – NSC</title>
    {#if meta.description}
        <meta name="description" content={meta.description} />
    {/if}
</svelte:head>

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
    <a href={resolve("/docs")}>← Alle Kapitel</a>
</p>

<article class="docs-content">
    {#if meta.mod}
        <svelte:component this={meta.mod.default} />
    {/if}
</article>

<nav class="docs-pager" aria-label="Weitere Kapitel">
    {#if pager.prev}
        <a
            class="pager-link"
            href={resolve("/docs/[slug]", { slug: pager.prev.slug })}
        >
            ← {pager.prev.title}
        </a>
    {:else}
        <span></span>
    {/if}
    <a class="pager-all" href={resolve("/docs")}>Alle Kapitel</a>
    {#if pager.next}
        <a
            class="pager-link"
            href={resolve("/docs/[slug]", { slug: pager.next.slug })}
        >
            {pager.next.title} →
        </a>
    {:else}
        <span></span>
    {/if}
</nav>

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

    .docs-pager {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;

        margin-top: 2.5rem;
        padding-top: 1.25rem;
        border-top: 1px solid var(--border);
    }

    .docs-pager a {
        color: var(--primary);
        font-size: 0.9rem;
        text-decoration: none;
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
</style>
