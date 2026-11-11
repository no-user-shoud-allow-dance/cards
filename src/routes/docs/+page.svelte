<script lang="ts" module>
    export const prerender = true;
</script>

<script lang="ts">
    import { resolve } from "$app/paths";
    import PageHeader from "#lib/components/shared/ui/PageHeader.svelte";
    import { chapterMeta, slugs } from "#lib/utils/docs";

    // Chapter order comes from the numeric prefix of the file name.
    const chapters = slugs.map((slug) => {
        const meta = chapterMeta(slug);
        return {
            slug,
            title: meta.title,
            description: meta.description,
            icon: meta.icon,
        };
    });
</script>

<svelte:head>
    <title>Dokumentation – NSC</title>
    <meta
        name="description"
        content="Anleitungen zu NSC für alle und technischer Hintergrund für Entwickler:innen."
    />
</svelte:head>

<PageHeader
        title="Dokumentation"
        subtitle="Anleitungen für alle — und technischer Hintergrund für Entwickler:innen."
    />

    <ul class="chapter-list">
        {#each chapters as chapter (chapter.slug)}
            <li class="chapter">
                {#if chapter.icon}
                    <img
                        class="chapter-icon"
                        src={chapter.icon}
                        alt=""
                        width="40"
                        height="40"
                    />
                {/if}
                <div class="chapter-text">
                    <a
                        class="chapter-link"
                        href={resolve("/docs/[slug]", { slug: chapter.slug })}
                    >
                        {chapter.title}
                    </a>
                    {#if chapter.description}
                        <span class="chapter-desc">{chapter.description}</span>
                    {/if}
                </div>
            </li>
        {/each}
    </ul>

<style>
    .chapter-list {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;

        margin: 0;
        padding: 0;
        list-style: none;
    }

    .chapter {
        position: relative;

        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.9rem;

        padding: 0.8rem 1rem;

        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        background: var(--surface);
        box-shadow: var(--shadow-card);

        transition: transform var(--transition-spring);
    }

    .chapter:hover {
        transform: scale(1.02);
    }

    .chapter:active {
        transform: scale(0.97);
    }

    .chapter-link {
        color: var(--text);
        font-weight: 600;
        text-decoration: none;
    }

    /* Stretch the link over the whole card so the entire li is clickable. */
    .chapter-link::after {
        content: "";

        position: absolute;
        inset: 0;

        border-radius: var(--radius-lg);
    }

    .chapter-link:focus-visible::after {
        outline: 3px solid var(--focus-ring);
        outline-offset: 3px;
    }

    .chapter-link:hover {
        color: var(--primary);
    }

    .chapter-icon {
        flex: 0 0 auto;
        width: 2.5rem;
        height: 2.5rem;

        transition: transform var(--transition-spring);
    }

    .chapter:hover .chapter-icon {
        transform: scale(1.12) rotate(-5deg);
    }

    .chapter:active .chapter-icon {
        transform: scale(0.95);
    }

    .chapter-text {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
    }

    .chapter-desc {
        color: var(--text-muted);
        font-size: 0.88rem;
    }
</style>
