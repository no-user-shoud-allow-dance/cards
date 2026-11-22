<script lang="ts">
    import { resolve } from "$app/paths";
    import { PageHeader, chapterMeta, chapters, routeIdOf } from "#components";
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
    subtitle="Anleitungen für alle – und technischer Hintergrund für Entwickler:innen."
/>

<ul class="chapter-list">
    {#each chapters as chapter (chapter.slug)}
        {@const meta = chapterMeta(chapter.slug)}
        <li class="chapter">
            {#if meta.icon}
                <img class="chapter-icon" src={meta.icon} alt="" width="40" height="40" />
            {/if}
            <div class="chapter-text">
                <a class="chapter-link" href={resolve(routeIdOf(chapter.slug) as "/(docs)/docs")}>
                    {meta.title}
                </a>
                {#if meta.description}
                    <span class="chapter-desc">{meta.description}</span>
                {/if}
            </div>
        </li>
    {/each}
</ul>

<style lang="postcss">
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

        &:hover {
            transform: scale(1.02);

            & .chapter-icon {
                transform: scale(1.12) rotate(-5deg);
            }
        }

        &:active {
            transform: scale(0.97);

            & .chapter-icon {
                transform: scale(0.95);
            }
        }
    }

    .chapter-link {
        color: var(--text);
        font-weight: 600;
        text-decoration: none;

        &:focus-visible::after {
            outline: 3px solid var(--focus-ring);
            outline-offset: 3px;
        }

        &:hover {
            color: var(--primary);
        }
    }

    /* Stretch the link over the whole card so the entire li is clickable. */
    .chapter-link::after {
        content: "";

        position: absolute;
        inset: 0;

        border-radius: var(--radius-lg);
    }

    .chapter-icon {
        flex: 0 0 auto;
        width: 2.5rem;
        height: 2.5rem;

        transition: transform var(--transition-spring);
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
